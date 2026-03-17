import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const architectId = url.searchParams.get("architectId");
    const courseId = url.searchParams.get("courseId");

    if (!architectId && !courseId) {
      return NextResponse.json({ error: "architectId or courseId required" }, { status: 400 });
    }

    const where: any = { isApproved: true };
    if (architectId) {
      where.architects = { some: { architectId: parseInt(architectId) } };
    }
    if (courseId) {
      where.courses = { some: { courseId: parseInt(courseId) } };
    }

    const content = await prisma.externalContent.findMany({
      where,
      include: {
        architects: { include: { architect: { select: { id: true, name: true, slug: true } } } },
        courses: { include: { course: { select: { courseId: true, courseName: true } } } },
      },
      orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
    });

    // Group by content type
    const grouped: Record<string, typeof content> = {};
    for (const item of content) {
      const type = item.contentType;
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push(item);
    }

    return NextResponse.json({ content, grouped });
  } catch (err) {
    console.error("Content fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch content" }, { status: 500 });
  }
}
