import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "course_media" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "course_media" ADD COLUMN IF NOT EXISTS "source_url" VARCHAR(500)`);

    const body = await request.json();
    const { sourceName, isActive } = body;

    if (!sourceName || typeof sourceName !== "string") {
      return NextResponse.json({ error: "sourceName is required" }, { status: 400 });
    }
    if (typeof isActive !== "boolean") {
      return NextResponse.json({ error: "isActive boolean is required" }, { status: 400 });
    }

    const result = await prisma.courseMedia.updateMany({
      where: { sourceName },
      data: { isActive },
    });

    return NextResponse.json({ updated: result.count, sourceName, isActive });
  } catch (err) {
    console.error("Source toggle error:", err);
    return NextResponse.json({ error: "Failed to toggle source" }, { status: 500 });
  }
}
