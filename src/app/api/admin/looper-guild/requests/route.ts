import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/admin/looper-guild/requests — all requests
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

    const [requests, total] = await Promise.all([
      prisma.caddyRequest.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          course: { select: { courseId: true, courseName: true } },
          caddies: {
            include: {
              caddy: { select: { id: true, firstName: true, lastName: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.caddyRequest.count({ where }),
    ]);

    return NextResponse.json({
      data: requests,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error("GET /api/admin/looper-guild/requests error:", error);
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
  }
}

// PATCH /api/admin/looper-guild/requests — fulfill/cancel request
export async function PATCH(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "id and status are required" }, { status: 400 });
    }

    if (!["FULFILLED", "CANCELLED", "PENDING"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updated = await prisma.caddyRequest.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PATCH /api/admin/looper-guild/requests error:", error);
    return NextResponse.json({ error: "Failed to update request" }, { status: 500 });
  }
}
