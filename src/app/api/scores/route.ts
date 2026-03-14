import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const scores = await prisma.postedScore.findMany({
    where: { userId: (session.user as any).id },
    include: { course: { select: { courseName: true, city: true, state: true } } },
    orderBy: { datePlayed: "desc" },
  });

  return NextResponse.json(scores);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { courseId, datePlayed, grossScore, netScore, courseHandicap, teeBoxPlayed } = body;

  const score = await prisma.postedScore.create({
    data: {
      userId: (session.user as any).id,
      courseId: parseInt(courseId),
      datePlayed: new Date(datePlayed),
      grossScore: parseInt(grossScore),
      netScore: netScore ? parseInt(netScore) : null,
      courseHandicap: courseHandicap ? parseInt(courseHandicap) : null,
      teeBoxPlayed: teeBoxPlayed || null,
    },
  });

  return NextResponse.json(score, { status: 201 });
}
