import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { id: circleId } = params;

    const membership = await prisma.circleMembership.findUnique({
      where: { circleId_userId: { circleId, userId } },
    });

    if (!membership) {
      return NextResponse.json({ error: "Not a member" }, { status: 400 });
    }

    if (membership.role === "OWNER") {
      return NextResponse.json(
        { error: "Owner cannot leave. Transfer ownership first." },
        { status: 400 }
      );
    }

    await prisma.circleMembership.delete({
      where: { circleId_userId: { circleId, userId } },
    });

    await prisma.circle.update({
      where: { id: circleId },
      data: { memberCount: { decrement: 1 } },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST /api/circles/[id]/leave error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
