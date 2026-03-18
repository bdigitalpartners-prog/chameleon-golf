import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authError = await checkAdminAuth(req);
  if (authError) return authError;

  try {
    const url = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(url.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(url.get("limit") || "25")));
    const action = url.get("action") || "";
    const adminEmail = url.get("adminEmail") || "";
    const userId = url.get("userId") || "";
    const search = url.get("search") || "";

    const where: any = {};
    if (action) where.action = action;
    if (adminEmail) where.adminEmail = { contains: adminEmail, mode: "insensitive" };
    if (userId) where.targetUserId = userId;
    if (search) {
      where.OR = [
        { adminEmail: { contains: search, mode: "insensitive" } },
        { action: { contains: search, mode: "insensitive" } },
        { details: { contains: search, mode: "insensitive" } },
        { reason: { contains: search, mode: "insensitive" } },
      ];
    }

    const total = await prisma.adminActivityLog.count({ where });

    const logs = await prisma.adminActivityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        targetUser: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({
      logs: logs.map((l) => ({
        id: l.id,
        targetUserId: l.targetUserId,
        targetUserName: l.targetUser.name,
        targetUserEmail: l.targetUser.email,
        adminEmail: l.adminEmail,
        action: l.action,
        details: l.details,
        previousValue: l.previousValue,
        newValue: l.newValue,
        reason: l.reason,
        createdAt: l.createdAt,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("Activity log error:", err);
    return NextResponse.json({ error: "Failed to fetch activity log" }, { status: 500 });
  }
}
