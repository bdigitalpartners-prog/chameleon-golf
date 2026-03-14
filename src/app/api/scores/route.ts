import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const scores = await prisma.postedScore.findMany({
      where: { userId: (session.user as any).id },
      include: { course: { select: { courseName: true, city: true, state: true } } },
      orderBy: { datePlayed: "desc" },
    });

    return NextResponse.json(scores);
  } catch (error: any) {
    console.error("GET /api/scores error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { courseId, datePlayed, totalScore, frontNineScore, backNineScore, teeId, notes } = body;

    const score = await prisma.postedScore.create({
      data: {
        userId: (session.user as any).id,
        courseId: parseInt(courseId),
        datePlayed: new Date(datePlayed),
        totalScore: parseInt(totalScore),
        frontNineScore: frontNineScore ? parseInt(frontNineScore) : null,
        backNineScore: backNineScore ? parseInt(backNineScore) : null,
        teeId: teeId ? parseInt(teeId) : null,
        notes: notes || null,
      },
    });

    return NextResponse.json(score, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/scores error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
