import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (process.env.FEATURE_EQ_ACADEMY !== "true") {
      return NextResponse.json({ error: "Academy feature not enabled" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const difficulty = searchParams.get("difficulty");

    const content = await prisma.academyContent.findMany({
      where: {
        ...(category ? { category } : {}),
        ...(difficulty ? { difficulty } : {}),
        publishedAt: { not: null },
      },
      orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { publishedAt: "desc" }],
    });

    return NextResponse.json({ content });
  } catch (error: any) {
    console.error("GET /api/academy/content error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
