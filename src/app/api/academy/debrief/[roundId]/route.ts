import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { roundId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;

    if (process.env.FEATURE_EQ_ACADEMY !== "true") {
      return NextResponse.json({ error: "Academy feature not enabled" }, { status: 403 });
    }

    const debrief = await prisma.courseDebrief.findFirst({
      where: { id: params.roundId, userId },
    });

    if (!debrief) return NextResponse.json({ error: "Debrief not found" }, { status: 404 });

    return NextResponse.json({ debrief });
  } catch (error: any) {
    console.error("GET /api/academy/debrief/[roundId] error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { roundId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;

    if (process.env.FEATURE_EQ_ACADEMY !== "true") {
      return NextResponse.json({ error: "Academy feature not enabled" }, { status: 403 });
    }

    const existing = await prisma.courseDebrief.findFirst({
      where: { id: params.roundId, userId },
    });
    if (!existing) return NextResponse.json({ error: "Debrief not found" }, { status: 404 });

    const body = await req.json();
    const debrief = await prisma.courseDebrief.update({
      where: { id: params.roundId },
      data: {
        greensQuality: body.greensQuality ?? existing.greensQuality,
        fairwayQuality: body.fairwayQuality ?? existing.fairwayQuality,
        paceOfPlay: body.paceOfPlay ?? existing.paceOfPlay,
        difficulty: body.difficulty ?? existing.difficulty,
        standoutHoles: body.standoutHoles ?? existing.standoutHoles,
        recommendations: body.recommendations ?? existing.recommendations,
        wouldReturn: body.wouldReturn ?? existing.wouldReturn,
        aiSummary: body.aiSummary ?? existing.aiSummary,
      },
    });

    return NextResponse.json({ debrief });
  } catch (error: any) {
    console.error("PUT /api/academy/debrief/[roundId] error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
