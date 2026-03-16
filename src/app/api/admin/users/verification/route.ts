import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "pending";

  try {
    const items = await prisma.adminVerificationQueue.findMany({
      where: { status },
      orderBy: { submittedAt: "desc" },
    });

    // Manually fetch user and course info since AdminVerificationQueue has no Prisma relations
    const userIds = [...new Set(items.map((i) => i.userId))];
    const courseIds = [...new Set(items.map((i) => i.courseId))];

    const [users, courses] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true },
      }),
      prisma.course.findMany({
        where: { courseId: { in: courseIds } },
        select: { courseId: true, courseName: true },
      }),
    ]);

    const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
    const courseMap = Object.fromEntries(courses.map((c) => [c.courseId, c]));

    return NextResponse.json({
      items: items.map((i) => ({
        queueId: i.queueId,
        scoreId: i.scoreId,
        userId: i.userId,
        userName: userMap[i.userId]?.name || "Unknown",
        userEmail: userMap[i.userId]?.email || "",
        courseId: i.courseId,
        courseName: courseMap[i.courseId]?.courseName || "Unknown",
        ghinNumber: i.ghinNumber,
        screenshotUrl: i.screenshotUrl,
        status: i.status,
        submittedAt: i.submittedAt,
        reviewedAt: i.reviewedAt,
        reviewNotes: i.reviewNotes,
      })),
    });
  } catch (err) {
    console.error("Verification queue error:", err);
    return NextResponse.json({ error: "Failed to fetch verification queue" }, { status: 500 });
  }
}
