import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { scoreId, action, reviewNotes } = await req.json();

    if (action === "approve") {
      await prisma.postedScore.update({
        where: { scoreId: parseInt(scoreId) },
        data: {
          verificationStatus: "verified",
          verifiedAt: new Date(),
          verifiedBy: (session.user as any).id,
        },
      });
      return NextResponse.json({ message: "Score verified" });
    }

    if (action === "reject") {
      await prisma.postedScore.update({
        where: { scoreId: parseInt(scoreId) },
        data: {
          verificationStatus: "rejected",
          verifiedAt: new Date(),
          verifiedBy: (session.user as any).id,
        },
      });
      return NextResponse.json({ message: "Score rejected" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/scores/verify error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
