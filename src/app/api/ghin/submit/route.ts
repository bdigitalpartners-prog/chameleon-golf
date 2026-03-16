import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

const MAX_SCREENSHOT_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const body = await request.json();
    const { ghinNumber, handicapIndex, screenshotUrl } = body;

    // Validate GHIN number (7 digits)
    if (!ghinNumber || !/^\d{7}$/.test(ghinNumber.trim())) {
      return NextResponse.json(
        { error: "GHIN number must be exactly 7 digits" },
        { status: 400 }
      );
    }

    // Validate handicap index
    const parsedHandicap = parseFloat(handicapIndex);
    if (isNaN(parsedHandicap) || parsedHandicap < -10 || parsedHandicap > 54) {
      return NextResponse.json(
        { error: "Handicap index must be between -10 and 54" },
        { status: 400 }
      );
    }

    // Validate screenshot (base64 data URL)
    if (!screenshotUrl || !screenshotUrl.startsWith("data:image/")) {
      return NextResponse.json(
        { error: "Screenshot is required and must be an image" },
        { status: 400 }
      );
    }

    // Check approximate size of base64 data
    if (screenshotUrl.length > MAX_SCREENSHOT_SIZE * 1.37) {
      return NextResponse.json(
        { error: "Screenshot must be under 5MB" },
        { status: 400 }
      );
    }

    // Ensure user has a profile
    const profile = await prisma.userProfile.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    // Check for existing pending verification
    const existing = await prisma.ghinVerification.findFirst({
      where: { userId: profile.id, status: "pending" },
    });

    if (existing) {
      return NextResponse.json(
        { error: "You already have a pending verification request" },
        { status: 409 }
      );
    }

    // Create verification request
    const verification = await prisma.ghinVerification.create({
      data: {
        userId: profile.id,
        ghinNumber: ghinNumber.trim(),
        handicapIndex: parsedHandicap,
        screenshotUrl,
        status: "pending",
      },
    });

    return NextResponse.json({
      id: verification.id,
      status: verification.status,
      createdAt: verification.createdAt,
    });
  } catch (err) {
    console.error("GHIN submit error:", err);
    return NextResponse.json(
      { error: "Failed to submit verification" },
      { status: 500 }
    );
  }
}
