import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
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
        createdBy: {
          select: { id: true, name: true, email: true, image: true },
        },
        participants: {
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
        },
        rounds: {
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
          orderBy: [{ playDate: "asc" }, { sortOrder: "asc" }],
        },
        expenses: {
          include: {
            paidBy: {
              select: { id: true, name: true, image: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        itinerary: {
          orderBy: [{ dayNumber: "asc" }, { sortOrder: "asc" }],
        },
      },
    });

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    // Verify user is a participant or creator
    const isParticipant = trip.participants.some((p) => p.userId === userId);
    const isCreator = trip.createdById === userId;
    if (!isParticipant && !isCreator) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(trip);
  } catch (error: any) {
    console.error("GET /api/trips/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;

    // Only creator or organizer can update
    const trip = await prisma.trip.findUnique({
      where: { id: params.id },
      include: {
        participants: { select: { userId: true, role: true } },
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
      return NextResponse.json(
        { error: "Only the creator or organizer can update this trip" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, destination, description, startDate, endDate, budget, groupSize, status, coverImageUrl } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (destination !== undefined) updateData.destination = destination;
    if (description !== undefined) updateData.description = description;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (budget !== undefined) updateData.budget = budget;
    if (groupSize !== undefined) updateData.groupSize = Number(groupSize);
    if (status !== undefined) updateData.status = status;
    if (coverImageUrl !== undefined) updateData.coverImageUrl = coverImageUrl;

    const updated = await prisma.trip.update({
      where: { id: params.id },
      data: updateData,
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PUT /api/trips/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
      select: { createdById: true },
    });

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    if (trip.createdById !== userId) {
      return NextResponse.json(
        { error: "Only the creator can delete this trip" },
        { status: 403 }
      );
    }

    await prisma.trip.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/trips/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
