import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  computeGroupMatchScore,
  type UserEQProfile,
  type CourseScoreData,
  type GroupMatchResult,
} from "@/lib/trips/group-match";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;

    // Get trip with participants and rounds
    const trip = await prisma.trip.findUnique({
      where: { id: params.id },
      include: {
        participants: {
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
        },
        rounds: {
          include: {
            course: {
              select: {
                courseId: true,
                courseName: true,
                chameleonScores: true,
              },
            },
          },
        },
      },
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

    // Build user EQ profiles
    const profiles: UserEQProfile[] = trip.participants.map((p) => {
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

    // Compute match scores for each planned round's course
    const courseResults: GroupMatchResult[] = [];

    for (const round of trip.rounds) {
      const cs = round.course.chameleonScores;
      if (!cs) continue;

      const courseData: CourseScoreData = {
        courseId: round.course.courseId,
        courseName: round.course.courseName,
        avgConditioning: cs.avgConditioning ? Number(cs.avgConditioning) : null,
        avgLayoutDesign: cs.avgLayoutDesign ? Number(cs.avgLayoutDesign) : null,
        avgPace: cs.avgPace ? Number(cs.avgPace) : null,
        avgAesthetics: cs.avgAesthetics ? Number(cs.avgAesthetics) : null,
        avgChallenge: cs.avgChallenge ? Number(cs.avgChallenge) : null,
        avgValue: cs.avgValue ? Number(cs.avgValue) : null,
        avgAmenities: cs.avgAmenities ? Number(cs.avgAmenities) : null,
        avgWalkability: cs.avgWalkability ? Number(cs.avgWalkability) : null,
        avgService: cs.avgService ? Number(cs.avgService) : null,
        prestigeScore: cs.prestigeScore ? Number(cs.prestigeScore) : null,
        chameleonScore: Number(cs.chameleonScore),
      };

      const result = computeGroupMatchScore(profiles, courseData);
      courseResults.push(result);
    }

    // Overall trip group match score = average of all course match scores
    const overallScore =
      courseResults.length > 0
        ? Math.round(
            (courseResults.reduce((sum, r) => sum + r.groupMatchScore, 0) /
              courseResults.length) *
              10
          ) / 10
        : null;

    // Update the trip's groupMatchScore
    if (overallScore !== null) {
      await prisma.trip.update({
        where: { id: params.id },
        data: { groupMatchScore: overallScore },
      });
    }

    return NextResponse.json({
      overallGroupMatchScore: overallScore,
      courseResults,
      participantCount: profiles.length,
      roundCount: trip.rounds.length,
    });
  } catch (error: any) {
    console.error("GET /api/trips/[id]/group-match error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
