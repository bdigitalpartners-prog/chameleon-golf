import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const tiers = await prisma.tierConfig.findMany({
      orderBy: { sortOrder: "asc" },
    });

    // Compute user distribution across tiers by summing earned tokens per user
    const userBalances = await prisma.eQTokenTransaction.groupBy({
      by: ["userId"],
      where: { type: "EARNED" },
      _sum: { amount: true },
    });

    const sortedTiers = [...tiers].sort((a, b) => b.threshold - a.threshold);
    const distribution: Record<string, number> = {};
    for (const tier of tiers) {
      distribution[tier.name] = 0;
    }
    distribution["Unranked"] = 0;

    for (const ub of userBalances) {
      const balance = ub._sum.amount || 0;
      let placed = false;
      for (const tier of sortedTiers) {
        if (balance >= tier.threshold) {
          distribution[tier.name] = (distribution[tier.name] || 0) + 1;
          placed = true;
          break;
        }
      }
      if (!placed) {
        distribution["Unranked"] = (distribution["Unranked"] || 0) + 1;
      }
    }

    const totalUsers = await prisma.user.count();
    const usersWithTokens = userBalances.length;

    return NextResponse.json({
      tiers,
      distribution,
      stats: {
        totalUsers,
        usersWithTokens,
        usersWithoutTokens: totalUsers - usersWithTokens,
      },
    });
  } catch (err) {
    console.error("Tiers API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch tier data" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { name, threshold, features, color, icon, sortOrder } = body;

    if (!name || threshold == null) {
      return NextResponse.json(
        { error: "name and threshold are required" },
        { status: 400 }
      );
    }

    const tier = await prisma.tierConfig.upsert({
      where: { name },
      update: { threshold, features, color, icon, sortOrder },
      create: { name, threshold, features: features || [], color, icon, sortOrder: sortOrder || 0 },
    });

    return NextResponse.json(tier, { status: 201 });
  } catch (err) {
    console.error("Tier create error:", err);
    return NextResponse.json(
      { error: "Failed to save tier config" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Tier id is required" },
        { status: 400 }
      );
    }

    const tier = await prisma.tierConfig.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json(tier);
  } catch (err) {
    console.error("Tier update error:", err);
    return NextResponse.json(
      { error: "Failed to update tier config" },
      { status: 500 }
    );
  }
}
