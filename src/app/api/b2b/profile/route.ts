import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const courseId = parseInt(req.nextUrl.searchParams.get("courseId") || "");
    if (isNaN(courseId)) {
      return NextResponse.json({ error: "courseId required" }, { status: 400 });
    }

    const profile = await prisma.b2bCourseProfile.findUnique({
      where: { courseId },
    });

    if (!profile) {
      return NextResponse.json({ profile: null });
    }

    return NextResponse.json({
      profile: {
        ...profile,
        featuredImages: profile.featuredImages ? JSON.parse(profile.featuredImages) : [],
        socialLinks: profile.socialLinks ? JSON.parse(profile.socialLinks) : {},
        amenities: profile.amenities ? JSON.parse(profile.amenities) : [],
        specialOffers: profile.specialOffers ? JSON.parse(profile.specialOffers) : [],
      },
    });
  } catch (error) {
    console.error("Failed to fetch B2B profile:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}
