import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { calculateEventMatchScore, checkHandicapEligibility } from '@/lib/events/matching';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            courseId: true,
            courseName: true,
            facilityName: true,
            city: true,
            state: true,
            zipCode: true,
            courseType: true,
            accessType: true,
            numHoles: true,
            par: true,
            yearOpened: true,
            courseStyle: true,
            originalArchitect: true,
            websiteUrl: true,
            walkingPolicy: true,
            priceTier: true,
            chameleonScores: {
              select: {
                chameleonScore: true,
                avgOverall: true,
                prestigeScore: true,
                totalRatings: true,
              },
            },
            difficulty: {
              select: {
                slopeRating: true,
                courseRating: true,
                idealHandicapLow: true,
                idealHandicapHigh: true,
              },
            },
          },
        },
        _count: {
          select: { registrations: true },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Calculate match score
    let matchScore: number | null = null;
    let eligible = true;
    let eligibilityReasons: string[] = [];
    let isRegistered = false;

    const session = await getServerSession(authOptions);

    if (session?.user) {
      const userId = (session.user as any).id;

      // Get user handicap
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { handicapIndex: true },
      });

      const userHandicap = user?.handicapIndex ? Number(user.handicapIndex) : null;
      const maxHcp = event.maxHandicap ? Number(event.maxHandicap) : null;
      const minHcp = event.minHandicap ? Number(event.minHandicap) : null;

      if (event.courseId) {
        matchScore = await calculateEventMatchScore(event.courseId);
      }

      const eligibilityCheck = checkHandicapEligibility(userHandicap, maxHcp, minHcp);
      eligible = eligibilityCheck.eligible;
      eligibilityReasons = eligibilityCheck.reasons;

      // Check if user is already registered
      const registration = await prisma.eventRegistration.findUnique({
        where: {
          eventId_userId: { eventId: id, userId },
        },
      });
      isRegistered = !!registration;
    }

    return NextResponse.json({
      event: {
        id: event.id,
        name: event.name,
        description: event.description,
        courseId: event.courseId,
        courseName: event.courseName,
        eventDate: event.eventDate,
        endDate: event.endDate,
        format: event.format,
        price: event.price ? Number(event.price) : null,
        maxHandicap: event.maxHandicap ? Number(event.maxHandicap) : null,
        minHandicap: event.minHandicap ? Number(event.minHandicap) : null,
        registrationUrl: event.registrationUrl,
        city: event.city,
        state: event.state,
        imageUrl: event.imageUrl,
        source: event.source,
        registrationCount: event._count.registrations,
      },
      course: event.course,
      matchScore,
      eligible,
      eligibilityReasons,
      isRegistered,
    });
  } catch (error: any) {
    console.error('GET /api/events/[id] error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 },
    );
  }
}
