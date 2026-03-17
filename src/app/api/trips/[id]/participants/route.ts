import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

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

    // Verify the requester is a participant/organizer of the trip
    const trip = await prisma.trip.findUnique({
      where: { id: params.id },
      include: { participants: { select: { userId: true, role: true } } },
    });

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    const requesterParticipant = trip.participants.find(
      (p) => p.userId === userId
    );
    if (!requesterParticipant && trip.createdById !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { userId: targetUserId, email, role } = body;

    let participantUserId = targetUserId;

    // If email provided instead of userId, look up the user
    if (!participantUserId && email) {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });
      if (!user) {
        return NextResponse.json(
          { error: "User with that email not found" },
          { status: 404 }
        );
      }
      participantUserId = user.id;
    }

    if (!participantUserId) {
      return NextResponse.json(
        { error: "userId or email is required" },
        { status: 400 }
      );
    }

    // Check if already a participant
    const existing = trip.participants.find(
      (p) => p.userId === participantUserId
    );
    if (existing) {
      return NextResponse.json(
        { error: "User is already a participant" },
        { status: 409 }
      );
    }

    const participant = await prisma.tripParticipant.create({
      data: {
        tripId: params.id,
        userId: participantUserId,
        role: role ?? "member",
        rsvpStatus: "pending",
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true, handicapIndex: true },
        },
      },
    });

    return NextResponse.json(participant, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/trips/[id]/participants error:", error);
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

    // Verify user has access to this trip
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

    const participants = await prisma.tripParticipant.findMany({
      where: { tripId: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            handicapIndex: true,
          },
        },
      },
      orderBy: { joinedAt: "asc" },
    });

    return NextResponse.json({ participants });
  } catch (error: any) {
    console.error("GET /api/trips/[id]/participants error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
