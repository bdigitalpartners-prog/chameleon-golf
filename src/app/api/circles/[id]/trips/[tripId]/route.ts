import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { withCircleAuth } from "@/lib/circle-auth";

export const dynamic = 'force-dynamic';

/**
 * GET — Trip detail with courses and votes
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; tripId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;
    const { id: circleId, tripId } = params;

    const auth = await withCircleAuth(circleId, userId, ["OWNER", "ADMIN", "MEMBER"]);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const trip = await prisma.tripPlan.findFirst({
      where: { id: tripId, circleId },
      include: {
        creator: { select: { id: true, name: true, image: true } },
        courses: {
          orderBy: { playOrder: "asc" },
          include: {
            course: {
              select: {
                courseId: true,
                courseName: true,
                city: true,
                state: true,
                accessType: true,
                latitude: true,
                longitude: true,
                media: { where: { isPrimary: true }, take: 1 },
              },
            },
          },
        },
        votes: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
      },
    });

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    // Get circle aggregate scores for trip courses
    const courseIds = trip.courses.map((c) => c.courseId);
    const aggregates = await prisma.circleCourseAggregate.findMany({
      where: { circleId, courseId: { in: courseIds } },
    });
    const aggMap = new Map(aggregates.map((a) => [a.courseId, a]));

    // Group votes by course
    const votesByCourse = new Map<number, { up: number; down: number; userVote?: number }>();
    for (const v of trip.votes) {
      const key = v.courseId;
      if (!votesByCourse.has(key)) votesByCourse.set(key, { up: 0, down: 0 });
      const entry = votesByCourse.get(key)!;
      if (v.vote > 0) entry.up++;
      else entry.down++;
      if (v.userId === userId) entry.userVote = v.vote;
    }

    // Get circle members for "who's going"
    const members = await prisma.circleMembership.findMany({
      where: { circleId, role: { in: ["OWNER", "ADMIN", "MEMBER"] } },
      include: { user: { select: { id: true, name: true, image: true } } },
    });

    return NextResponse.json({
      ...trip,
      courses: trip.courses.map((tc) => ({
        ...tc,
        circleAvgScore: aggMap.get(tc.courseId)?.avgScore ?? null,
        circleRatingCount: aggMap.get(tc.courseId)?.ratingCount ?? 0,
        votes: votesByCourse.get(tc.courseId) ?? { up: 0, down: 0 },
      })),
      votes: undefined,
      members: members.map((m) => m.user),
    });
  } catch (error: any) {
    console.error("GET /api/circles/[id]/trips/[tripId] error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH — Update trip details
 * Body: { title?, destination?, startDate?, endDate?, status?, notes? }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; tripId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;
    const { id: circleId, tripId } = params;

    const auth = await withCircleAuth(circleId, userId, ["OWNER", "ADMIN", "MEMBER"]);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const trip = await prisma.tripPlan.findFirst({ where: { id: tripId, circleId } });
    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    // Only creator or admin/owner can update
    if (trip.creatorId !== userId && auth.membership!.role === "MEMBER") {
      return NextResponse.json({ error: "Only trip creator or circle admins can update" }, { status: 403 });
    }

    const body = await req.json();
    const data: any = {};
    if (body.title !== undefined) data.title = body.title.trim();
    if (body.destination !== undefined) data.destination = body.destination?.trim() || null;
    if (body.startDate !== undefined) data.startDate = body.startDate ? new Date(body.startDate) : null;
    if (body.endDate !== undefined) data.endDate = body.endDate ? new Date(body.endDate) : null;
    if (body.status !== undefined) data.status = body.status;
    if (body.notes !== undefined) data.notes = body.notes?.trim() || null;

    const updated = await prisma.tripPlan.update({
      where: { id: tripId },
      data,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PATCH /api/circles/[id]/trips/[tripId] error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
