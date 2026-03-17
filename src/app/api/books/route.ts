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

    const where: any = {};
    if (architectId) {
      where.architects = { some: { architectId: parseInt(architectId) } };
    }
    if (courseId) {
      where.courses = { some: { courseId: parseInt(courseId) } };
    }

    const books = await prisma.book.findMany({
      where,
      include: {
        architects: { include: { architect: { select: { id: true, name: true, slug: true } } } },
        courses: { include: { course: { select: { courseId: true, courseName: true } } } },
      },
      orderBy: [{ isFeatured: "desc" }, { yearPublished: "desc" }],
    });

    return NextResponse.json(books);
  } catch (err) {
    console.error("Books fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch books" }, { status: 500 });
  }
}
