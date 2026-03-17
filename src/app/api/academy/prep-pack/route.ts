import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;

    if (process.env.FEATURE_EQ_ACADEMY !== "true") {
      return NextResponse.json({ error: "Academy feature not enabled" }, { status: 403 });
    }

    const prepPacks = await prisma.prepPack.findMany({
      where: { userId },
      include: {
        course: { select: { courseId: true, courseName: true, city: true, state: true } },
      },
      orderBy: { generatedAt: "desc" },
    });

    return NextResponse.json({ prepPacks });
  } catch (error: any) {
    console.error("GET /api/academy/prep-pack error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
