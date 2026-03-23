import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const courseId = parseInt(params.courseId);
    if (isNaN(courseId)) {
      return NextResponse.json({ error: "Invalid courseId" }, { status: 400 });
    }

    // Verify the user owns this profile
    const profile = await prisma.b2bCourseProfile.findUnique({ where: { courseId } });
    if (!profile || !profile.isClaimed) {
      return NextResponse.json({ error: "Profile not found or not claimed" }, { status: 404 });
    }

    const userEmail = session.user.email;
    if (profile.claimedBy !== userEmail) {
      return NextResponse.json({ error: "Not authorized to edit this profile" }, { status: 403 });
    }

    const body = await req.json();
    const {
      customDescription,
      featuredImages,
      bookingUrl,
      websiteUrl,
      phone,
      email,
      socialLinks,
      amenities,
      specialOffers,
    } = body;

    const updated = await prisma.b2bCourseProfile.update({
      where: { courseId },
      data: {
        ...(customDescription !== undefined && { customDescription }),
        ...(featuredImages !== undefined && { featuredImages: JSON.stringify(featuredImages) }),
        ...(bookingUrl !== undefined && { bookingUrl }),
        ...(websiteUrl !== undefined && { websiteUrl }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(socialLinks !== undefined && { socialLinks: JSON.stringify(socialLinks) }),
        ...(amenities !== undefined && { amenities: JSON.stringify(amenities) }),
        ...(specialOffers !== undefined && { specialOffers: JSON.stringify(specialOffers) }),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, profile: updated });
  } catch (error) {
    console.error("Failed to update B2B profile:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
