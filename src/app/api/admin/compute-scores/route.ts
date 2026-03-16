import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/admin-auth";
import { computeAllDimensionScores, getScoreStatus } from "@/lib/dimension-scores";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes for batch computation

/**
 * GET /api/admin/compute-scores — Get score computation status.
 */
export async function GET(req: NextRequest) {
  const authError = await checkAdminAuth(req);
  if (authError) return authError;

  try {
    const status = await getScoreStatus();
    return NextResponse.json(status);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("GET /api/admin/compute-scores error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/admin/compute-scores — Trigger batch score computation.
 */
export async function POST(req: NextRequest) {
  const authError = await checkAdminAuth(req);
  if (authError) return authError;

  try {
    const result = await computeAllDimensionScores();
    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("POST /api/admin/compute-scores error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
