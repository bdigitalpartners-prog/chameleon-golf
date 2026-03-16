import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { withCircleAuth } from "@/lib/circle-auth";

export const dynamic = 'force-dynamic';

// POST — RSVP to event
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; eventId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as any).id;
  const circleId = params.id;

  const auth = await withCircleAuth(circleId, userId, [
    "OWNER",
    "ADMIN",
    "MEMBER",
  ]);
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status }
    );
  }

  const event = await prisma.circleEvent.findUnique({
    where: { id: params.eventId },
    include: { rsvps: true },
  });

  if (!event || event.circleId !== circleId) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  // Check RSVP deadline
  if (event.rsvpDeadline && new Date() > event.rsvpDeadline) {
    return NextResponse.json(
      { error: "RSVP deadline has passed" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const { status, guestCount, notes } = body;

  if (!["GOING", "MAYBE", "DECLINED"].includes(status)) {
    return NextResponse.json(
      { error: "Invalid RSVP status" },
      { status: 400 }
    );
  }

  // Check max attendees
  if (status === "GOING" && event.maxAttendees) {
    const goingCount = event.rsvps.filter(
      (r) => r.status === "GOING" && r.userId !== userId
    ).length;
    const totalGuests = event.rsvps
      .filter((r) => r.status === "GOING" && r.userId !== userId)
      .reduce((sum, r) => sum + r.guestCount, 0);
    if (
      goingCount + totalGuests + 1 + (guestCount ?? 0) >
      event.maxAttendees
    ) {
      return NextResponse.json(
        { error: "Event is at capacity" },
        { status: 400 }
      );
    }
  }

  const rsvp = await prisma.eventRSVP.upsert({
    where: { eventId_userId: { eventId: params.eventId, userId } },
    create: {
      eventId: params.eventId,
      userId,
      status,
      guestCount: guestCount ?? 0,
      notes: notes ?? null,
    },
    update: {
      status,
      guestCount: guestCount ?? 0,
      notes: notes ?? null,
    },
    include: {
      user: { select: { id: true, name: true, image: true } },
    },
  });

  return NextResponse.json({ rsvp });
}
