import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { withCircleAuth } from "@/lib/circle-auth";

export const dynamic = 'force-dynamic';

/**
 * POST — Add a course to a trip
 * Body: { courseId, playDate?, teeTime?, playOrder? }
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
    const { courseId, playDate, teeTime, playOrder } = body;

    if (!courseId || typeof courseId !== "number") {
      return NextResponse.json({ error: "courseId (number) is required" }, { status: 400 });
    }

    // Verify course exists
    const course = await prisma.course.findUnique({ where: { courseId } });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Check not already added
    const existing = await prisma.tripCourse.findUnique({
      where: { tripId_courseId: { tripId, courseId } },
    });
    if (existing) {
      return NextResponse.json({ error: "Course already added to this trip" }, { status: 409 });
    }

    const tripCourse = await prisma.tripCourse.create({
      data: {
        tripId,
        courseId,
        playDate: playDate ? new Date(playDate) : null,
        teeTime: teeTime || null,
        playOrder: playOrder ?? 0,
      },
      include: {
        course: {
          select: {
            courseId: true,
            courseName: true,
            city: true,
            state: true,
          },
        },
      },
    });

    return NextResponse.json(tripCourse, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/circles/[id]/trips/[tripId]/courses error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
