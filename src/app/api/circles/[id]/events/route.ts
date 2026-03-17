import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { withCircleAuth } from "@/lib/circle-auth";
import { createNotification } from "@/lib/notifications";
import { fanOutToCircle } from "@/lib/feed";

// POST /api/circles/[id]/events - Create event
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;
    const { id: circleId } = params;

    const auth = await withCircleAuth(circleId, userId, ["OWNER", "ADMIN"]);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const {
      title,
      description,
      courseId,
      eventType,
      startDate,
      endDate,
      rsvpDeadline,
      maxAttendees,
      location,
      coverUrl,
    } = body;

    if (!title || !eventType || !startDate) {
      return NextResponse.json(
        { error: "title, eventType, and startDate are required" },
        { status: 400 }
      );
    }

    // Validate startDate is a valid date
    const parsedStartDate = new Date(startDate);
    if (isNaN(parsedStartDate.getTime())) {
      return NextResponse.json({ error: "startDate must be a valid date" }, { status: 400 });
    }

    // Validate endDate if provided
    if (endDate) {
      const parsedEndDate = new Date(endDate);
      if (isNaN(parsedEndDate.getTime())) {
        return NextResponse.json({ error: "endDate must be a valid date" }, { status: 400 });
      }
      if (parsedEndDate <= parsedStartDate) {
        return NextResponse.json({ error: "endDate must be after startDate" }, { status: 400 });
      }
    }

    // Validate maxAttendees if provided
    if (maxAttendees !== undefined && maxAttendees !== null) {
      const maxAttendeesNum = Number(maxAttendees);
      if (!Number.isInteger(maxAttendeesNum) || maxAttendeesNum < 1) {
        return NextResponse.json({ error: "maxAttendees must be an integer >= 1" }, { status: 400 });
      }
    }

    const event = await prisma.circleEvent.create({
      data: {
        circleId,
        createdById: userId,
        title,
        description: description || null,
        courseId: courseId ? Number(courseId) : null,
        eventType,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        rsvpDeadline: rsvpDeadline ? new Date(rsvpDeadline) : null,
        maxAttendees: maxAttendees ? Number(maxAttendees) : null,
        location: location || null,
        coverUrl: coverUrl || null,
      },
      include: {
        createdBy: { select: { id: true, name: true, image: true } },
        course: { select: { courseId: true, courseName: true } },
        rsvps: { select: { userId: true, status: true } },
      },
    });

    // Fan-out to feed
    await fanOutToCircle({
      circleId,
      type: "EVENT_CREATED",
      actorId: userId,
      metadata: { eventId: event.id, title },
    });

    // Notify all circle members
    const members = await prisma.circleMembership.findMany({
      where: { circleId, userId: { not: userId } },
      select: { userId: true },
    });

    await Promise.all(
      members.map((member) =>
        createNotification({
          userId: member.userId,
          type: "EVENT_CREATED",
          title: `New event: ${title}`,
          actionUrl: `/circles/${circleId}/events/${event.id}`,
          metadata: { circleId, eventId: event.id, actorId: userId },
        })
      )
    );

    return NextResponse.json(event, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/circles/[id]/events error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/circles/[id]/events - List events
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
    const upcoming = searchParams.get("upcoming");
    const eventType = searchParams.get("eventType");
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
    const skip = (page - 1) * limit;

    const where: any = { circleId };

    if (upcoming === "true") {
      where.startDate = { gte: new Date() };
    }

    if (eventType) {
      where.eventType = eventType;
    }

    const orderBy = upcoming === "true"
      ? { startDate: "asc" as const }
      : { startDate: "desc" as const };

    const [events, total] = await Promise.all([
      prisma.circleEvent.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          rsvps: { select: { userId: true, status: true } },
          createdBy: { select: { id: true, name: true, image: true } },
          course: { select: { courseId: true, courseName: true } },
        },
      }),
      prisma.circleEvent.count({ where }),
    ]);

    const eventsWithCounts = events.map((event) => {
      const goingCount = event.rsvps.filter((r) => r.status === "GOING").length;
      const maybeCount = event.rsvps.filter((r) => r.status === "MAYBE").length;
      const declinedCount = event.rsvps.filter((r) => r.status === "DECLINED").length;
      const currentUserRsvp = event.rsvps.find((r) => r.userId === userId)?.status || null;

      return {
        ...event,
        goingCount,
        maybeCount,
        declinedCount,
        currentUserRsvp,
      };
    });

    return NextResponse.json({
      events: eventsWithCounts,
      page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error: any) {
    console.error("GET /api/circles/[id]/events error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
