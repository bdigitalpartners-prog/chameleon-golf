import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;

    if (process.env.FEATURE_EQ_ACADEMY !== "true") {
      return NextResponse.json({ error: "Academy feature not enabled" }, { status: 403 });
    }

    const debriefs = await prisma.courseDebrief.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ debriefs });
  } catch (error: any) {
    console.error("GET /api/academy/debrief error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;

    if (process.env.FEATURE_EQ_ACADEMY !== "true") {
      return NextResponse.json({ error: "Academy feature not enabled" }, { status: 403 });
    }

    const { roundId, courseId, greensQuality, fairwayQuality, paceOfPlay, difficulty, standoutHoles, recommendations, wouldReturn } = await req.json();

    const debrief = await prisma.courseDebrief.create({
      data: {
        userId,
        roundId: roundId ? parseInt(roundId, 10) : null,
        courseId: courseId ? parseInt(courseId, 10) : null,
        greensQuality,
        fairwayQuality,
        paceOfPlay,
        difficulty,
        standoutHoles,
        recommendations,
        wouldReturn,
      },
    });

    return NextResponse.json({ debrief }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/academy/debrief error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
