import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { withCircleAuth } from "@/lib/circle-auth";
import { fanOutToCircle } from "@/lib/feed";
import { createNotification } from "@/lib/notifications";

export const dynamic = 'force-dynamic';

// GET — List events
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
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

  const searchParams = req.nextUrl.searchParams;
  const upcoming = searchParams.get("upcoming") === "true";
  const eventType = searchParams.get("eventType");
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(50, Number(searchParams.get("limit") ?? 20));

  const where: any = { circleId };
  if (upcoming) where.startDate = { gte: new Date() };
  if (eventType) where.eventType = eventType;

  const [events, total] = await Promise.all([
    prisma.circleEvent.findMany({
      where,
      include: {
        createdBy: { select: { id: true, name: true, image: true } },
        course: { select: { courseId: true, courseName: true } },
        rsvps: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
      },
      orderBy: { startDate: upcoming ? "asc" : "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.circleEvent.count({ where }),
  ]);

  // Enhance with RSVP counts and current user RSVP
  const enhanced = events.map((event) => {
    const goingCount = event.rsvps.filter((r) => r.status === "GOING").length;
    const maybeCount = event.rsvps.filter((r) => r.status === "MAYBE").length;
    const declinedCount = event.rsvps.filter(
      (r) => r.status === "DECLINED"
    ).length;
    const userRsvp = event.rsvps.find((r) => r.userId === userId);

    return {
      ...event,
      rsvpCounts: { going: goingCount, maybe: maybeCount, declined: declinedCount },
      userRsvp: userRsvp ?? null,
    };
  });

  return NextResponse.json({
    events: enhanced,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

// POST — Create event
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as any).id;
  const circleId = params.id;

  const auth = await withCircleAuth(circleId, userId, ["OWNER", "ADMIN"]);
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status }
    );
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
  } = body;

  if (!title || !startDate) {
    return NextResponse.json(
      { error: "Title and startDate are required" },
      { status: 400 }
    );
  }

  const event = await prisma.circleEvent.create({
    data: {
      circleId,
      createdById: userId,
      title,
      description: description ?? null,
      courseId: courseId ? Number(courseId) : null,
      eventType: eventType ?? "TEE_TIME",
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      rsvpDeadline: rsvpDeadline ? new Date(rsvpDeadline) : null,
      maxAttendees: maxAttendees ? Number(maxAttendees) : null,
      location: location ?? null,
    },
    include: {
      createdBy: { select: { id: true, name: true, image: true } },
      course: { select: { courseId: true, courseName: true } },
    },
  });

  // Notify all circle members
  const members = await prisma.circleMembership.findMany({
    where: { circleId, role: { in: ["OWNER", "ADMIN", "MEMBER"] } },
    select: { userId: true },
  });
  for (const member of members) {
    if (member.userId === userId) continue;
    await createNotification({
      userId: member.userId,
      type: "NEW_EVENT",
      title: `New event: ${title}`,
      body: `${new Date(startDate).toLocaleDateString()} — ${eventType?.replace("_", " ") ?? "Tee Time"}`,
      actionUrl: `/circles/${circleId}/events`,
    });
  }

  // Fan out to feed
  await fanOutToCircle({
    circleId,
    type: "NEW_EVENT",
    actorId: userId,
    metadata: { eventId: event.id, title, eventType },
  });

  return NextResponse.json({ event }, { status: 201 });
}
