import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const authError = await checkAdminAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { courseId, approved, profileTier = "basic" } = body;

    if (!courseId) {
      return NextResponse.json({ error: "courseId required" }, { status: 400 });
    }

    const profile = await prisma.b2bCourseProfile.findUnique({
      where: { courseId: parseInt(courseId) },
    });

    if (!profile) {
      return NextResponse.json({ error: "No claim request found" }, { status: 404 });
    }

    if (approved) {
      const updated = await prisma.b2bCourseProfile.update({
        where: { courseId: parseInt(courseId) },
        data: {
          isClaimed: true,
          profileTier,
          analyticsEnabled: profileTier !== "basic",
          updatedAt: new Date(),
        },
      });
      return NextResponse.json({ success: true, profile: updated });
    } else {
      // Reject — reset claim
      await prisma.b2bCourseProfile.update({
        where: { courseId: parseInt(courseId) },
        data: {
          claimedBy: null,
          businessName: null,
          updatedAt: new Date(),
        },
      });
      return NextResponse.json({ success: true, message: "Claim rejected" });
    }
  } catch (error) {
    console.error("Failed to approve claim:", error);
    return NextResponse.json({ error: "Failed to process claim" }, { status: 500 });
  }
}
