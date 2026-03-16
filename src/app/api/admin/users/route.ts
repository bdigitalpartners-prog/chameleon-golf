import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const role = searchParams.get("role") || "";
  const ghinStatus = searchParams.get("ghinStatus") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "25", 10);

  try {
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }
    if (role) where.role = role;
    if (ghinStatus === "verified") where.ghinVerified = true;
    if (ghinStatus === "unverified") where.ghinVerified = false;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [users, total, totalActive, ghinVerified, usersThisMonth] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          ghinNumber: true,
          handicapIndex: true,
          ghinVerified: true,
          isActive: true,
          createdAt: true,
          _count: { select: { ratings: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.user.count({ where }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { ghinVerified: true } }),
      prisma.user.count({ where: { createdAt: { gte: monthStart } } }),
    ]);

    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        ghinNumber: u.ghinNumber,
        handicapIndex: u.handicapIndex ? Number(u.handicapIndex) : null,
        ghinVerified: u.ghinVerified,
        isActive: u.isActive,
        createdAt: u.createdAt,
        ratingsCount: u._count.ratings,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats: {
        totalUsers: total,
        activeUsers: totalActive,
        ghinVerified,
        usersThisMonth,
      },
    });
  } catch (err) {
    console.error("Users list error:", err);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  const { userId, role } = await request.json();
  if (!["user", "moderator", "admin"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role },
  });

  return NextResponse.json(updated);
}
