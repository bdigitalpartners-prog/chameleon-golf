import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  if (q.length < 2) return NextResponse.json({ results: [] });

  const courses = await prisma.course.findMany({
    where: {
      OR: [
        { courseName: { contains: q, mode: "insensitive" } },
        { facilityName: { contains: q, mode: "insensitive" } },
        { city: { contains: q, mode: "insensitive" } },
        { state: { contains: q, mode: "insensitive" } },
      ],
    },
    select: {
      courseId: true,
      courseName: true,
      city: true,
      state: true,
      country: true,
    },
    take: 10,
    orderBy: { numListsAppeared: "desc" },
  });

  return NextResponse.json({ results: courses });
}
