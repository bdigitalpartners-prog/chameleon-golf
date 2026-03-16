import { NextRequest, NextResponse } from "next/server";
import { recomputeAndStoreScores } from "@/lib/chameleon-score-server";
import { computePersonalizedScore } from "@/lib/circle-score";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

/**
 * POST — Admin: recompute all editorial scores (unchanged)
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const count = await recomputeAndStoreScores();
  return NextResponse.json({ message: `Recomputed scores for ${count} courses` });
}

/**
 * GET — Personalized Chameleon Score for a course (authenticated user)
 * Query: ?courseId=123
 * Returns editorial + personal + circle components with weights
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const courseIdParam = req.nextUrl.searchParams.get("courseId");
  if (!courseIdParam) {
    return NextResponse.json({ error: "courseId is required" }, { status: 400 });
  }

  const courseId = parseInt(courseIdParam, 10);
  if (isNaN(courseId)) {
    return NextResponse.json({ error: "Invalid courseId" }, { status: 400 });
  }

  const userId = (session.user as any).id;
  const result = await computePersonalizedScore(userId, courseId);

  return NextResponse.json(result);
}
