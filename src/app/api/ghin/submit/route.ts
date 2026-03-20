import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    if (!userId) {
      return NextResponse.json({ error: "User ID not found" }, { status: 400 });
    }

    const { ghinNumber, handicapIndex, screenshotUrl } = await req.json();

    if (!ghinNumber || typeof ghinNumber !== "string" || !/^\d{7,8}$/.test(ghinNumber.trim())) {
      return NextResponse.json({ error: "GHIN number must be 7 or 8 digits" }, { status: 400 });
    }

    // Check if user already has a pending or approved verification
    const existing = await prisma.adminVerificationQueue.findFirst({
      where: {
        userId,
        status: { in: ["pending", "approved"] },
      },
    });

    if (existing) {
      return NextResponse.json({
        error: existing.status === "approved"
          ? "Your GHIN is already verified"
          : "You already have a pending verification request",
      }, { status: 409 });
    }

    // Update user's GHIN number and handicap index
    await prisma.user.update({
      where: { id: userId },
      data: {
        ghinNumber: ghinNumber.trim(),
        ...(handicapIndex != null && !isNaN(Number(handicapIndex))
          ? { handicapIndex: Number(handicapIndex) }
          : {}),
      },
    });

    // Create verification queue entry
    const queueEntry = await prisma.adminVerificationQueue.create({
      data: {
        userId,
        scoreId: 0,
        courseId: 0,
        screenshotUrl: screenshotUrl || null,
        ghinNumber: ghinNumber.trim(),
        status: "pending",
      },
    });

    return NextResponse.json({
      success: true,
      queueId: queueEntry.queueId,
      message: "Verification request submitted. An admin will review it shortly.",
    });
  } catch (error: any) {
    console.error("POST /api/ghin/submit error:", error?.message || error, JSON.stringify(error?.meta || {}));
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  const verification = await prisma.adminVerificationQueue.findFirst({
    where: { userId },
    orderBy: { submittedAt: "desc" },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      ghinNumber: true,
      ghinVerified: true,
      ghinVerifiedAt: true,
    },
  });

  return NextResponse.json({
    ghinNumber: user?.ghinNumber,
    ghinVerified: user?.ghinVerified ?? false,
    ghinVerifiedAt: user?.ghinVerifiedAt,
    latestSubmission: verification
      ? {
          status: verification.status,
          submittedAt: verification.submittedAt,
          reviewNotes: verification.reviewNotes,
        }
      : null,
  });
}
