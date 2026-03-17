import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

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
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);

    const circle = await prisma.circle.findUnique({ where: { id: circleId } });
    if (!circle) {
      return NextResponse.json({ error: "Circle not found" }, { status: 404 });
    }

    // Membership check: only members can list members (prevents leaking SECRET circle data)
    const userId = (session.user as any).id;
    const requesterMembership = await prisma.circleMembership.findUnique({
      where: { circleId_userId: { circleId, userId } },
    });
    if (!requesterMembership) {
      return NextResponse.json({ error: "Not a member of this circle" }, { status: 403 });
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

    // For CLUB circles, include verification status for each member
    let membersWithVerification = members as any[];
    if (circle.type === "CLUB") {
      const userIds = members.map((m) => m.userId);
      const verifications = await prisma.clubVerification.findMany({
        where: { circleId, userId: { in: userIds }, status: "APPROVED" },
        select: { userId: true },
      });
      const verifiedSet = new Set(verifications.map((v) => v.userId));
      membersWithVerification = members.map((m) => ({
        ...m,
        isVerified: verifiedSet.has(m.userId),
      }));
    }

    return NextResponse.json({
      members: membersWithVerification,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      userRole: requesterMembership.role,
    });
  } catch (error: any) {
    console.error("GET /api/circles/[id]/members error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
