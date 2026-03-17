import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { withCircleAuth } from "@/lib/circle-auth";

export const dynamic = 'force-dynamic';

/**
 * DELETE — Remove a course from a trip
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; tripId: string; courseId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;
    const { id: circleId, tripId } = params;
    const courseId = parseInt(params.courseId, 10);

    const auth = await withCircleAuth(circleId, userId, ["OWNER", "ADMIN", "MEMBER"]);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const trip = await prisma.tripPlan.findFirst({ where: { id: tripId, circleId } });
    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    const tripCourse = await prisma.tripCourse.findUnique({
      where: { tripId_courseId: { tripId, courseId } },
    });
    if (!tripCourse) {
      return NextResponse.json({ error: "Course not in this trip" }, { status: 404 });
    }

    await prisma.tripCourse.delete({
      where: { tripId_courseId: { tripId, courseId } },
    });

    // Also delete related votes
    await prisma.tripVote.deleteMany({
      where: { tripId, courseId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/circles/[id]/trips/[tripId]/courses/[courseId] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
