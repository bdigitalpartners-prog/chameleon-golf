import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        handicapIndex: true,
        handicapVerified: true,
        ghinNumber: true,
      },
    });

    if (!profile) {
      return NextResponse.json({ verification: null, profile: null });
    }

    // Get the most recent verification
    const verification = await prisma.ghinVerification.findFirst({
      where: { userId: profile.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        ghinNumber: true,
        handicapIndex: true,
        status: true,
        reviewNote: true,
        createdAt: true,
        reviewedAt: true,
      },
    });

    return NextResponse.json({
      verification,
      profile: {
        handicapIndex: profile.handicapIndex,
        handicapVerified: profile.handicapVerified,
        ghinNumber: profile.ghinNumber,
      },
    });
  } catch (err) {
    console.error("GHIN status error:", err);
    return NextResponse.json(
      { error: "Failed to fetch verification status" },
      { status: 500 }
    );
  }
}
