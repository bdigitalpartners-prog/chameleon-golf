import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

/**
 * One-time bootstrap endpoint — resets admin password.
 * TEMPORARY: Remove after use.
 */
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== "bootstrap-2026-xyz") {
    return NextResponse.json({ error: "no" }, { status: 403 });
  }

  try {
    const email = "calvin@bdigitalpartners.com";
    const newPassword = "TempAdmin2026!";
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Check ADMIN_API_KEY for debugging
    const envKey = process.env.ADMIN_API_KEY;

    // Update auth_users password
    const updated = await prisma.$executeRawUnsafe(
      `UPDATE "auth_users" SET password_hash = $1, updated_at = NOW() WHERE email = $2`,
      passwordHash,
      email
    );

    let created = false;
    if (updated === 0) {
      const id = crypto.randomUUID();
      await prisma.$executeRawUnsafe(
        `INSERT INTO "auth_users" (id, email, password_hash, first_name, last_name)
         VALUES ($1, $2, $3, 'Calvin', 'Admin')
         ON CONFLICT (email) DO UPDATE SET password_hash = $3, updated_at = NOW()`,
        id,
        email,
        passwordHash
      );
      created = true;
    }

    // Ensure user exists in users table with admin role
    await prisma.$executeRaw`
      INSERT INTO users (email, role)
      VALUES (${email}, 'admin')
      ON CONFLICT (email) DO UPDATE SET role = 'admin'
    `;

    return NextResponse.json({
      success: true,
      updated,
      created,
      debug: {
        ADMIN_API_KEY_set: envKey !== undefined,
        ADMIN_API_KEY_value: envKey ? envKey.substring(0, 5) + "..." : "(not set)",
        ADMIN_API_KEY_length: envKey?.length ?? 0,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, stack: error.stack?.substring(0, 500) }, { status: 500 });
  }
}
