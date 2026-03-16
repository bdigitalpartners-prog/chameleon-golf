import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { withCircleAuth } from "@/lib/circle-auth";

export const dynamic = 'force-dynamic';

// GET — Admin: list pending verifications
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as any).id;
  const circleId = params.id;

  const auth = await withCircleAuth(circleId, userId, ["OWNER", "ADMIN"]);
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status }
    );
  }

  const verifications = await prisma.clubVerification.findMany({
    where: { circleId },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const pending = verifications.filter((v) => v.status === "PENDING");
  const approved = verifications.filter((v) => v.status === "APPROVED");
  const rejected = verifications.filter((v) => v.status === "REJECTED");

  return NextResponse.json({
    pending,
    approved,
    rejected,
    total: verifications.length,
    approvedCount: approved.length,
  });
}
