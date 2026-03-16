import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getCircleRecommendations, getPeopleRecommendations } from "@/lib/recommendations";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    // Get user's circle IDs for trending
    const memberships = await prisma.circleMembership.findMany({
      where: { userId, role: { in: ["OWNER", "ADMIN", "MEMBER"] } },
      select: { circleId: true },
    });
    const circleIds = memberships.map((m) => m.circleId);

    // Run all queries in parallel
    const [courseRecs, circleRecs, peopleRecs, trendingPosts, hiddenGems] =
      await Promise.all([
        // Course recommendations
        prisma.courseRecommendation.findMany({
          where: { userId, dismissed: false },
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
              },
            },
            sourceCircle: { select: { id: true, name: true, slug: true } },
          },
          orderBy: { score: "desc" },
          take: 8,
        }),

        // Circle recommendations
        getCircleRecommendations(userId),

        // People recommendations
        getPeopleRecommendations(userId),

        // Trending in circles (most fist-bumped posts this week)
        circleIds.length > 0
          ? prisma.post.findMany({
              where: {
                circleId: { in: circleIds },
                createdAt: {
                  gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                },
              },
              include: {
                author: {
                  select: { id: true, name: true, image: true },
                },
                circle: { select: { id: true, name: true, slug: true } },
                _count: { select: { fistBumps: true, comments: true } },
              },
              orderBy: { fistBumpCount: "desc" },
              take: 5,
            })
          : [],

        // Hidden gems: highly rated by circles but not nationally ranked
        prisma.course.findMany({
          where: {
            numListsAppeared: { lte: 2 },
            circleCourseAggregates: {
              some: { avgScore: { gte: 8 }, ratingCount: { gte: 3 } },
            },
          },
          include: {
            circleCourseAggregates: {
              select: { avgScore: true, ratingCount: true },
              orderBy: { avgScore: "desc" },
              take: 1,
            },
          },
          take: 6,
        }),
      ]);

    return NextResponse.json({
      courseRecommendations: courseRecs,
      suggestedCircles: circleRecs.slice(0, 6),
      peopleYouMayKnow: peopleRecs.slice(0, 8),
      trending: trendingPosts,
      hiddenGems: hiddenGems.map((c) => ({
        courseId: c.courseId,
        courseName: c.courseName,
        city: c.city,
        state: c.state,
        country: c.country,
        logoUrl: c.logoUrl,
        courseStyle: c.courseStyle,
        circleAvgScore: c.circleCourseAggregates[0]?.avgScore || 0,
        circleRatingCount: c.circleCourseAggregates[0]?.ratingCount || 0,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch discover data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
