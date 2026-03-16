import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const recommendation = await prisma.courseRecommendation.findUnique({
      where: { id: params.id },
    });

    if (!recommendation || recommendation.userId !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.courseRecommendation.update({
      where: { id: params.id },
      data: { dismissed: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to dismiss recommendation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
