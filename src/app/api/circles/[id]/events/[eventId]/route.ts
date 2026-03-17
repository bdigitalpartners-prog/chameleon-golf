import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { withCircleAuth } from "@/lib/circle-auth";

// GET /api/circles/[id]/events/[eventId] - Event detail with RSVPs
export async function GET(
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

    const event = await prisma.circleEvent.findFirst({
      where: { id: eventId, circleId },
      include: {
        rsvps: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        createdBy: { select: { id: true, name: true, image: true } },
        course: { select: { courseId: true, courseName: true } },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const goingCount = event.rsvps.filter((r) => r.status === "GOING").length;
    const maybeCount = event.rsvps.filter((r) => r.status === "MAYBE").length;
    const declinedCount = event.rsvps.filter((r) => r.status === "DECLINED").length;
    const currentUserRsvp = event.rsvps.find((r) => r.userId === userId)?.status || null;

    return NextResponse.json({
      ...event,
      goingCount,
      maybeCount,
      declinedCount,
      currentUserRsvp,
    });
  } catch (error: any) {
    console.error("GET /api/circles/[id]/events/[eventId] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/circles/[id]/events/[eventId] - Update event
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; eventId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;
    const { id: circleId, eventId } = params;

    const auth = await withCircleAuth(circleId, userId, ["OWNER", "ADMIN"]);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Verify the event belongs to this circle
    const existing = await prisma.circleEvent.findFirst({
      where: { id: eventId, circleId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
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

    const data: any = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (courseId !== undefined) data.courseId = courseId ? Number(courseId) : null;
    if (eventType !== undefined) data.eventType = eventType;
    if (startDate !== undefined) data.startDate = new Date(startDate);
    if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null;
    if (rsvpDeadline !== undefined) data.rsvpDeadline = rsvpDeadline ? new Date(rsvpDeadline) : null;
    if (maxAttendees !== undefined) data.maxAttendees = maxAttendees ? Number(maxAttendees) : null;
    if (location !== undefined) data.location = location;
    if (coverUrl !== undefined) data.coverUrl = coverUrl;

    const updated = await prisma.circleEvent.update({
      where: { id: eventId },
      data,
      include: {
        createdBy: { select: { id: true, name: true, image: true } },
        course: { select: { courseId: true, courseName: true } },
        rsvps: { select: { userId: true, status: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PATCH /api/circles/[id]/events/[eventId] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/circles/[id]/events/[eventId] - Cancel/delete event
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; eventId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;
    const { id: circleId, eventId } = params;

    const auth = await withCircleAuth(circleId, userId, ["OWNER", "ADMIN"]);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Verify the event belongs to this circle
    const existing = await prisma.circleEvent.findFirst({
      where: { id: eventId, circleId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    await prisma.circleEvent.delete({
      where: { id: eventId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/circles/[id]/events/[eventId] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
