import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const courseId = parseInt(req.nextUrl.searchParams.get("courseId") || "");
    if (isNaN(courseId)) {
      return NextResponse.json({ error: "courseId required" }, { status: 400 });
    }

    const profile = await prisma.b2bCourseProfile.findUnique({ where: { courseId } });
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Verify ownership
    const userEmail = session.user.email;
    if (profile.claimedBy !== userEmail) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    if (!profile.analyticsEnabled) {
      return NextResponse.json({
        error: "Analytics requires Enhanced or Premium tier",
        requiredTier: "enhanced",
      }, { status: 403 });
    }

    return NextResponse.json({
      analytics: {
        monthlyViews: profile.monthlyViews,
        monthlyClicks: profile.monthlyClicks,
        profileTier: profile.profileTier,
        // Placeholder analytics data
        viewsTrend: Array.from({ length: 12 }, (_, i) => ({
          month: new Date(2026, i).toLocaleString("default", { month: "short" }),
          views: Math.floor(Math.random() * 500) + 100,
          clicks: Math.floor(Math.random() * 50) + 10,
        })),
      },
    });
  } catch (error) {
    console.error("Failed to fetch analytics:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
