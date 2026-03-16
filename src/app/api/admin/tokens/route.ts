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
    const userId = searchParams.get("userId");
    const type = searchParams.get("type");
    const source = searchParams.get("source");

    const where: Record<string, unknown> = {};
    if (userId) where.userId = userId;
    if (type) where.type = type;
    if (source) where.source = source;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      transactions,
      totalCount,
      totalEarned,
      totalSpent,
      totalExpired,
      earningRate30d,
      spendingRate30d,
      earningRate7d,
      topEarners,
      sourceBreakdown,
    ] = await Promise.all([
      prisma.eQTokenTransaction.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.eQTokenTransaction.count({ where }),
      prisma.eQTokenTransaction.aggregate({
        where: { type: "EARNED" },
        _sum: { amount: true },
      }),
      prisma.eQTokenTransaction.aggregate({
        where: { type: "SPENT" },
        _sum: { amount: true },
      }),
      prisma.eQTokenTransaction.aggregate({
        where: { type: "EXPIRED" },
        _sum: { amount: true },
      }),
      prisma.eQTokenTransaction.aggregate({
        where: { type: "EARNED", createdAt: { gte: thirtyDaysAgo } },
        _sum: { amount: true },
      }),
      prisma.eQTokenTransaction.aggregate({
        where: { type: "SPENT", createdAt: { gte: thirtyDaysAgo } },
        _sum: { amount: true },
      }),
      prisma.eQTokenTransaction.aggregate({
        where: { type: "EARNED", createdAt: { gte: sevenDaysAgo } },
        _sum: { amount: true },
      }),
      prisma.eQTokenTransaction.groupBy({
        by: ["userId"],
        where: { type: "EARNED" },
        _sum: { amount: true },
        orderBy: { _sum: { amount: "desc" } },
        take: 10,
      }),
      prisma.eQTokenTransaction.groupBy({
        by: ["source"],
        where: { type: "EARNED" },
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    const totalInCirculation =
      (totalEarned._sum.amount || 0) -
      (totalSpent._sum.amount || 0) -
      (totalExpired._sum.amount || 0);

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
      stats: {
        totalInCirculation,
        totalEarned: totalEarned._sum.amount || 0,
        totalSpent: totalSpent._sum.amount || 0,
        totalExpired: totalExpired._sum.amount || 0,
        earningRate30d: earningRate30d._sum.amount || 0,
        spendingRate30d: spendingRate30d._sum.amount || 0,
        earningRate7d: earningRate7d._sum.amount || 0,
      },
      topEarners,
      sourceBreakdown: sourceBreakdown.map((s) => ({
        source: s.source,
        totalAmount: s._sum.amount || 0,
        count: s._count.id,
      })),
    });
  } catch (err) {
    console.error("Tokens API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch token data" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { userId, amount, type, source, description } = body;

    if (!userId || !amount || !type || !source) {
      return NextResponse.json(
        { error: "userId, amount, type, and source are required" },
        { status: 400 }
      );
    }

    const transaction = await prisma.eQTokenTransaction.create({
      data: { userId, amount, type, source, description },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (err) {
    console.error("Token create error:", err);
    return NextResponse.json(
      { error: "Failed to create token transaction" },
      { status: 500 }
    );
  }
}
