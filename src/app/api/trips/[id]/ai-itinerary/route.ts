import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;

    if (process.env.FEATURE_TRIP_PLANNER !== "true") {
      return NextResponse.json({ error: "Trip planner feature not enabled" }, { status: 403 });
    }

    const trip = await prisma.trip.findUnique({
      where: { id: params.id },
      include: {
        participants: { include: { user: { select: { id: true, name: true, handicapIndex: true } } } },
        rounds: { include: { course: { select: { courseId: true, courseName: true, city: true, state: true } } } },
      },
    });

    if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });

    // Verify user is a participant
    const isParticipant = trip.createdById === userId || trip.participants.some((p) => p.userId === userId);
    if (!isParticipant) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

    const startDate = new Date(trip.startDate);
    const endDate = new Date(trip.endDate);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Generate a structured itinerary based on trip data
    const itinerary: any[] = [];
    const roundsByDate = new Map<string, any>();
    trip.rounds.forEach((r) => {
      if (r.playDate) {
        roundsByDate.set(new Date(r.playDate).toISOString().split("T")[0], r);
      }
    });

    for (let day = 0; day < totalDays; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + day);
      const dateStr = currentDate.toISOString().split("T")[0];
      const dayItems: any[] = [];

      const scheduledRound = roundsByDate.get(dateStr);
      if (scheduledRound) {
        dayItems.push({
          type: "golf",
          time: scheduledRound.teeTime || "08:00",
          title: `Golf at ${scheduledRound.course?.courseName || "TBD"}`,
          description: `Tee time at ${scheduledRound.course?.courseName}. Check in 30 minutes early.`,
          location: scheduledRound.course?.courseName,
        });
        dayItems.push({
          type: "dining",
          time: "13:00",
          title: "Post-round lunch",
          description: "Check the clubhouse or nearby restaurants for group dining options.",
        });
      } else {
        dayItems.push({
          type: "free",
          time: "09:00",
          title: "Free morning",
          description: "Explore the area, visit local attractions, or hit the practice range.",
        });
      }

      dayItems.push({
        type: "dining",
        time: "19:00",
        title: "Group dinner",
        description: `Evening dining in ${trip.destination}. Consider making reservations for ${trip.participants.length + 1} people.`,
      });

      itinerary.push({
        dayNumber: day + 1,
        date: dateStr,
        items: dayItems,
      });
    }

    // Save itinerary to trip
    await prisma.trip.update({
      where: { id: params.id },
      data: { aiItinerary: itinerary },
    });

    // Also save individual items to TripItinerary
    await prisma.tripItinerary.deleteMany({ where: { tripId: params.id } });
    const itineraryItems = itinerary.flatMap((day) =>
      day.items.map((item: any, idx: number) => ({
        tripId: params.id,
        dayNumber: day.dayNumber,
        itemType: item.type,
        title: item.title,
        description: item.description,
        location: item.location || null,
        startTime: item.time || null,
        sortOrder: idx,
      }))
    );

    if (itineraryItems.length > 0) {
      await prisma.tripItinerary.createMany({ data: itineraryItems });
    }

    return NextResponse.json({ itinerary }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/trips/[id]/ai-itinerary error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
