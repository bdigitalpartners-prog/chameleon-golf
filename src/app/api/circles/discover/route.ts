import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { searchParams } = new URL(req.url);
    const typeFilter = searchParams.get("type");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort") ?? "members";
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? "20", 10);

    const where: any = {
      privacy: "PUBLIC",
      members: {
        none: { userId },
      },
    };

    if (typeFilter) {
      where.type = typeFilter;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const orderBy: any =
      sort === "newest" ? { createdAt: "desc" } : { memberCount: "desc" };

    const [circles, total] = await Promise.all([
      prisma.circle.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          type: true,
          avatarUrl: true,
          memberCount: true,
          createdAt: true,
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.circle.count({ where }),
    ]);

    return NextResponse.json({
      circles,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error("GET /api/circles/discover error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
