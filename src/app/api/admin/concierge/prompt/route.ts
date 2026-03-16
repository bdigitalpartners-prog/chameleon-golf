import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const rows = await prisma.$queryRaw<Array<{ value: string }>>`
      SELECT value FROM admin_config WHERE key = 'concierge_system_prompt'
    `;
    return NextResponse.json({ prompt: rows[0]?.value || null });
  } catch {
    return NextResponse.json({ prompt: null });
  }
}

export async function PUT(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const { prompt } = await request.json();

    if (prompt === null || prompt === "") {
      // Reset to default: delete the custom prompt
      await prisma.$executeRawUnsafe(
        `DELETE FROM admin_config WHERE key = 'concierge_system_prompt'`
      );
      return NextResponse.json({ success: true, reset: true });
    }

    await prisma.$executeRawUnsafe(
      `INSERT INTO admin_config (key, value, updated_at, updated_by)
       VALUES ('concierge_system_prompt', $1, NOW(), 'admin')
       ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW(), updated_by = 'admin'`,
      prompt
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Prompt update error:", err);
    return NextResponse.json({ error: "Failed to update prompt" }, { status: 500 });
  }
}
