import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

interface FeeEntry {
  course_id: number;
  fee_type: string;
  amount: number;
  currency?: string;
  season?: string;
  effective_date?: string;
  source?: string;
}

export async function POST(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  let body: { fees: FeeEntry[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.fees || !Array.isArray(body.fees)) {
    return NextResponse.json({ error: "fees array is required" }, { status: 400 });
  }

  try {
    let imported = 0;
    for (const fee of body.fees) {
      if (!fee.course_id || !fee.fee_type || !fee.amount) continue;

      await prisma.$queryRawUnsafe(
        `INSERT INTO green_fee_history (course_id, fee_type, amount, currency, season, effective_date, source, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        fee.course_id,
        fee.fee_type,
        fee.amount,
        fee.currency || "USD",
        fee.season || null,
        fee.effective_date || null,
        fee.source || "admin_import"
      );
      imported++;
    }

    // Recalculate value index for affected courses
    const courseIds = [...new Set(body.fees.map((f) => f.course_id))];
    for (const cid of courseIds) {
      const fees = await prisma.$queryRawUnsafe<any[]>(
        `SELECT AVG(amount) as avg_fee FROM green_fee_history WHERE course_id = $1 AND fee_type = 'standard_18'`,
        cid
      );

      const avgFee = fees[0]?.avg_fee || 0;

      // Simple value score: higher EQ per dollar = better value
      // For now, use inverse price as proxy (will enhance when EQ scores are available)
      const valueScore = avgFee > 0 ? Math.round(Math.max(0, Math.min(100, 100 - (avgFee / 5)))) : 50;

      await prisma.$queryRawUnsafe(
        `INSERT INTO green_fee_value_index (course_id, current_avg_fee, value_score, price_trend, updated_at)
         VALUES ($1, $2, $3, 'stable', NOW())
         ON CONFLICT (course_id) DO UPDATE SET
           current_avg_fee = EXCLUDED.current_avg_fee,
           value_score = EXCLUDED.value_score,
           updated_at = NOW()`,
        cid,
        avgFee,
        valueScore
      );
    }

    return NextResponse.json({ success: true, imported, recalculated: courseIds.length });
  } catch (err) {
    console.error("Error importing green fees:", err);
    return NextResponse.json({ error: "Failed to import fees" }, { status: 500 });
  }
}
