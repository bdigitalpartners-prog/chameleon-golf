import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

const VALID_STEPS = ["profileComplete", "tagsSelected", "friendsAdded", "circleJoined", "coursesRated"] as const;

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;
    const body = await request.json();
    const { step } = body;

    if (!step || !VALID_STEPS.includes(step)) {
      return NextResponse.json({ error: "Invalid step" }, { status: 400 });
    }

    const progress = await prisma.onboardingProgress.upsert({
      where: { userId },
      create: { userId, [step]: true },
      update: { [step]: true },
    });

    // Check if all steps are complete
    const allComplete =
      progress.profileComplete &&
      progress.tagsSelected &&
      progress.friendsAdded &&
      progress.circleJoined &&
      progress.coursesRated;

    if (allComplete && !progress.completedAt) {
      await prisma.onboardingProgress.update({
        where: { userId },
        data: { completedAt: new Date() },
      });
    }

    return NextResponse.json({ progress, allComplete });
  } catch (error) {
    console.error("Failed to update onboarding step:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
