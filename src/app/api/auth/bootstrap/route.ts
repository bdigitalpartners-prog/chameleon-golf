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

    // First, check what columns the users table has
    const usersColumns: any[] = await prisma.$queryRawUnsafe(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position`
    );
    const colNames = usersColumns.map((c: any) => c.column_name);

    // Also check auth_users columns
    const authColumns: any[] = await prisma.$queryRawUnsafe(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'auth_users' ORDER BY ordinal_position`
    );
    const authColNames = authColumns.map((c: any) => c.column_name);

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
    // Use the correct column name based on what actually exists
    let usersResult = "skipped";
    if (colNames.includes("email")) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO users (email, role) VALUES ($1, 'admin') ON CONFLICT (email) DO UPDATE SET role = 'admin'`,
        email
      );
      usersResult = "updated via email column";
    } else if (colNames.includes("name")) {
      // Maybe there's a different identifier — just update role where we can find the user
      const existingUser: any[] = await prisma.$queryRawUnsafe(
        `SELECT id, name, role FROM users LIMIT 10`
      );
      usersResult = JSON.stringify(existingUser);
    }

    return NextResponse.json({
      success: true,
      updated,
      created,
      usersResult,
      usersColumns: colNames,
      authUsersColumns: authColNames,
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
