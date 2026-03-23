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

    const trip = await prisma.trip.findUnique({
      where: { id: params.id },
      include: {
        participants: { select: { userId: true, role: true } },
        rounds: { select: { sortOrder: true }, orderBy: { sortOrder: "desc" }, take: 1 },
      },
    });

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    const isCreator = trip.createdById === userId;
    const isOrganizer = trip.participants.some(
      (p) => p.userId === userId && p.role === "organizer"
    );
    if (!isCreator && !isOrganizer) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { courseId, playDate, teeTime, notes } = body;

    if (!courseId) {
      return NextResponse.json(
        { error: "courseId is required" },
        { status: 400 }
      );
    }

    const maxOrder = trip.rounds[0]?.sortOrder ?? -1;

    const round = await prisma.tripRound.create({
      data: {
        tripId: params.id,
        courseId: Number(courseId),
        playDate: playDate ? new Date(playDate) : null,
        teeTime: teeTime ?? null,
        notes: notes ?? null,
        sortOrder: maxOrder + 1,
      },
      include: {
        course: {
          select: {
            courseId: true,
            courseName: true,
            facilityName: true,
            city: true,
            state: true,
            country: true,
            greenFeeLow: true,
            greenFeeHigh: true,
          },
        },
      },
    });

    return NextResponse.json(round, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/trips/[id]/stops error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
