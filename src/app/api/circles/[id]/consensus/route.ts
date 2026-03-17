import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { withCircleAuth } from "@/lib/circle-auth";
import { recalculateAllConsensus } from "@/lib/consensus";

export const dynamic = 'force-dynamic';

/**
 * GET — Circle consensus analysis
 * Query: sort (agreement|divergence|score), page, limit, refresh (boolean)
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;
    const { id: circleId } = params;

    const auth = await withCircleAuth(circleId, userId, ["OWNER", "ADMIN", "MEMBER"]);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const sort = searchParams.get("sort") ?? "agreement";
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(Number(searchParams.get("limit") ?? 20), 100);
    const refresh = searchParams.get("refresh") === "true";

    // Optionally recalculate
    if (refresh) {
      await recalculateAllConsensus(circleId);
    }

    let orderBy: any;
    switch (sort) {
      case "divergence":
        orderBy = { agreementLevel: "asc" };
        break;
      case "score":
        orderBy = { consensusScore: "desc" };
        break;
      default:
        orderBy = { agreementLevel: "desc" };
    }

    const [consensus, total] = await Promise.all([
      prisma.circleConsensus.findMany({
        where: { circleId },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          course: {
            select: {
              courseId: true,
              courseName: true,
              city: true,
              state: true,
              accessType: true,
            },
          },
        },
      }),
      prisma.circleConsensus.count({ where: { circleId } }),
    ]);

    return NextResponse.json({
      consensus: consensus.map((c) => ({
        courseId: c.courseId,
        course: c.course,
        consensusScore: c.consensusScore,
        agreementLevel: c.agreementLevel,
        comparedToNational: c.comparedToNational,
        outlierCount: c.outlierUserIds.length,
        lastUpdated: c.lastUpdated,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error("GET /api/circles/[id]/consensus error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
