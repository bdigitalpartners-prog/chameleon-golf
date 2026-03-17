import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const eventId = params.id;

    // Verify event exists and is active
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, isActive: true, name: true },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (!event.isActive) {
      return NextResponse.json({ error: 'Event is no longer active' }, { status: 400 });
    }

    // Check if already registered
    const existing = await prisma.eventRegistration.findUnique({
      where: {
        eventId_userId: { eventId, userId },
      },
    });

    if (existing) {
      return NextResponse.json({
        message: 'Already registered',
        registration: existing,
      });
    }

    // Create registration
    const registration = await prisma.eventRegistration.create({
      data: {
        eventId,
        userId,
        status: 'interested',
      },
    });

    return NextResponse.json({
      message: 'Registration successful',
      registration,
    });
  } catch (error: any) {
    console.error('POST /api/events/[id]/register error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 },
    );
  }
}
