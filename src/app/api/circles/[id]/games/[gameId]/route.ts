import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { withCircleAuth } from "@/lib/circle-auth";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string; gameId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  const auth = await withCircleAuth(params.id, userId, ["OWNER", "ADMIN", "MEMBER"]);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status ?? 403 });

  const game = await prisma.game.findUnique({
    where: { id: params.gameId },
    include: {
      createdBy: { select: { id: true, name: true, image: true } },
      course: { select: { courseId: true, courseName: true, facilityName: true, par: true } },
      players: {
        include: { user: { select: { id: true, name: true, image: true } } },
        orderBy: { status: "asc" },
      },
      scores: { orderBy: [{ userId: "asc" }, { holeNumber: "asc" }] },
      sideGames: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!game || game.circleId !== params.id) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  return NextResponse.json({ game });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string; gameId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  const auth = await withCircleAuth(params.id, userId, ["OWNER", "ADMIN", "MEMBER"]);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status ?? 403 });

  const existing = await prisma.game.findUnique({ where: { id: params.gameId } });
  if (!existing || existing.circleId !== params.id) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  // Only creator or admin can update
  if (existing.createdById !== userId && auth.membership?.role !== "OWNER" && auth.membership?.role !== "ADMIN") {
    return NextResponse.json({ error: "Only the game creator or admins can update" }, { status: 403 });
  }

  const body = await req.json();
  const { status, name, config, courseId, startDate, holesPlayed } = body;

  const game = await prisma.game.update({
    where: { id: params.gameId },
    data: {
      ...(status && { status }),
      ...(name !== undefined && { name }),
      ...(config !== undefined && { config }),
      ...(courseId !== undefined && { courseId: courseId ? Number(courseId) : null }),
      ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
      ...(holesPlayed !== undefined && { holesPlayed }),
    },
    include: {
      createdBy: { select: { id: true, name: true, image: true } },
      course: { select: { courseId: true, courseName: true } },
      players: { include: { user: { select: { id: true, name: true, image: true } } } },
    },
  });

  return NextResponse.json({ game });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string; gameId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  const auth = await withCircleAuth(params.id, userId, ["OWNER", "ADMIN", "MEMBER"]);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status ?? 403 });

  const existing = await prisma.game.findUnique({ where: { id: params.gameId } });
  if (!existing || existing.circleId !== params.id) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  if (existing.createdById !== userId && auth.membership?.role !== "OWNER" && auth.membership?.role !== "ADMIN") {
    return NextResponse.json({ error: "Only the game creator or admins can cancel" }, { status: 403 });
  }

  await prisma.game.update({
    where: { id: params.gameId },
    data: { status: "CANCELLED" },
  });

  return NextResponse.json({ success: true });
}
