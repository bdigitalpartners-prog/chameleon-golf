import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkHandicapEligibility, calculateEventMatchScore } from '@/lib/events/matching';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const state = searchParams.get('state');
    const format = searchParams.get('format');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const eligibleOnly = searchParams.get('eligibleOnly') === 'true';
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const limit = parseInt(searchParams.get('limit') ?? '12', 10);

    // Build where clause
    const where: any = {
      isActive: true,
      eventDate: { gte: new Date() },
    };

    if (state) {
      where.state = state;
    }

    if (format) {
      where.format = { contains: format, mode: 'insensitive' };
    }

    if (minPrice) {
      where.price = { ...where.price, gte: parseFloat(minPrice) };
    }

    if (maxPrice) {
      where.price = { ...where.price, lte: parseFloat(maxPrice) };
    }

    if (startDate) {
      where.eventDate = { ...where.eventDate, gte: new Date(startDate) };
    }

    if (endDate) {
      where.eventDate = { ...where.eventDate, lte: new Date(endDate) };
    }

    // Optionally get authenticated user for match scores
    const session = await getServerSession(authOptions);
    let userHandicap: number | null = null;

    if (session?.user) {
      const userId = (session.user as any).id;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { handicapIndex: true },
      });
      userHandicap = user?.handicapIndex ? Number(user.handicapIndex) : null;
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          course: {
            select: {
              courseId: true,
              courseName: true,
              city: true,
              state: true,
              courseType: true,
              accessType: true,
              chameleonScores: {
                select: { chameleonScore: true, avgOverall: true },
              },
            },
          },
        },
        orderBy: { eventDate: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.event.count({ where }),
    ]);

    // Enrich events with match scores and eligibility
    const enrichedEvents = await Promise.all(
      events.map(async (event) => {
        const maxHcp = event.maxHandicap ? Number(event.maxHandicap) : null;
        const minHcp = event.minHandicap ? Number(event.minHandicap) : null;
        const { eligible, reasons } = checkHandicapEligibility(userHandicap, maxHcp, minHcp);

        let matchScore: number | null = null;
        if (session?.user && event.courseId) {
          matchScore = await calculateEventMatchScore(event.courseId);
        }

        return {
          id: event.id,
          name: event.name,
          description: event.description,
          courseId: event.courseId,
          courseName: event.courseName,
          eventDate: event.eventDate,
          endDate: event.endDate,
          format: event.format,
          price: event.price ? Number(event.price) : null,
          maxHandicap: maxHcp,
          minHandicap: minHcp,
          registrationUrl: event.registrationUrl,
          city: event.city,
          state: event.state,
          imageUrl: event.imageUrl,
          course: event.course,
          matchScore,
          eligible,
          eligibilityReasons: reasons,
        };
      }),
    );

    // Filter to eligible-only if requested
    const finalEvents = eligibleOnly
      ? enrichedEvents.filter((e) => e.eligible)
      : enrichedEvents;

    const eligibleCount = enrichedEvents.filter((e) => e.eligible).length;

    return NextResponse.json({
      events: finalEvents,
      total: eligibleOnly ? finalEvents.length : total,
      page,
      totalPages: Math.ceil((eligibleOnly ? finalEvents.length : total) / limit),
      eligibleCount,
    });
  } catch (error: any) {
    console.error('GET /api/events error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 },
    );
  }
}
