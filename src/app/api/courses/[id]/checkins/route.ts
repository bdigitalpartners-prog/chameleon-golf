import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;
    const courseId = Number(params.id);

    if (isNaN(courseId)) {
      return NextResponse.json({ error: "Invalid courseId" }, { status: 400 });
    }

    // Get user's circle IDs
    const memberships = await prisma.circleMembership.findMany({
      where: {
        userId,
        role: { in: ["OWNER", "ADMIN", "MEMBER"] },
      },
      select: { circleId: true },
    });

    const circleIds = memberships.map((m) => m.circleId);

    // Get check-ins from users in user's circles for this course
    const checkins = await prisma.courseCheckIn.findMany({
      where: {
        courseId,
        circleId: { in: circleIds },
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
        circle: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ checkins });
  } catch (error: any) {
    console.error("GET /api/courses/[id]/checkins error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
