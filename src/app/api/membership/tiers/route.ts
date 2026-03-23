import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tiers = await prisma.membershipTier.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    const parsed = tiers.map((t) => ({
      ...t,
      features: JSON.parse(t.features),
    }));

    return NextResponse.json({ tiers: parsed });
  } catch (error) {
    console.error("Failed to fetch tiers:", error);
    return NextResponse.json({ error: "Failed to fetch tiers" }, { status: 500 });
  }
}
