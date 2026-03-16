import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = 25;
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const model = searchParams.get("model");

  const where: any = {};
  if (from) where.createdAt = { ...(where.createdAt || {}), gte: new Date(from) };
  if (to) where.createdAt = { ...(where.createdAt || {}), lte: new Date(to + "T23:59:59") };
  if (model) where.model = model;

  try {
    const [conversations, total] = await Promise.all([
      prisma.conciergeUsage.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.conciergeUsage.count({ where }),
    ]);

    return NextResponse.json({
      conversations: conversations.map((c) => ({
        id: c.id,
        timestamp: c.createdAt,
        ip: c.userIp ? c.userIp.replace(/\.\d+$/, ".***") : "unknown",
        messagePreview: c.messagePreview,
        model: c.model,
        inputTokens: c.inputTokens,
        outputTokens: c.outputTokens,
        cost: Number(c.totalCost),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Conversations API error:", err);
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }
}
