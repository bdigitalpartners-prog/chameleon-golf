import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/admin/looper-guild/caddies — all caddies (including PENDING)
export async function GET(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = 50;

    const where: any = {};
    if (status) where.status = status;

    const [caddies, total] = await Promise.all([
      prisma.caddy.findMany({
        where,
        include: {
          courses: {
            include: {
              course: { select: { courseId: true, courseName: true } },
            },
          },
          ratings: { select: { rating: true } },
        },
        orderBy: { appliedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.caddy.count({ where }),
    ]);

    const result = caddies.map((c) => ({
      ...c,
      avgRating:
        c.ratings.length > 0
          ? c.ratings.reduce((sum, r) => sum + r.rating, 0) / c.ratings.length
          : null,
      totalRatings: c.ratings.length,
    }));

    return NextResponse.json({
      data: result,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error("GET /api/admin/looper-guild/caddies error:", error);
    return NextResponse.json({ error: "Failed to fetch caddies" }, { status: 500 });
  }
}

// PATCH /api/admin/looper-guild/caddies — approve/reject/suspend caddy
export async function PATCH(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "id and status are required" }, { status: 400 });
    }

    if (!["APPROVED", "REJECTED", "SUSPENDED", "PENDING"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const data: any = { status };
    if (status === "APPROVED") {
      data.approvedAt = new Date();
    }

    const caddy = await prisma.caddy.update({
      where: { id },
      data,
    });

    return NextResponse.json(caddy);
  } catch (error: any) {
    console.error("PATCH /api/admin/looper-guild/caddies error:", error);
    return NextResponse.json({ error: "Failed to update caddy" }, { status: 500 });
  }
}
