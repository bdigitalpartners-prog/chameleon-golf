import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateRecommendations } from "@/lib/recommendations";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    // Run recommendation generation (fire and don't block response for too long)
    generateRecommendations(userId).catch((err) =>
      console.error("Background recommendation generation failed:", err)
    );

    return NextResponse.json({ success: true, message: "Recommendations are being regenerated" });
  } catch (error) {
    console.error("Failed to refresh recommendations:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
