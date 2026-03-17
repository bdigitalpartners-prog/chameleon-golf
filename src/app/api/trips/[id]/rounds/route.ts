import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  computeGroupMatchScore,
  type UserEQProfile,
  type CourseScoreData,
} from "@/lib/trips/group-match";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;

    // Verify user has access
    const trip = await prisma.trip.findUnique({
      where: { id: params.id },
      include: { participants: { select: { userId: true } } },
    });

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    const hasAccess =
      trip.createdById === userId ||
      trip.participants.some((p) => p.userId === userId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { courseId, playDate, teeTime, notes, sortOrder } = body;

    if (!courseId) {
      return NextResponse.json(
        { error: "courseId is required" },
        { status: 400 }
      );
    }

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { courseId: Number(courseId) },
      select: { courseId: true, courseName: true },
    });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Compute match score for this course with trip participants
    let matchScore: number | null = null;
    try {
      const participantUsers = await prisma.tripParticipant.findMany({
        where: { tripId: params.id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              handicapIndex: true,
              weightProfiles: { where: { isActive: true }, take: 1 },
            },
          },
        },
      });

      const courseScores = await prisma.chameleonScore.findUnique({
        where: { courseId: Number(courseId) },
      });

      if (courseScores && participantUsers.length > 0) {
        const profiles: UserEQProfile[] = participantUsers.map((p) => {
          const wp = p.user.weightProfiles[0];
          return {
            userId: p.user.id,
            userName: p.user.name ?? undefined,
            handicapIndex: p.user.handicapIndex
              ? Number(p.user.handicapIndex)
              : null,
            weights: {
              conditioning: wp ? Number(wp.weightConditioning) : 0.1,
              layout: wp ? Number(wp.weightLayout) : 0.15,
              pace: wp ? Number(wp.weightPace) : 0.1,
              aesthetics: wp ? Number(wp.weightAesthetics) : 0.1,
              challenge: wp ? Number(wp.weightChallenge) : 0.1,
              value: wp ? Number(wp.weightValue) : 0.1,
              amenities: wp ? Number(wp.weightAmenities) : 0.1,
              walkability: wp ? Number(wp.weightWalkability) : 0.1,
              service: wp ? Number(wp.weightService) : 0.1,
              expert: wp ? Number(wp.expertWeight) : 0.5,
            },
          };
        });

        const courseData: CourseScoreData = {
          courseId: courseScores.courseId,
          courseName: course.courseName,
          avgConditioning: courseScores.avgConditioning
            ? Number(courseScores.avgConditioning)
            : null,
          avgLayoutDesign: courseScores.avgLayoutDesign
            ? Number(courseScores.avgLayoutDesign)
            : null,
          avgPace: courseScores.avgPace
            ? Number(courseScores.avgPace)
            : null,
          avgAesthetics: courseScores.avgAesthetics
            ? Number(courseScores.avgAesthetics)
            : null,
          avgChallenge: courseScores.avgChallenge
            ? Number(courseScores.avgChallenge)
            : null,
          avgValue: courseScores.avgValue
            ? Number(courseScores.avgValue)
            : null,
          avgAmenities: courseScores.avgAmenities
            ? Number(courseScores.avgAmenities)
            : null,
          avgWalkability: courseScores.avgWalkability
            ? Number(courseScores.avgWalkability)
            : null,
          avgService: courseScores.avgService
            ? Number(courseScores.avgService)
            : null,
          prestigeScore: courseScores.prestigeScore
            ? Number(courseScores.prestigeScore)
            : null,
          chameleonScore: Number(courseScores.chameleonScore),
        };

        const result = computeGroupMatchScore(profiles, courseData);
        matchScore = result.groupMatchScore;
      }
    } catch (err) {
      console.error("Match score calculation failed:", err);
      // Non-fatal: continue without match score
    }

    const round = await prisma.tripRound.create({
      data: {
        tripId: params.id,
        courseId: Number(courseId),
        playDate: playDate ? new Date(playDate) : null,
        teeTime: teeTime ?? null,
        notes: notes ?? null,
        sortOrder: sortOrder ?? 0,
        matchScore: matchScore,
      },
      include: {
        course: {
          select: {
            courseId: true,
            courseName: true,
            facilityName: true,
            city: true,
            state: true,
            country: true,
            greenFeeLow: true,
            greenFeeHigh: true,
          },
        },
      },
    });

    return NextResponse.json(round, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/trips/[id]/rounds error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;

    // Verify user has access
    const trip = await prisma.trip.findUnique({
      where: { id: params.id },
      include: { participants: { select: { userId: true } } },
    });

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    const hasAccess =
      trip.createdById === userId ||
      trip.participants.some((p) => p.userId === userId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const rounds = await prisma.tripRound.findMany({
      where: { tripId: params.id },
      include: {
        course: {
          select: {
            courseId: true,
            courseName: true,
            facilityName: true,
            city: true,
            state: true,
            country: true,
            greenFeeLow: true,
            greenFeeHigh: true,
            media: { where: { isPrimary: true }, take: 1 },
          },
        },
      },
      orderBy: [{ playDate: "asc" }, { sortOrder: "asc" }],
    });

    return NextResponse.json({ rounds });
  } catch (error: any) {
    console.error("GET /api/trips/[id]/rounds error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
