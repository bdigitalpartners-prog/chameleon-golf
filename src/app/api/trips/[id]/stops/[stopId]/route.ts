import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; stopId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;

    const trip = await prisma.trip.findUnique({
      where: { id: params.id },
      include: { participants: { select: { userId: true, role: true } } },
    });

    if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });

    const isCreator = trip.createdById === userId;
    const isOrganizer = trip.participants.some(
      (p) => p.userId === userId && p.role === "organizer"
    );
    if (!isCreator && !isOrganizer)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const updateData: any = {};
    if (body.playDate !== undefined) updateData.playDate = body.playDate ? new Date(body.playDate) : null;
    if (body.teeTime !== undefined) updateData.teeTime = body.teeTime;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder;

    const round = await prisma.tripRound.update({
      where: { id: params.stopId },
      data: updateData,
      include: {
        course: {
          select: {
            courseId: true,
            courseName: true,
            city: true,
            state: true,
            greenFeeLow: true,
            greenFeeHigh: true,
          },
        },
      },
    });

    return NextResponse.json(round);
  } catch (error: any) {
    console.error("PUT /api/trips/[id]/stops/[stopId] error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; stopId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;

    const trip = await prisma.trip.findUnique({
      where: { id: params.id },
      include: { participants: { select: { userId: true, role: true } } },
    });

    if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });

    const isCreator = trip.createdById === userId;
    const isOrganizer = trip.participants.some(
      (p) => p.userId === userId && p.role === "organizer"
    );
    if (!isCreator && !isOrganizer)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.tripRound.delete({ where: { id: params.stopId } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/trips/[id]/stops/[stopId] error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
