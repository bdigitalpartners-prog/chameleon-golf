import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { withCircleAuth } from "@/lib/circle-auth";

// GET — Event detail with RSVPs
export async function GET(
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
    include: {
      createdBy: { select: { id: true, name: true, image: true } },
      course: { select: { courseId: true, courseName: true } },
      rsvps: {
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!event || event.circleId !== circleId) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const goingCount = event.rsvps.filter((r) => r.status === "GOING").length;
  const maybeCount = event.rsvps.filter((r) => r.status === "MAYBE").length;
  const declinedCount = event.rsvps.filter(
    (r) => r.status === "DECLINED"
  ).length;
  const userRsvp = event.rsvps.find((r) => r.userId === userId);

  return NextResponse.json({
    event: {
      ...event,
      rsvpCounts: { going: goingCount, maybe: maybeCount, declined: declinedCount },
      userRsvp: userRsvp ?? null,
    },
  });
}

// PATCH — Update event (ADMIN/OWNER)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; eventId: string } }
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

  const existing = await prisma.circleEvent.findUnique({
    where: { id: params.eventId },
  });
  if (!existing || existing.circleId !== circleId) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const body = await req.json();
  const data: any = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.description !== undefined) data.description = body.description;
  if (body.courseId !== undefined)
    data.courseId = body.courseId ? Number(body.courseId) : null;
  if (body.eventType !== undefined) data.eventType = body.eventType;
  if (body.startDate !== undefined) data.startDate = new Date(body.startDate);
  if (body.endDate !== undefined)
    data.endDate = body.endDate ? new Date(body.endDate) : null;
  if (body.rsvpDeadline !== undefined)
    data.rsvpDeadline = body.rsvpDeadline
      ? new Date(body.rsvpDeadline)
      : null;
  if (body.maxAttendees !== undefined)
    data.maxAttendees = body.maxAttendees ? Number(body.maxAttendees) : null;
  if (body.location !== undefined) data.location = body.location;

  const event = await prisma.circleEvent.update({
    where: { id: params.eventId },
    data,
    include: {
      createdBy: { select: { id: true, name: true, image: true } },
      course: { select: { courseId: true, courseName: true } },
    },
  });

  return NextResponse.json({ event });
}

// DELETE — Cancel event (ADMIN/OWNER)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; eventId: string } }
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

  const existing = await prisma.circleEvent.findUnique({
    where: { id: params.eventId },
  });
  if (!existing || existing.circleId !== circleId) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  await prisma.circleEvent.delete({ where: { id: params.eventId } });

  return NextResponse.json({ success: true });
}
