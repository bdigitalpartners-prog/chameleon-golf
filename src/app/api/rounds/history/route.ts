import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') ?? '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '20'), 100);
    const skip = (page - 1) * limit;
    const sortBy = url.searchParams.get('sortBy') ?? 'playDate';
    const sortDir = url.searchParams.get('sortDir') ?? 'desc';

    const orderBy: Record<string, string> =
      sortBy === 'score'
        ? { score: sortDir }
        : sortBy === 'differential'
          ? { differential: sortDir }
          : { playDate: sortDir };

    const [rounds, total] = await Promise.all([
      prisma.roundHistory.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy,
        include: {
          course: {
            select: {
              courseId: true,
              courseName: true,
              facilityName: true,
              city: true,
              state: true,
              country: true,
            },
          },
          verifiedPlay: {
            select: {
              id: true,
              badgeType: true,
              verifiedAt: true,
              verificationSource: true,
            },
          },
        },
      }),
      prisma.roundHistory.count({ where: { userId } }),
    ]);

    const items = rounds.map((r) => ({
      id: r.id,
      courseId: r.courseId,
      course: r.course
        ? {
            courseId: r.course.courseId,
            courseName: r.course.courseName,
            facilityName: r.course.facilityName,
            city: r.course.city,
            state: r.course.state,
            country: r.course.country,
          }
        : null,
      ghinRoundId: r.ghinRoundId,
      score: r.score,
      adjustedScore: r.adjustedScore,
      differential: r.differential ? Number(r.differential) : null,
      teeBoxName: r.teeBoxName,
      courseRating: r.courseRating ? Number(r.courseRating) : null,
      slopeRating: r.slopeRating,
      playDate: r.playDate.toISOString(),
      numHoles: r.numHoles,
      isVerified: r.isVerified,
      source: r.source,
      verifiedPlay: r.verifiedPlay
        ? {
            id: r.verifiedPlay.id,
            badgeType: r.verifiedPlay.badgeType,
            verifiedAt: r.verifiedPlay.verifiedAt.toISOString(),
            verificationSource: r.verifiedPlay.verificationSource,
          }
        : null,
      createdAt: r.createdAt.toISOString(),
    }));

    return NextResponse.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('Round history error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch round history' },
      { status: 500 },
    );
  }
}
