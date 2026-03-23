import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();
    const { tierSlug } = body;

    if (!tierSlug) {
      return NextResponse.json({ error: "tierSlug is required" }, { status: 400 });
    }

    const tier = await prisma.membershipTier.findUnique({
      where: { slug: tierSlug },
    });

    if (!tier || !tier.isActive) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    }

    // Cancel any existing active memberships
    await prisma.userMembership.updateMany({
      where: { userId, status: { in: ["active", "trial"] } },
      data: { status: "cancelled" },
    });

    // Create new membership (placeholder — Stripe integration later)
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const membership = await prisma.userMembership.create({
      data: {
        userId,
        tierId: tier.id,
        status: "trial",
        expiresAt,
        paymentProvider: "free",
      },
      include: { tier: true },
    });

    return NextResponse.json({
      success: true,
      membership: {
        ...membership,
        tier: { ...membership.tier, features: JSON.parse(membership.tier.features) },
      },
    });
  } catch (error) {
    console.error("Failed to subscribe:", error);
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}
