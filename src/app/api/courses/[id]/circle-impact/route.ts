import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { computePersonalizedScore } from "@/lib/circle-score";

/**
 * GET — How circles affect the user's Chameleon Score for a course
 * Returns per-circle breakdown showing each circle's influence
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;
    const courseId = parseInt(params.id, 10);

    if (isNaN(courseId)) {
      return NextResponse.json({ error: "Invalid courseId" }, { status: 400 });
    }

    const result = await computePersonalizedScore(userId, courseId);

    // Calculate per-circle impact on final score
    const circleImpact = result.circleBreakdown.map((cb) => {
      const impact = result.weights.circle > 0 && result.personalizedScore !== null
        ? Math.round(cb.weight * cb.avgScore * result.weights.circle * 10) / 10
        : 0;

      return {
        circleId: cb.circleId,
        circleName: cb.circleName,
        avgScore: cb.avgScore,
        weight: cb.weight,
        ratingCount: cb.ratingCount,
        impactOnScore: impact,
      };
    });

    return NextResponse.json({
      courseId,
      personalizedScore: result.personalizedScore,
      editorialScore: result.editorialScore,
      personalScore: result.personalScore,
      circleScore: result.circleScore,
      circleImpact,
      weights: result.weights,
    });
  } catch (error: any) {
    console.error("GET /api/courses/[courseId]/circle-impact error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
