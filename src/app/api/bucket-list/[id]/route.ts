import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const VALID_STATUSES = ["Want to Play", "Planning", "Booked", "Played"];
const VALID_PRIORITIES = ["Low", "Medium", "High", "Must-Play"];

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const existing = await prisma.bucketListItem.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json();
    const data: any = { updatedAt: new Date() };

    if (body.priority !== undefined) {
      if (VALID_PRIORITIES.includes(body.priority)) data.priority = body.priority;
    }
    if (body.status !== undefined) {
      if (VALID_STATUSES.includes(body.status)) data.status = body.status;
      if (body.status === "Played" && !existing.playedAt) {
        data.playedAt = new Date();
      }
    }
    if (body.notes !== undefined) data.notes = body.notes || null;
    if (body.targetDate !== undefined) {
      data.targetDate = body.targetDate ? new Date(body.targetDate) : null;
    }
    if (body.rating !== undefined) {
      data.rating = body.rating !== null ? parseFloat(body.rating) : null;
    }
    if (body.playedAt !== undefined) {
      data.playedAt = body.playedAt ? new Date(body.playedAt) : null;
    }

    const updated = await prisma.bucketListItem.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      id: updated.id,
      courseId: updated.courseId,
      priority: updated.priority,
      status: updated.status,
      notes: updated.notes,
      rating: updated.rating ? Number(updated.rating) : null,
      playedAt: updated.playedAt?.toISOString() ?? null,
      targetDate: updated.targetDate?.toISOString() ?? null,
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("[BucketList PATCH]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const existing = await prisma.bucketListItem.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.bucketListItem.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[BucketList DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
