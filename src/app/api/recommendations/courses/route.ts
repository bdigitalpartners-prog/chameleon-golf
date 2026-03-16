import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;
    const { searchParams } = new URL(request.url);
    const circleId = searchParams.get("circleId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

    const where: any = { userId, dismissed: false };
    if (circleId) where.sourceCircleId = circleId;

    const [recommendations, total] = await Promise.all([
      prisma.courseRecommendation.findMany({
        where,
        include: {
          course: {
            select: {
              courseId: true,
              courseName: true,
              city: true,
              state: true,
              country: true,
              courseType: true,
              courseStyle: true,
              logoUrl: true,
              numListsAppeared: true,
            },
          },
          sourceCircle: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { score: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.courseRecommendation.count({ where }),
    ]);

    return NextResponse.json({
      recommendations,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Failed to fetch recommendations:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
