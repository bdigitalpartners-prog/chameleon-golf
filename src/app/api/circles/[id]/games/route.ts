import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { withCircleAuth } from "@/lib/circle-auth";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;
  const circleId = params.id;

  const auth = await withCircleAuth(circleId, userId, ["OWNER", "ADMIN", "MEMBER"]);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status ?? 403 });

  const searchParams = req.nextUrl.searchParams;
  const status = searchParams.get("status");
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(50, Number(searchParams.get("limit") ?? 20));

  const where: any = { circleId };
  if (status) where.status = status;

  const [games, total] = await Promise.all([
    prisma.game.findMany({
      where,
      include: {
        createdBy: { select: { id: true, name: true, image: true } },
        course: { select: { courseId: true, courseName: true, facilityName: true } },
        players: { include: { user: { select: { id: true, name: true, image: true } } } },
        _count: { select: { scores: true, sideGames: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.game.count({ where }),
  ]);

  return NextResponse.json({ games, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;
  const circleId = params.id;

  const auth = await withCircleAuth(circleId, userId, ["OWNER", "ADMIN", "MEMBER"]);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status ?? 403 });

  const body = await req.json();
  const { format, courseId, name, startDate, holesPlayed, config, status: gameStatus } = body;

  if (!format) return NextResponse.json({ error: "Format is required" }, { status: 400 });

  const game = await prisma.game.create({
    data: {
      circleId,
      createdById: userId,
      format,
      courseId: courseId ? Number(courseId) : null,
      name: name || null,
      startDate: startDate ? new Date(startDate) : null,
      holesPlayed: holesPlayed ?? 18,
      config: config ?? undefined,
      status: gameStatus ?? "SETUP",
    },
    include: {
      createdBy: { select: { id: true, name: true, image: true } },
      course: { select: { courseId: true, courseName: true } },
    },
  });

  // Auto-add creator as first player
  await prisma.gamePlayer.create({
    data: {
      gameId: game.id,
      userId,
      status: "CONFIRMED",
    },
  });

  return NextResponse.json({ game }, { status: 201 });
}
