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

    // Use raw SQL to avoid Prisma relation errors when user_ids don't exist in users table
    // (seeded reviews may reference fake user IDs)
    const offset = (page - 1) * limit;
    
    const [ratingsRaw, totalAll, avgRating, ratingsThisMonth, pendingScores] = await Promise.all([
      prisma.$queryRawUnsafe<any[]>(`
        SELECT r.rating_id, r.user_id, u.name as user_name, r.course_id, c.course_name,
               r.overall_rating, r.conditioning, r.layout_design, r.value,
               r.review_title, r.is_published, r.is_seed, r.seed_source, 
               r.seed_reviewer_name, r.created_at
        FROM user_course_ratings r
        LEFT JOIN users u ON r.user_id = u.id
        LEFT JOIN courses c ON r.course_id = c.course_id
        ORDER BY r.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `),
      prisma.userCourseRating.count(),
      prisma.userCourseRating.aggregate({ _avg: { overallRating: true } }),
      prisma.userCourseRating.count({ where: { createdAt: { gte: monthStart } } }),
      prisma.postedScore.count({ where: { verificationStatus: "unverified" } }),
    ]);

    const total = totalAll; // For unfiltered, total == totalAll

    return NextResponse.json({
      ratings: ratingsRaw.map((r: any) => ({
        ratingId: r.rating_id,
        userId: r.user_id,
        userName: r.user_name || r.seed_reviewer_name || "Unknown",
        courseId: r.course_id,
        courseName: r.course_name || "Unknown Course",
        overallRating: r.overall_rating ? Number(r.overall_rating) : 0,
        conditioning: r.conditioning ? Number(r.conditioning) : null,
        layoutDesign: r.layout_design ? Number(r.layout_design) : null,
        value: r.value ? Number(r.value) : null,
        reviewTitle: r.review_title,
        isPublished: r.is_published,
        isSeed: r.is_seed,
        seedSource: r.seed_source,
        seedReviewerName: r.seed_reviewer_name,
        createdAt: r.created_at,
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
