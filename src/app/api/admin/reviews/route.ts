import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const tab = searchParams.get("tab") || "all";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "25", 10);

  try {
    if (tab === "scores") {
      const status = searchParams.get("status") || "unverified";
      const where: any = { verificationStatus: status };

      const [scores, total] = await Promise.all([
        prisma.postedScore.findMany({
          where,
          include: {
            user: { select: { id: true, name: true, email: true } },
            course: { select: { courseId: true, courseName: true } },
          },
          orderBy: { createdAt: "desc" },
          take: limit,
          skip: (page - 1) * limit,
        }),
        prisma.postedScore.count({ where }),
      ]);

      return NextResponse.json({
        scores: scores.map((s) => ({
          scoreId: s.scoreId,
          userId: s.userId,
          userName: s.user.name,
          courseId: s.courseId,
          courseName: s.course.courseName,
          totalScore: s.totalScore,
          datePlayed: s.datePlayed,
          verificationMethod: s.verificationMethod,
          verificationStatus: s.verificationStatus,
          screenshotUrl: s.screenshotUrl,
          createdAt: s.createdAt,
        })),
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    }

    // Default: all reviews tab
    const search = searchParams.get("search") || "";
    const published = searchParams.get("published");

    const where: any = {};
    if (search) {
      where.OR = [
        { course: { courseName: { contains: search, mode: "insensitive" } } },
        { user: { name: { contains: search, mode: "insensitive" } } },
        { reviewTitle: { contains: search, mode: "insensitive" } },
      ];
    }
    if (published === "true") where.isPublished = true;
    if (published === "false") where.isPublished = false;

    const seed = searchParams.get("seed");
    if (seed === "true") where.isSeed = true;
    if (seed === "false") where.isSeed = false;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [ratings, total, totalAll, avgRating, ratingsThisMonth, pendingScores] = await Promise.all([
      prisma.userCourseRating.findMany({
        where,
        include: {
          user: { select: { id: true, name: true } },
          course: { select: { courseId: true, courseName: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.userCourseRating.count({ where }),
      prisma.userCourseRating.count(),
      prisma.userCourseRating.aggregate({ _avg: { overallRating: true } }),
      prisma.userCourseRating.count({ where: { createdAt: { gte: monthStart } } }),
      prisma.postedScore.count({ where: { verificationStatus: "unverified" } }),
    ]);

    return NextResponse.json({
      ratings: ratings.map((r) => ({
        ratingId: r.ratingId,
        userId: r.userId,
        userName: r.user.name,
        courseId: r.courseId,
        courseName: r.course.courseName,
        overallRating: Number(r.overallRating),
        conditioning: r.conditioning ? Number(r.conditioning) : null,
        layoutDesign: r.layoutDesign ? Number(r.layoutDesign) : null,
        value: r.value ? Number(r.value) : null,
        reviewTitle: r.reviewTitle,
        isPublished: r.isPublished,
        isSeed: r.isSeed,
        seedSource: r.seedSource,
        seedReviewerName: r.seedReviewerName,
        createdAt: r.createdAt,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats: {
        totalRatings: totalAll,
        avgOverallRating: avgRating._avg.overallRating ? Number(avgRating._avg.overallRating) : 0,
        ratingsThisMonth,
        pendingScores,
      },
    });
  } catch (err: any) {
    console.error("Reviews error:", err);
    return NextResponse.json({ 
      error: "Failed to fetch reviews", 
      detail: err?.message || String(err),
      code: err?.code 
    }, { status: 500 });
  }
}
