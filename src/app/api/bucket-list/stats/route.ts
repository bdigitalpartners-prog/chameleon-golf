import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const [total, played, byStatus, byState, byPriority] = await Promise.all([
      prisma.bucketListItem.count({ where: { userId } }),
      prisma.bucketListItem.count({ where: { userId, status: "Played" } }),
      prisma.bucketListItem.groupBy({
        by: ["status"],
        where: { userId },
        _count: true,
      }),
      prisma.$queryRaw<{ state: string; count: bigint }[]>`
        SELECT c.state, COUNT(*)::bigint as count
        FROM bucket_list_items b
        JOIN courses c ON c.course_id = b.course_id
        WHERE b.user_id = ${userId} AND c.state IS NOT NULL
        GROUP BY c.state
        ORDER BY count DESC
      `,
      prisma.bucketListItem.groupBy({
        by: ["priority"],
        where: { userId },
        _count: true,
      }),
    ]);

    return NextResponse.json({
      total,
      played,
      percentComplete: total > 0 ? Math.round((played / total) * 100) : 0,
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
      byState: byState.map((s) => ({ state: s.state, count: Number(s.count) })),
      byPriority: byPriority.map((p) => ({ priority: p.priority, count: p._count })),
    });
  } catch (error) {
    console.error("[BucketList Stats]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
