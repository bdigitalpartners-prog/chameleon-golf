import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const where: any = {};
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }

    const tags = await prisma.tag.findMany({
      where,
      orderBy: [{ category: "asc" }, { usageCount: "desc" }, { name: "asc" }],
    });

    return NextResponse.json(tags);
  } catch (error: any) {
    console.error("GET /api/tags error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
