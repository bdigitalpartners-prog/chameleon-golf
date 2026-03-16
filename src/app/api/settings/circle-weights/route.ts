import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

/**
 * GET — Retrieve user's circle weight settings
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;

    // Get user's circle memberships
    const memberships = await prisma.circleMembership.findMany({
      where: { userId, role: { in: ["OWNER", "ADMIN", "MEMBER"] } },
      include: { circle: { select: { id: true, name: true, avatarUrl: true } } },
    });

    if (memberships.length === 0) {
      return NextResponse.json({ weights: [] });
    }

    // Ensure weights exist for all circles
    for (const m of memberships) {
      await prisma.circleScoreWeight.upsert({
        where: { userId_circleId: { userId, circleId: m.circleId } },
        create: { userId, circleId: m.circleId, weight: 0.5, enabled: true },
        update: {},
      });
    }

    const weights = await prisma.circleScoreWeight.findMany({
      where: { userId },
      include: {
        circle: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { circle: { name: "asc" } },
    });

    return NextResponse.json({
      weights: weights.map((w) => ({
        circleId: w.circleId,
        circleName: w.circle.name,
        avatarUrl: w.circle.avatarUrl,
        weight: w.weight,
        enabled: w.enabled,
      })),
    });
  } catch (error: any) {
    console.error("GET /api/settings/circle-weights error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

/**
 * PUT — Update user's circle weight settings
 * Body: { weights: [{ circleId, weight, enabled }] }
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;

    const body = await req.json();
    const { weights } = body;

    if (!Array.isArray(weights)) {
      return NextResponse.json({ error: "weights must be an array" }, { status: 400 });
    }

    for (const w of weights) {
      if (!w.circleId || typeof w.weight !== "number" || typeof w.enabled !== "boolean") {
        return NextResponse.json({ error: "Each weight must have circleId, weight (number), enabled (boolean)" }, { status: 400 });
      }
      if (w.weight < 0 || w.weight > 1) {
        return NextResponse.json({ error: "Weight must be between 0.0 and 1.0" }, { status: 400 });
      }
    }

    // Verify user is a member of each circle
    const circleIds = weights.map((w: any) => w.circleId);
    const memberships = await prisma.circleMembership.findMany({
      where: { userId, circleId: { in: circleIds }, role: { in: ["OWNER", "ADMIN", "MEMBER"] } },
    });
    const memberCircleIds = new Set(memberships.map((m) => m.circleId));

    for (const w of weights) {
      if (!memberCircleIds.has(w.circleId)) {
        return NextResponse.json({ error: `Not a member of circle ${w.circleId}` }, { status: 403 });
      }
    }

    // Upsert all weights
    await Promise.all(
      weights.map((w: any) =>
        prisma.circleScoreWeight.upsert({
          where: { userId_circleId: { userId, circleId: w.circleId } },
          create: { userId, circleId: w.circleId, weight: w.weight, enabled: w.enabled },
          update: { weight: w.weight, enabled: w.enabled },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PUT /api/settings/circle-weights error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
