import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authErr = await checkAdminAuth(request);
  if (authErr) return authErr;

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 25;
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const model = searchParams.get("model");

  const where: Record<string, unknown> = {};
  if (from || to) {
    where.createdAt = {};
    if (from) (where.createdAt as Record<string, unknown>).gte = new Date(from);
    if (to) (where.createdAt as Record<string, unknown>).lte = new Date(to + "T23:59:59");
  }
  if (model) {
    where.model = model;
  }

  try {
    const [total, conversations] = await Promise.all([
      prisma.conciergeUsage.count({ where }),
      prisma.conciergeUsage.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      conversations: conversations.map((c) => ({
        id: c.id,
        createdAt: c.createdAt,
        userIp: c.userIp
          ? c.userIp.replace(/\.\d+$/, ".***")
          : "unknown",
        messagePreview: c.messagePreview,
        model: c.model,
        inputTokens: c.inputTokens,
        outputTokens: c.outputTokens,
        totalCost: Number(c.totalCost),
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
