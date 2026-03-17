import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  const courseId = parseInt(params.id, 10);
  if (isNaN(courseId)) {
    return NextResponse.json({ error: "Invalid course ID" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { url, caption, credit, mediaType, imageType, isPrimary, sortOrder } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Verify the course exists
    const course = await prisma.course.findUnique({ where: { courseId } });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // If setting as primary, unset existing primary
    if (isPrimary) {
      await prisma.courseMedia.updateMany({
        where: { courseId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    // Get next sort order if not provided
    let finalSortOrder = sortOrder;
    if (finalSortOrder === undefined || finalSortOrder === null) {
      const maxSort = await prisma.courseMedia.aggregate({
        where: { courseId },
        _max: { sortOrder: true },
      });
      finalSortOrder = (maxSort._max.sortOrder ?? -1) + 1;
    }

    const media = await prisma.courseMedia.create({
      data: {
        courseId,
        url: url.trim(),
        caption: caption?.trim() || null,
        credit: credit?.trim() || null,
        mediaType: mediaType || "image",
        imageType: imageType || null,
        isPrimary: isPrimary || false,
        sortOrder: finalSortOrder,
        uploadedBy: "admin",
      },
    });

    return NextResponse.json(media, { status: 201 });
  } catch (err) {
    console.error("Media create error:", err);
    return NextResponse.json({ error: "Failed to add media" }, { status: 500 });
  }
}
