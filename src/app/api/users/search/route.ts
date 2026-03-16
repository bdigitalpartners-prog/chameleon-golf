import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 1) {
    return NextResponse.json({ users: [] });
  }

  // Get user's circle memberships
  const myCircles = await prisma.circleMembership.findMany({
    where: { userId, role: { in: ["OWNER", "ADMIN", "MEMBER"] } },
    select: { circleId: true },
  });
  const circleIds = myCircles.map((m) => m.circleId);

  if (circleIds.length === 0) {
    return NextResponse.json({ users: [] });
  }

  // Find users who share at least one circle
  const fellowMembers = await prisma.circleMembership.findMany({
    where: {
      circleId: { in: circleIds },
      userId: { not: userId },
      role: { in: ["OWNER", "ADMIN", "MEMBER"] },
    },
    select: { userId: true },
    distinct: ["userId"],
  });
  const fellowUserIds = fellowMembers.map((m) => m.userId);

  if (fellowUserIds.length === 0) {
    return NextResponse.json({ users: [] });
  }

  const users = await prisma.user.findMany({
    where: {
      id: { in: fellowUserIds },
      name: { contains: q, mode: "insensitive" },
    },
    select: {
      id: true,
      name: true,
      image: true,
    },
    take: 5,
  });

  return NextResponse.json({ users });
}
