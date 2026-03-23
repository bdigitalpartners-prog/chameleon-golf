import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST — Vote on a condition report's helpfulness
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const conditionId = Number(params.id);

  if (isNaN(conditionId)) {
    return NextResponse.json(
      { error: "Invalid condition ID" },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const voteType = body.voteType;

    if (!["helpful", "not_helpful"].includes(voteType)) {
      return NextResponse.json(
        { error: "voteType must be 'helpful' or 'not_helpful'" },
        { status: 400 }
      );
    }

    // Upsert vote — user can change their vote
    await prisma.$queryRawUnsafe(
      `INSERT INTO condition_votes (condition_id, user_id, vote_type)
       VALUES ($1, $2, $3)
       ON CONFLICT (condition_id, user_id)
       DO UPDATE SET vote_type = $3`,
      conditionId,
      userId,
      voteType
    );

    // Return updated vote counts
    const counts = await prisma.$queryRawUnsafe<any[]>(
      `SELECT
         COALESCE(SUM(CASE WHEN vote_type = 'helpful' THEN 1 ELSE 0 END), 0)::int as helpful,
         COALESCE(SUM(CASE WHEN vote_type = 'not_helpful' THEN 1 ELSE 0 END), 0)::int as not_helpful
       FROM condition_votes WHERE condition_id = $1`,
      conditionId
    );

    return NextResponse.json({
      conditionId,
      votes: counts[0] || { helpful: 0, not_helpful: 0 },
    });
  } catch (error) {
    console.error("POST /api/conditions/[id]/vote error:", error);
    return NextResponse.json(
      { error: "Failed to submit vote" },
      { status: 500 }
    );
  }
}
