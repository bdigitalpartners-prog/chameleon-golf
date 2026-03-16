import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { withCircleAuth } from "@/lib/circle-auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;
    const { id: circleId } = params;

    const auth = await withCircleAuth(circleId, userId, ["OWNER", "ADMIN", "MEMBER"]);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Get wishlisted courses with member counts
    const wishlists = await prisma.wishlist.findMany({
      where: { circleId },
      include: {
        user: { select: { id: true, name: true, image: true } },
        course: {
          select: {
            courseId: true,
            courseName: true,
            city: true,
            state: true,
            media: { where: { isPrimary: true }, take: 1 },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Group by course and count members
    const courseMap = new Map<number, { course: any; members: any[]; count: number }>();
    for (const w of wishlists) {
      const existing = courseMap.get(w.courseId);
      if (existing) {
        existing.members.push(w.user);
        existing.count++;
      } else {
        courseMap.set(w.courseId, {
          course: w.course,
          members: [w.user],
          count: 1,
        });
      }
    }

    // Sort by count descending
    const grouped = Array.from(courseMap.values()).sort((a, b) => b.count - a.count);

    return NextResponse.json({ wishlists: grouped });
  } catch (error: any) {
    console.error("GET /api/circles/[id]/wishlists error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
