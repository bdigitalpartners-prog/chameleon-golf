import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authErr = await checkAdminAuth(request);
  if (authErr) return authErr;

  const courseId = parseInt(params.id);
  if (isNaN(courseId)) {
    return NextResponse.json({ error: "Invalid course ID" }, { status: 400 });
  }

  try {
    const course = await prisma.course.findUnique({
      where: { courseId },
      include: {
        chameleonScores: true,
        media: { orderBy: { sortOrder: "asc" } },
        holes: { orderBy: { holeNumber: "asc" } },
        teeBoxes: true,
        nearbyDining: { orderBy: { sortOrder: "asc" } },
        nearbyLodging: { orderBy: { sortOrder: "asc" } },
        nearbyAttractions: true,
        rankings: {
          include: {
            list: { include: { source: true } },
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json(course);
  } catch (err) {
    console.error("Course GET error:", err);
    return NextResponse.json({ error: "Failed to fetch course" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authErr = await checkAdminAuth(request);
  if (authErr) return authErr;

  const courseId = parseInt(params.id);
  if (isNaN(courseId)) {
    return NextResponse.json({ error: "Invalid course ID" }, { status: 400 });
  }

  try {
    // Clean up non-cascading relations first
    await prisma.$transaction(async (tx) => {
      await tx.courseNearbyDining.deleteMany({ where: { courseId } });
      await tx.courseNearbyLodging.deleteMany({ where: { courseId } });
      await tx.courseNearbyAttractions.deleteMany({ where: { courseId } });
      await tx.courseNearbyCourses.deleteMany({ where: { courseId } });
      await tx.courseNearbyCourses.deleteMany({ where: { nearbyCourseId: courseId } });
      await tx.courseNearbyRvParks.deleteMany({ where: { courseId } });
      await tx.courseNearbyMetroDistance.deleteMany({ where: { courseId } });
      await tx.courseIntelligenceNote.deleteMany({ where: { courseId } });
      await tx.courseWishlist.deleteMany({ where: { courseId } });
      await tx.conditionReport.deleteMany({ where: { courseId } });
      await tx.post.updateMany({ where: { courseId }, data: { courseId: null } });
      await tx.game.deleteMany({ where: { courseId } });
      await tx.event.deleteMany({ where: { courseId } });
      await tx.eventMatch.deleteMany({ where: { courseId } });
      await tx.prediction.deleteMany({ where: { courseId } });
      await tx.prepPack.deleteMany({ where: { courseId } });
      await tx.roundHistory.deleteMany({ where: { courseId } });
      await tx.leagueRound.deleteMany({ where: { courseId } });
      await tx.tripRound.deleteMany({ where: { courseId } });
      await tx.tripCourse.deleteMany({ where: { courseId } });
      await tx.tripVote.deleteMany({ where: { courseId } });
      await tx.circleConsensus.deleteMany({ where: { courseId } });
      await tx.circleEvent.deleteMany({ where: { courseId } });
      await tx.circleCourseAggregate.deleteMany({ where: { courseId } });
      await tx.circleCourseRating.deleteMany({ where: { courseId } });
      await tx.courseCheckIn.deleteMany({ where: { courseId } });
      await tx.courseRecommendation.deleteMany({ where: { courseId } });

      // Now delete the course (cascading relations handle the rest)
      await tx.course.delete({ where: { courseId } });
    });

    return NextResponse.json({ message: `Course #${courseId} deleted` });
  } catch (err) {
    console.error("Course DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete course" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authErr = await checkAdminAuth(request);
  if (authErr) return authErr;

  const courseId = parseInt(params.id);
  if (isNaN(courseId)) {
    return NextResponse.json({ error: "Invalid course ID" }, { status: 400 });
  }

  try {
    const body = await request.json();

    // Only pass known scalar fields to Prisma — the frontend sends the
    // full course object including nested relations, which Prisma rejects.
    const ALLOWED_COURSE_FIELDS = new Set([
      'courseName', 'facilityName', 'streetAddress', 'city', 'state', 'zipCode', 'country',
      'latitude', 'longitude', 'courseType', 'accessType', 'numHoles', 'par', 'yearOpened',
      'courseStyle', 'originalArchitect', 'renovationArchitect', 'renovationYear', 'renovationNotes',
      'websiteUrl', 'phone', 'greenFeeLow', 'greenFeeHigh', 'greenFeeCurrency', 'walkingPolicy',
      'numListsAppeared', 'dataSources', 'isVerified', 'isEnriched', 'description', 'email',
      'tagline', 'priceTier', 'dressCode', 'caddieAvailability', 'caddieFee', 'cartPolicy',
      'cartFee', 'cellPhonePolicy', 'practiceFacilities', 'clubRentalAvailable', 'bookingUrl',
      'howToGetOn', 'resortAffiliateAccess', 'guestPolicy', 'signatureHoleNumber',
      'signatureHoleDescription', 'bestPar3', 'bestPar4', 'bestPar5', 'insiderTips',
      'courseStrategy', 'whatToExpect', 'bestTimeToPlay', 'paceOfPlayNotes', 'fairwayGrass',
      'greenGrass', 'greenSpeed', 'aerationSchedule', 'bestConditionMonths', 'golfSeason',
      'championshipHistory', 'famousMoments', 'upcomingEvents', 'weatherData', 'bestMonths',
      'worstMonths', 'architectBio', 'designPhilosophy', 'templateHoles', 'renovationHistory',
      'onSiteLodging', 'resortNameField', 'resortBookingUrl', 'stayAndPlayPackages',
      'averageRoundTime', 'greenFeePeak', 'greenFeeOffPeak', 'greenFeeTwilight', 'includesCart',
      'instagramUrl', 'twitterUrl', 'facebookUrl', 'tiktokUrl', 'architectId',
    ]);

    const courseData: Record<string, unknown> = {};
    for (const key of Object.keys(body)) {
      if (ALLOWED_COURSE_FIELDS.has(key)) {
        courseData[key] = body[key];
      }
    }

    const course = await prisma.course.update({
      where: { courseId },
      data: courseData,
    });

    // Handle nearby dining updates
    if (body.dining !== undefined) {
      await prisma.courseNearbyDining.deleteMany({ where: { courseId } });
      if (body.dining.length > 0) {
        await prisma.courseNearbyDining.createMany({
          data: body.dining.map((d: Record<string, unknown>) => ({ ...d, courseId })),
        });
      }
    }

    // Handle nearby lodging updates
    if (body.lodging !== undefined) {
      await prisma.courseNearbyLodging.deleteMany({ where: { courseId } });
      if (body.lodging.length > 0) {
        await prisma.courseNearbyLodging.createMany({
          data: body.lodging.map((l: Record<string, unknown>) => ({ ...l, courseId })),
        });
      }
    }

    // Handle nearby attractions updates
    if (body.attractions !== undefined) {
      await prisma.courseNearbyAttractions.deleteMany({ where: { courseId } });
      if (body.attractions.length > 0) {
        await prisma.courseNearbyAttractions.createMany({
          data: body.attractions.map((a: Record<string, unknown>) => ({ ...a, courseId })),
        });
      }
    }

    return NextResponse.json(course);
  } catch (err) {
    console.error("Course PUT error:", err);
    return NextResponse.json({ error: "Failed to update course" }, { status: 500 });
  }
}
