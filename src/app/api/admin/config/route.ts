import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

interface AdminConfigRow {
  key: string;
  value: string;
  updated_at: Date;
  updated_by: string | null;
}

export async function GET(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const rows = await prisma.$queryRaw<AdminConfigRow[]>`
      SELECT key, value, updated_at, updated_by FROM admin_config ORDER BY key
    `;

    const config: Record<string, string> = {};
    for (const row of rows) {
      config[row.key] = row.value;
    }

    return NextResponse.json(config);
  } catch {
    return NextResponse.json({ error: "admin_config table may not exist. Hit POST /api/admin/setup first." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { key, value } = body as { key: string; value: string };

    if (!key || value === undefined) {
      return NextResponse.json({ error: "key and value are required" }, { status: 400 });
    }

    await prisma.$executeRawUnsafe(
      `INSERT INTO admin_config (key, value, updated_at, updated_by)
       VALUES ($1, $2, NOW(), $3)
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW(), updated_by = $3`,
      key,
      String(value),
      "admin"
    );

    return NextResponse.json({ success: true, key, value });
  } catch (err) {
    console.error("Config update error:", err);
    return NextResponse.json({ error: "Failed to update config" }, { status: 500 });
  }
}
