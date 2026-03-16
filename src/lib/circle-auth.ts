import prisma from "./prisma";
import { MemberRole, CircleMembership, Circle } from "@prisma/client";

export async function withCircleAuth(
  circleId: string,
  userId: string,
  requiredRoles: MemberRole[]
): Promise<{
  authorized: boolean;
  membership?: CircleMembership;
  circle?: Circle;
  error?: string;
  status?: number;
}> {
  const circle = await prisma.circle.findUnique({
    where: { id: circleId },
  });

  if (!circle) {
    return { authorized: false, error: "Circle not found", status: 404 };
  }

  const membership = await prisma.circleMembership.findUnique({
    where: { circleId_userId: { circleId, userId } },
  });

  if (!membership) {
    return { authorized: false, circle, error: "Not a member of this circle", status: 403 };
  }

  if (!requiredRoles.includes(membership.role)) {
    return { authorized: false, circle, membership, error: "Insufficient permissions", status: 403 };
  }

  return { authorized: true, membership, circle };
}
