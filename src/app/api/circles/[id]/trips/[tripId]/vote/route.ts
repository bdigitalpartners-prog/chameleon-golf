import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { withCircleAuth } from "@/lib/circle-auth";

/**
 * POST — Vote on a trip course (toggle: voting again removes the vote)
 * Body: { courseId, vote (1 or -1), comment? }
 */
export async function POST(
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

    const body = await req.json();
    const { courseId, vote, comment } = body;

    if (!courseId || typeof courseId !== "number") {
      return NextResponse.json({ error: "courseId (number) is required" }, { status: 400 });
    }
    if (vote !== 1 && vote !== -1) {
      return NextResponse.json({ error: "vote must be 1 or -1" }, { status: 400 });
    }

    // Verify course is in the trip
    const tripCourse = await prisma.tripCourse.findUnique({
      where: { tripId_courseId: { tripId, courseId } },
    });
    if (!tripCourse) {
      return NextResponse.json({ error: "Course not in this trip" }, { status: 404 });
    }

    // Toggle: if same vote exists, remove it
    const existing = await prisma.tripVote.findUnique({
      where: { tripId_userId_courseId: { tripId, userId, courseId } },
    });

    if (existing && existing.vote === vote) {
      // Toggle off
      await prisma.tripVote.delete({
        where: { tripId_userId_courseId: { tripId, userId, courseId } },
      });
      return NextResponse.json({ action: "removed", courseId });
    }

    // Upsert vote
    const result = await prisma.tripVote.upsert({
      where: { tripId_userId_courseId: { tripId, userId, courseId } },
      create: {
        tripId,
        userId,
        courseId,
        vote,
        comment: comment?.trim() || null,
      },
      update: {
        vote,
        comment: comment?.trim() || null,
      },
    });

    return NextResponse.json({ action: existing ? "changed" : "voted", vote: result });
  } catch (error: any) {
    console.error("POST /api/circles/[id]/trips/[tripId]/vote error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
