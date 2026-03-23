import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ tier: "free", membership: null });
    }

    const userId = (session.user as any).id;

    const membership = await prisma.userMembership.findFirst({
      where: {
        userId,
        status: { in: ["active", "trial"] },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      include: { tier: true },
      orderBy: { tier: { sortOrder: "desc" } },
    });

    if (!membership) {
      return NextResponse.json({ tier: "free", membership: null });
    }

    return NextResponse.json({
      tier: membership.tier.slug,
      membership: {
        id: membership.id,
        status: membership.status,
        startedAt: membership.startedAt,
        expiresAt: membership.expiresAt,
        tier: {
          ...membership.tier,
          features: JSON.parse(membership.tier.features),
        },
      },
    });
  } catch (error) {
    console.error("Failed to fetch membership:", error);
    return NextResponse.json({ error: "Failed to fetch membership" }, { status: 500 });
  }
}
