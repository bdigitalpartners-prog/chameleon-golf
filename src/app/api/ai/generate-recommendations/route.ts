import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateRecommendations, createNotifications } from "@/lib/ai/notifications";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // Feature flag check
    if (process.env.FEATURE_AI_CONCIERGE_DEEP !== "true") {
      return NextResponse.json(
        { error: "AI Concierge Deep feature is not enabled" },
        { status: 403 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const recommendations = await generateRecommendations(userId);
    const created = await createNotifications(userId, recommendations);

    return NextResponse.json({
      success: true,
      generated: recommendations.length,
      created,
    });
  } catch (error: any) {
    console.error("POST /api/ai/generate-recommendations error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
