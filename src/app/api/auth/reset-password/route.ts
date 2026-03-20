import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

/**
 * Password reset endpoint — secured with ADMIN_API_KEY.
 */
export async function POST(req: NextRequest) {
  const adminKey = req.headers.get("x-admin-key");
  const envKey = process.env.ADMIN_API_KEY || "golfEQ-admin-2026-secure";

  console.log("[reset-password] adminKey from header:", JSON.stringify(adminKey));
  console.log("[reset-password] envKey resolved to:", JSON.stringify(envKey));
  console.log("[reset-password] ADMIN_API_KEY env raw:", JSON.stringify(process.env.ADMIN_API_KEY));
  console.log("[reset-password] match:", adminKey === envKey);

  if (adminKey !== envKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { email, newPassword } = await req.json();

    if (!email || !newPassword) {
      return NextResponse.json(
        { error: "email and newPassword required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update auth_users password
    const result = await prisma.$executeRawUnsafe(
      `UPDATE "auth_users" SET password_hash = $1, updated_at = NOW() WHERE email = $2`,
      passwordHash,
      trimmedEmail
    );

    if (result === 0) {
      // Account doesn't exist — create it
      const id = crypto.randomUUID();
      await prisma.$executeRawUnsafe(
        `INSERT INTO "auth_users" (id, email, password_hash, first_name, last_name)
         VALUES ($1, $2, $3, 'Admin', 'User')
         ON CONFLICT (email) DO UPDATE SET password_hash = $3, updated_at = NOW()`,
        id,
        trimmedEmail,
        passwordHash
      );
    }

    // Ensure user exists in users table with admin role
    await prisma.$executeRaw`
      INSERT INTO users (email, role)
      VALUES (${trimmedEmail}, 'admin')
      ON CONFLICT (email) DO UPDATE SET role = 'admin'
    `;

    return NextResponse.json({ success: true, message: "Password set and admin role confirmed" });
  } catch (error: any) {
    console.error("POST /api/auth/reset-password error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
