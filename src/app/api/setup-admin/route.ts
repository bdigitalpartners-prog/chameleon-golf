import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

const HARDCODED_SECRET = "golfeq-admin-setup-2026";

export async function POST(req: NextRequest) {
  try {
    const { email, secret } = await req.json();

    const expectedSecret = process.env.ADMIN_SETUP_SECRET || HARDCODED_SECRET;

    if (!secret || secret !== expectedSecret) {
      return NextResponse.json({ error: "Invalid secret" }, { status: 403 });
    }

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      const updated = await prisma.user.update({
        where: { email },
        data: { role: "admin" },
      });
      return NextResponse.json({
        message: "User promoted to admin",
        userId: updated.id,
        email: updated.email,
        role: updated.role,
      });
    }

    const newUser = await prisma.user.create({
      data: { email, role: "admin" },
    });
    return NextResponse.json({
      message: "Admin user created",
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });
  } catch (error) {
    console.error("Admin setup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
