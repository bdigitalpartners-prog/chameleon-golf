import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { withCircleAuth } from "@/lib/circle-auth";

// POST /api/circles/[id]/events/[eventId]/rsvp - RSVP to event
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; eventId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;
    const { id: circleId, eventId } = params;

    const auth = await withCircleAuth(circleId, userId, ["OWNER", "ADMIN", "MEMBER"]);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const { status, guestCount, notes } = body;

    if (!status || !["GOING", "MAYBE", "DECLINED"].includes(status)) {
      return NextResponse.json(
        { error: "status must be GOING, MAYBE, or DECLINED" },
        { status: 400 }
      );
    }

    // Verify the event belongs to this circle
    const event = await prisma.circleEvent.findFirst({
      where: { id: eventId, circleId },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const rsvp = await prisma.eventRSVP.upsert({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
      create: {
        eventId,
        userId,
        status,
        guestCount: guestCount ? Number(guestCount) : 0,
        notes: notes || null,
      },
      update: {
        status,
        guestCount: guestCount !== undefined ? Number(guestCount) : undefined,
        notes: notes !== undefined ? notes : undefined,
      },
    });

    return NextResponse.json(rsvp);
  } catch (error: any) {
    console.error("POST /api/circles/[id]/events/[eventId]/rsvp error:", error);
    return NextResponse.json({ error: error.message || "Failed to RSVP" }, { status: 500 });
  }
}
