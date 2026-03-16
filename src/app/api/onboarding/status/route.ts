import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    let progress = await prisma.onboardingProgress.findUnique({
      where: { userId },
    });

    if (!progress) {
      progress = await prisma.onboardingProgress.create({
        data: { userId },
      });
    }

    const completedSteps = [
      progress.profileComplete,
      progress.tagsSelected,
      progress.friendsAdded,
      progress.circleJoined,
      progress.coursesRated,
    ].filter(Boolean).length;

    return NextResponse.json({
      progress,
      completedSteps,
      totalSteps: 5,
      isComplete: progress.completedAt !== null,
    });
  } catch (error) {
    console.error("Failed to fetch onboarding status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
