import { NextRequest, NextResponse } from "next/server";
import { recomputeAndStoreScores } from "@/lib/chameleon-score";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const count = await recomputeAndStoreScores();
  return NextResponse.json({ message: `Recomputed scores for ${count} courses` });
}
