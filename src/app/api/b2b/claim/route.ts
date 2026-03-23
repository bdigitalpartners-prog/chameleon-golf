import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { courseId, contactEmail, businessName, proofOfOwnership } = body;

    if (!courseId || !contactEmail || !businessName) {
      return NextResponse.json(
        { error: "courseId, contactEmail, and businessName are required" },
        { status: 400 }
      );
    }

    // Check course exists
    const course = await prisma.course.findUnique({ where: { courseId: parseInt(courseId) } });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Check if profile already claimed
    const existing = await prisma.b2bCourseProfile.findUnique({
      where: { courseId: parseInt(courseId) },
    });

    if (existing?.isClaimed) {
      return NextResponse.json({ error: "This course has already been claimed" }, { status: 409 });
    }

    // Create or update profile with claim request (pending admin approval)
    const profile = await prisma.b2bCourseProfile.upsert({
      where: { courseId: parseInt(courseId) },
      create: {
        courseId: parseInt(courseId),
        isClaimed: false, // Pending admin approval
        claimedBy: contactEmail,
        businessName,
        profileTier: "basic",
      },
      update: {
        claimedBy: contactEmail,
        businessName,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Claim request submitted. Our team will review and approve within 48 hours.",
      profile,
    });
  } catch (error) {
    console.error("Failed to claim course:", error);
    return NextResponse.json({ error: "Failed to submit claim" }, { status: 500 });
  }
}
