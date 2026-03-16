import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;
    const body = await request.json();
    const { name, handicapIndex, homeClub, location } = body;

    // Update user name if provided
    if (name) {
      await prisma.user.update({
        where: { id: userId },
        data: { name },
      });
    }

    // Update handicap on user model if provided
    if (handicapIndex !== undefined) {
      await prisma.user.update({
        where: { id: userId },
        data: { handicapIndex },
      });
    }

    // Update profile
    const profile = await prisma.userProfile.upsert({
      where: { userId },
      update: {
        ...(homeClub !== undefined && { homeClub }),
        ...(location !== undefined && { location }),
      },
      create: {
        userId,
        homeClub: homeClub ?? null,
        location: location ?? null,
      },
    });

    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error("Failed to update profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
