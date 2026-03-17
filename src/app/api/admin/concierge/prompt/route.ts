import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authErr = await checkAdminAuth(request);
  if (authErr) return authErr;

  try {
    const rows = await prisma.$queryRaw<{ value: string }[]>`
      SELECT value FROM admin_config WHERE key = 'concierge_system_prompt'
    `;

    return NextResponse.json({
      prompt: rows.length > 0 ? rows[0].value : null,
      isCustom: rows.length > 0,
    });
  } catch (err) {
    console.error("Prompt GET error:", err);
    return NextResponse.json({ error: "Failed to fetch prompt" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const authErr = await checkAdminAuth(request);
  if (authErr) return authErr;

  try {
    const { prompt } = await request.json();

    if (prompt === null || prompt === undefined) {
      // Delete custom prompt (reset to default)
      await prisma.$executeRawUnsafe(
        `DELETE FROM admin_config WHERE key = 'concierge_system_prompt'`
      );
      return NextResponse.json({ success: true, reset: true });
    }

    if (typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json({ error: "prompt must be a non-empty string" }, { status: 400 });
    }

    await prisma.$executeRawUnsafe(
      `INSERT INTO admin_config (key, value, updated_at, updated_by)
       VALUES ('concierge_system_prompt', $1, NOW(), 'admin')
       ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW(), updated_by = 'admin'`,
      prompt
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Prompt PUT error:", err);
    return NextResponse.json({ error: "Failed to update prompt" }, { status: 500 });
  }
}
