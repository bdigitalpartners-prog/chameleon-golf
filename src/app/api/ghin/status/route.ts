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
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        ghinNumber: true,
        handicapIndex: true,
        ghinVerified: true,
      },
    });

    if (!user) {
      return NextResponse.json({ verification: null, profile: null });
    }

    // Get the most recent verification queue entry for this user
    const queueEntry = await prisma.adminVerificationQueue.findFirst({
      where: { userId },
      orderBy: { submittedAt: "desc" },
      select: {
        queueId: true,
        ghinNumber: true,
        status: true,
        reviewNotes: true,
        submittedAt: true,
        reviewedAt: true,
      },
    });

    // Map AdminVerificationQueue fields to the shape the frontend expects
    const verification = queueEntry
      ? {
          id: String(queueEntry.queueId),
          ghinNumber: queueEntry.ghinNumber ?? "",
          handicapIndex: user.handicapIndex ? Number(user.handicapIndex) : null,
          status: queueEntry.status,
          reviewNote: queueEntry.reviewNotes ?? null,
          createdAt: queueEntry.submittedAt.toISOString(),
          reviewedAt: queueEntry.reviewedAt?.toISOString() ?? null,
        }
      : null;

    return NextResponse.json({
      verification,
      profile: {
        handicapIndex: user.handicapIndex ? Number(user.handicapIndex) : null,
        handicapVerified: user.ghinVerified,
        ghinNumber: user.ghinNumber ?? null,
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
