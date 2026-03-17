import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { withCircleAuth } from "@/lib/circle-auth";
import { createNotification } from "@/lib/notifications";

export const dynamic = 'force-dynamic';

/**
 * POST — Create a trip plan
 * Body: { title, destination?, startDate?, endDate?, notes? }
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;
    const { id: circleId } = params;

    const auth = await withCircleAuth(circleId, userId, ["OWNER", "ADMIN", "MEMBER"]);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const { title, destination, startDate, endDate, notes } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Validate dates if provided
    if (startDate) {
      const parsedStart = new Date(startDate);
      if (isNaN(parsedStart.getTime())) {
        return NextResponse.json({ error: "startDate must be a valid date" }, { status: 400 });
      }
    }
    if (endDate) {
      const parsedEnd = new Date(endDate);
      if (isNaN(parsedEnd.getTime())) {
        return NextResponse.json({ error: "endDate must be a valid date" }, { status: 400 });
      }
    }
    if (startDate && endDate) {
      if (new Date(endDate) <= new Date(startDate)) {
        return NextResponse.json({ error: "endDate must be after startDate" }, { status: 400 });
      }
    }

    const trip = await prisma.tripPlan.create({
      data: {
        creatorId: userId,
        circleId,
        title: title.trim(),
        destination: destination?.trim() || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        notes: notes?.trim() || null,
      },
      include: {
        creator: { select: { id: true, name: true, image: true } },
      },
    });

    // Notify circle members
    const members = await prisma.circleMembership.findMany({
      where: { circleId, userId: { not: userId }, role: { in: ["OWNER", "ADMIN", "MEMBER"] } },
      select: { userId: true },
    });

    await Promise.all(
      members.map((m) =>
        createNotification({
          userId: m.userId,
          type: "TRIP_CREATED",
          title: `New trip planned: ${trip.title}`,
          body: `${(session.user as any).name || "A member"} created a trip plan in ${auth.circle!.name}`,
          actionUrl: `/circles/${circleId}/trips/${trip.id}`,
          metadata: { tripId: trip.id, circleId },
        })
      )
    );

    return NextResponse.json(trip, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/circles/[id]/trips error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

/**
 * GET — List circle trips
 * Query: status, upcoming (boolean), page, limit
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;
    const { id: circleId } = params;

    const auth = await withCircleAuth(circleId, userId, ["OWNER", "ADMIN", "MEMBER"]);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const upcoming = searchParams.get("upcoming") === "true";
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(50, Number(searchParams.get("limit") ?? 20));

    const where: any = { circleId };
    if (status) where.status = status;
    if (upcoming) where.startDate = { gte: new Date() };

    const [trips, total] = await Promise.all([
      prisma.tripPlan.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          creator: { select: { id: true, name: true, image: true } },
          courses: { select: { courseId: true } },
          votes: { select: { userId: true } },
        },
      }),
      prisma.tripPlan.count({ where }),
    ]);

    return NextResponse.json({
      trips: trips.map((t) => ({
        ...t,
        courseCount: t.courses.length,
        voterCount: new Set(t.votes.map((v) => v.userId)).size,
        courses: undefined,
        votes: undefined,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error("GET /api/circles/[id]/trips error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
