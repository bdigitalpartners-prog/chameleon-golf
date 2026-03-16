import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";
import crypto from "crypto";

export const dynamic = "force-dynamic";

function generateInviteCode(phase: string): string {
  const prefix =
    phase === "GROUND_ZERO" ? "GZ" : phase === "CHARTER_CLASS" ? "CC" : "LC";
  const random = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `${prefix}-${random}`;
}

export async function GET(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const phase = searchParams.get("phase");
    const used = searchParams.get("used");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: Record<string, unknown> = {};
    if (phase) where.phase = phase;
    if (used === "true") where.usedBy = { not: null };
    if (used === "false") where.usedBy = null;

    const [invites, totalCount] = await Promise.all([
      prisma.foundersInvite.findMany({
        where,
        include: {
          creator: { select: { id: true, name: true, email: true } },
          usedByUser: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.foundersInvite.count({ where }),
    ]);

    return NextResponse.json({
      invites,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (err) {
    console.error("Founders invites GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch invite codes" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { createdBy, phase, count = 1, expiresAt } = body;

    if (!createdBy || !phase) {
      return NextResponse.json(
        { error: "createdBy and phase are required" },
        { status: 400 }
      );
    }

    if (!["GROUND_ZERO", "CHARTER_CLASS", "LAST_CALL"].includes(phase)) {
      return NextResponse.json(
        { error: "Invalid phase. Must be GROUND_ZERO, CHARTER_CLASS, or LAST_CALL" },
        { status: 400 }
      );
    }

    const batchSize = Math.min(count, 50);
    const invites = await prisma.$transaction(
      Array.from({ length: batchSize }, () =>
        prisma.foundersInvite.create({
          data: {
            code: generateInviteCode(phase),
            createdBy,
            phase,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
          },
        })
      )
    );

    return NextResponse.json({ invites, count: invites.length }, { status: 201 });
  } catch (err) {
    console.error("Founders invites POST error:", err);
    return NextResponse.json(
      { error: "Failed to generate invite codes" },
      { status: 500 }
    );
  }
}
