import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;

    const body = await req.json();
    const { name, destination, description, startDate, endDate, budget, groupSize } = body;

    if (!name || !destination || !startDate || !endDate) {
      return NextResponse.json(
        { error: "name, destination, startDate, and endDate are required" },
        { status: 400 }
      );
    }

    const trip = await prisma.trip.create({
      data: {
        name,
        destination,
        description: description ?? null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        budget: budget ?? null,
        groupSize: groupSize ? Number(groupSize) : null,
        status: "planning",
        createdById: userId,
        participants: {
          create: {
            userId,
            role: "organizer",
            rsvpStatus: "confirmed",
          },
        },
      },
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

    return NextResponse.json(trip, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/trips error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where: any = {
      OR: [
        { createdById: userId },
        { participants: { some: { userId } } },
      ],
    };

    if (status) {
      where.status = status;
    }

    const trips = await prisma.trip.findMany({
      where,
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        },
        rounds: {
          include: {
            course: {
              select: { courseId: true, courseName: true, city: true, state: true },
            },
          },
        },
        _count: {
          select: { expenses: true, itinerary: true },
        },
      },
      orderBy: { startDate: "asc" },
    });

    return NextResponse.json({ trips });
  } catch (error: any) {
    console.error("GET /api/trips error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
