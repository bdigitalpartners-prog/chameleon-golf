import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [members, totalCount, phaseStats, nextMemberNumber] =
      await Promise.all([
        prisma.foundersMembership.findMany({
          where,
          include: {
            user: { select: { id: true, name: true, email: true, image: true } },
          },
          orderBy: { memberNumber: "asc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.foundersMembership.count({ where }),
        prisma.foundersInvite.groupBy({
          by: ["phase"],
          _count: { id: true },
        }),
        prisma.foundersMembership.aggregate({
          _max: { memberNumber: true },
        }),
      ]);

    const usedInvites = await prisma.foundersInvite.count({
      where: { usedBy: { not: null } },
    });
    const totalInvites = await prisma.foundersInvite.count();

    return NextResponse.json({
      members,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
      stats: {
        totalMembers: totalCount,
        maxCapacity: 200,
        spotsRemaining: 200 - totalCount,
        nextMemberNumber: (nextMemberNumber._max.memberNumber || 0) + 1,
        invitesGenerated: totalInvites,
        invitesUsed: usedInvites,
        invitesByPhase: phaseStats.map((p) => ({
          phase: p.phase,
          count: p._count.id,
        })),
      },
    });
  } catch (err) {
    console.error("Founders API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch founders data" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const existingCount = await prisma.foundersMembership.count();
    if (existingCount >= 200) {
      return NextResponse.json(
        { error: "Founders program is at capacity (200 members)" },
        { status: 409 }
      );
    }

    const maxNumber = await prisma.foundersMembership.aggregate({
      _max: { memberNumber: true },
    });

    const membership = await prisma.foundersMembership.create({
      data: {
        userId,
        memberNumber: (maxNumber._max.memberNumber || 0) + 1,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(membership, { status: 201 });
  } catch (err) {
    console.error("Founders create error:", err);
    return NextResponse.json(
      { error: "Failed to add founder member" },
      { status: 500 }
    );
  }
}
