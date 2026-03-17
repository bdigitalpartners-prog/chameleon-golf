import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generatePrepPack } from "@/lib/academy/prep-pack-generator";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;

    if (process.env.FEATURE_EQ_ACADEMY !== "true") {
      return NextResponse.json({ error: "Academy feature not enabled" }, { status: 403 });
    }

    const courseId = parseInt(params.courseId, 10);
    if (isNaN(courseId)) return NextResponse.json({ error: "Invalid courseId" }, { status: 400 });

    // Check for existing prep pack
    const existing = await prisma.prepPack.findUnique({
      where: { userId_courseId: { userId, courseId } },
      include: {
        course: { select: { courseId: true, courseName: true, city: true, state: true } },
      },
    });

    if (existing) return NextResponse.json({ prepPack: existing });

    // Generate new one
    const data = await generatePrepPack(userId, courseId);
    if (!data) return NextResponse.json({ error: "Course not found" }, { status: 404 });

    const prepPack = await prisma.prepPack.create({
      data: {
        userId,
        courseId,
        keyHoles: data.keyHoles,
        strategyTips: data.strategyTips,
        clubSuggestions: data.clubSuggestions,
        expectations: data.expectations,
      },
      include: {
        course: { select: { courseId: true, courseName: true, city: true, state: true } },
      },
    });

    return NextResponse.json({ prepPack });
  } catch (error: any) {
    console.error("GET /api/academy/prep-pack/[courseId] error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;

    if (process.env.FEATURE_EQ_ACADEMY !== "true") {
      return NextResponse.json({ error: "Academy feature not enabled" }, { status: 403 });
    }

    const courseId = parseInt(params.courseId, 10);
    if (isNaN(courseId)) return NextResponse.json({ error: "Invalid courseId" }, { status: 400 });

    const data = await generatePrepPack(userId, courseId);
    if (!data) return NextResponse.json({ error: "Course not found" }, { status: 404 });

    const prepPack = await prisma.prepPack.upsert({
      where: { userId_courseId: { userId, courseId } },
      update: {
        keyHoles: data.keyHoles,
        strategyTips: data.strategyTips,
        clubSuggestions: data.clubSuggestions,
        expectations: data.expectations,
        generatedAt: new Date(),
      },
      create: {
        userId,
        courseId,
        keyHoles: data.keyHoles,
        strategyTips: data.strategyTips,
        clubSuggestions: data.clubSuggestions,
        expectations: data.expectations,
      },
      include: {
        course: { select: { courseId: true, courseName: true, city: true, state: true } },
      },
    });

    return NextResponse.json({ prepPack }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/academy/prep-pack/[courseId] error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
