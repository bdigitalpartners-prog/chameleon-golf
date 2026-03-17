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
    const { ids, isActive } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids array is required" }, { status: 400 });
    }
    if (typeof isActive !== "boolean") {
      return NextResponse.json({ error: "isActive boolean is required" }, { status: 400 });
    }

    const numericIds = ids.map((id: unknown) => Number(id)).filter((id: number) => !isNaN(id));

    const result = await prisma.courseMedia.updateMany({
      where: { mediaId: { in: numericIds } },
      data: { isActive },
    });

    return NextResponse.json({ updated: result.count });
  } catch (err) {
    console.error("Image toggle error:", err);
    return NextResponse.json({ error: "Failed to toggle images" }, { status: 500 });
  }
}
