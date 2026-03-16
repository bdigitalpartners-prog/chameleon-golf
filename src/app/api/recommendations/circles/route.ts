import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCircleRecommendations } from "@/lib/recommendations";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;
    const circles = await getCircleRecommendations(userId);
    return NextResponse.json({ circles });
  } catch (error) {
    console.error("Failed to fetch circle recommendations:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
