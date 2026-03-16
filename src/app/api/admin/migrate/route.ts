import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const key = req.headers.get("x-admin-key") || req.nextUrl.searchParams.get("key");
  if (key !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: string[] = [];

  try {
    // Logo fields on courses table
    const logoMigrations = [
      `ALTER TABLE courses ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500)`,
      `ALTER TABLE courses ADD COLUMN IF NOT EXISTS logo_local_path VARCHAR(500)`,
      `ALTER TABLE courses ADD COLUMN IF NOT EXISTS logo_source VARCHAR(200)`,
      `ALTER TABLE courses ADD COLUMN IF NOT EXISTS logo_background_color VARCHAR(20)`,
    ];

    for (const sql of logoMigrations) {
      await prisma.$executeRawUnsafe(sql);
      results.push(`OK: ${sql.substring(0, 60)}...`);
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message, results },
      { status: 500 }
    );
  }
}
