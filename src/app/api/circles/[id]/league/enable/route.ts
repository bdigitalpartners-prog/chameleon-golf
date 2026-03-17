import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { withCircleAuth } from "@/lib/circle-auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;

    if (process.env.FEATURE_EQ_LEAGUES !== "true") {
      return NextResponse.json({ error: "Leagues feature not enabled" }, { status: 403 });
    }

    const auth = await withCircleAuth(params.id, userId, ["OWNER", "ADMIN"]);
    if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status ?? 403 });

    const circle = await prisma.circle.update({
      where: { id: params.id },
      data: { isLeagueEnabled: true },
    });

    return NextResponse.json({ message: "League mode enabled", circle });
  } catch (error: any) {
    console.error("POST /api/circles/[id]/league/enable error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
