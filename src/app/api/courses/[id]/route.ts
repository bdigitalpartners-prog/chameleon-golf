import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const courseId = parseInt(params.id);
  if (isNaN(courseId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const course = await prisma.course.findUnique({
    where: { courseId },
    include: {
      rankings: { include: { list: { include: { source: true } } } },
      media: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
      chameleonScores: true,
      ratings: { where: { isActive: true }, orderBy: { createdAt: "desc" }, take: 20 },
    },
  });

  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(course);
}
