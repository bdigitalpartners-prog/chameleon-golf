import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPeopleRecommendations } from "@/lib/recommendations";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;
    const people = await getPeopleRecommendations(userId);
    return NextResponse.json({ people });
  } catch (error) {
    console.error("Failed to fetch people recommendations:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
