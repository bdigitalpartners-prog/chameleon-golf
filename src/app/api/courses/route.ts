import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "24"), 100);
  const state = searchParams.get("state");
  const country = searchParams.get("country");
  const courseType = searchParams.get("courseType");
  const accessType = searchParams.get("accessType");
  const minScore = searchParams.get("minScore");
  const maxScore = searchParams.get("maxScore");
  const sortBy = searchParams.get("sortBy") ?? "chameleonScore";
  const search = searchParams.get("search");

  const where: any = {};
  if (state) where.state = state;
  if (country) where.country = country;
  if (courseType) where.courseType = courseType;
  if (accessType) where.accessType = accessType;
  if (search) {
    where.OR = [
      { courseName: { contains: search, mode: "insensitive" } },
      { city: { contains: search, mode: "insensitive" } },
      { state: { contains: search, mode: "insensitive" } },
    ];
  }

  const orderBy: any =
    sortBy === "chameleonScore"
      ? { chameleonScores: { chameleonScore: "desc" } }
      : sortBy === "name"
      ? { courseName: "asc" }
      : sortBy === "numListsAppeared"
      ? { numListsAppeared: "desc" }
      : { chameleonScores: { chameleonScore: "desc" } };

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where,
      include: {
        chameleonScores: true,
        media: { where: { isPrimary: true }, take: 1 },
        _count: { select: { ratings: true } },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.course.count({ where }),
  ]);

  return NextResponse.json({
    courses,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
