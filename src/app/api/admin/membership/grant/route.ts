import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const authError = await checkAdminAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { userId, tierSlug, durationMonths = 12, status = "active" } = body;

    if (!userId || !tierSlug) {
      return NextResponse.json({ error: "userId and tierSlug required" }, { status: 400 });
    }

    const tier = await prisma.membershipTier.findUnique({ where: { slug: tierSlug } });
    if (!tier) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    }

    // Cancel existing active memberships
    await prisma.userMembership.updateMany({
      where: { userId, status: { in: ["active", "trial"] } },
      data: { status: "cancelled" },
    });

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + durationMonths);

    const membership = await prisma.userMembership.create({
      data: {
        userId,
        tierId: tier.id,
        status,
        expiresAt,
        paymentProvider: "manual",
      },
      include: { tier: true },
    });

    return NextResponse.json({ success: true, membership });
  } catch (error) {
    console.error("Failed to grant membership:", error);
    return NextResponse.json({ error: "Failed to grant membership" }, { status: 500 });
  }
}
