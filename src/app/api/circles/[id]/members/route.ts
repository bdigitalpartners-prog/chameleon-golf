import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: circleId } = params;
    const { searchParams } = new URL(req.url);
    const roleFilter = searchParams.get("role");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? "20", 10);

    const circle = await prisma.circle.findUnique({ where: { id: circleId } });
    if (!circle) {
      return NextResponse.json({ error: "Circle not found" }, { status: 404 });
    }

    const where: any = { circleId };
    if (roleFilter) {
      where.role = roleFilter;
    }
    if (search) {
      where.user = { name: { contains: search, mode: "insensitive" } };
    }

    const [members, total] = await Promise.all([
      prisma.circleMembership.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              profile: {
                select: { avatarUrl: true, handicap: true },
              },
            },
          },
        },
        orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.circleMembership.count({ where }),
    ]);

    return NextResponse.json({
      members,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error("GET /api/circles/[id]/members error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
