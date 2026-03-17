export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("s");
  if (secret !== "diag-2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: { sql: string; status: string }[] = [];

  // List of ALTER TABLE statements for missing columns
  const migrations = [
    `ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "average_round_time" TEXT`,
  ];

  for (const sql of migrations) {
    try {
      await prisma.$executeRawUnsafe(sql);
      results.push({ sql, status: "OK" });
    } catch (e: any) {
      results.push({ sql, status: `ERROR: ${e.message}` });
    }
  }

  return NextResponse.json({ results });
}
