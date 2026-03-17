import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; mediaId: string } }
) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  const courseId = parseInt(params.id, 10);
  const mediaId = parseInt(params.mediaId, 10);
  if (isNaN(courseId) || isNaN(mediaId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    // Verify media belongs to this course
    const media = await prisma.courseMedia.findFirst({
      where: { mediaId, courseId },
    });
    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    await prisma.courseMedia.delete({ where: { mediaId } });

    return NextResponse.json({ success: true, mediaId });
  } catch (err) {
    console.error("Media delete error:", err);
    return NextResponse.json({ error: "Failed to delete media" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; mediaId: string } }
) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  const courseId = parseInt(params.id, 10);
  const mediaId = parseInt(params.mediaId, 10);
  if (isNaN(courseId) || isNaN(mediaId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    // Verify media belongs to this course
    const existing = await prisma.courseMedia.findFirst({
      where: { mediaId, courseId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    const body = await request.json();
    const updateData: Record<string, any> = {};

    if (body.caption !== undefined) updateData.caption = body.caption?.trim() || null;
    if (body.credit !== undefined) updateData.credit = body.credit?.trim() || null;
    if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder;
    if (body.isPrimary !== undefined) {
      updateData.isPrimary = body.isPrimary;
      // If setting as primary, unset others
      if (body.isPrimary) {
        await prisma.courseMedia.updateMany({
          where: { courseId, isPrimary: true, NOT: { mediaId } },
          data: { isPrimary: false },
        });
      }
    }

    const media = await prisma.courseMedia.update({
      where: { mediaId },
      data: updateData,
    });

    return NextResponse.json(media);
  } catch (err) {
    console.error("Media update error:", err);
    return NextResponse.json({ error: "Failed to update media" }, { status: 500 });
  }
}
