import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const roundId = params.id;

  try {
    // Verify the round exists and belongs to the user
    const round = await prisma.roundHistory.findFirst({
      where: { id: roundId, userId },
      select: { id: true, courseId: true },
    });

    if (!round) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 });
    }

    // Parse optional debrief data from request body
    const body = await request.json().catch(() => ({}));

    // Check if a debrief already exists for this round
    const existingDebrief = await prisma.courseDebrief.findFirst({
      where: { userId, roundId: round.courseId },
    });

    if (existingDebrief) {
      return NextResponse.json({
        debrief: existingDebrief,
        message: 'Debrief already exists for this round.',
      });
    }

    // Create the course debrief linked to the round
    const debrief = await prisma.courseDebrief.create({
      data: {
        userId,
        roundId: round.courseId,
        courseId: round.courseId,
        greensQuality: body.greensQuality ?? null,
        fairwayQuality: body.fairwayQuality ?? null,
        paceOfPlay: body.paceOfPlay ?? null,
        difficulty: body.difficulty ?? null,
        standoutHoles: body.standoutHoles ?? null,
        recommendations: body.recommendations ?? null,
        wouldReturn: body.wouldReturn ?? null,
        handicapAdvice: body.handicapAdvice ?? null,
      },
    });

    return NextResponse.json({
      debrief,
      message: 'Debrief created successfully.',
    });
  } catch (err) {
    console.error('Round debrief error:', err);
    return NextResponse.json(
      { error: 'Failed to create round debrief' },
      { status: 500 },
    );
  }
}
