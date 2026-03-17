import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    // Ensure social link columns exist (safe migration)
    await prisma.$executeRawUnsafe(`ALTER TABLE users ADD COLUMN IF NOT EXISTS instagram_url VARCHAR(500)`);
    await prisma.$executeRawUnsafe(`ALTER TABLE users ADD COLUMN IF NOT EXISTS twitter_url VARCHAR(500)`);
    await prisma.$executeRawUnsafe(`ALTER TABLE users ADD COLUMN IF NOT EXISTS facebook_url VARCHAR(500)`);
    await prisma.$executeRawUnsafe(`ALTER TABLE users ADD COLUMN IF NOT EXISTS tiktok_url VARCHAR(500)`);
    await prisma.$executeRawUnsafe(`ALTER TABLE users ADD COLUMN IF NOT EXISTS website_url VARCHAR(500)`);


    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        ratings: {
          include: {
            course: { select: { courseId: true, courseName: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        scores: {
          include: {
            course: { select: { courseId: true, courseName: true } },
          },
          orderBy: { datePlayed: "desc" },
        },
        wishlists: {
          include: {
            course: { select: { courseId: true, courseName: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      ghinNumber: user.ghinNumber,
      handicapIndex: user.handicapIndex ? Number(user.handicapIndex) : null,
      homeState: user.homeState,
      ghinVerified: user.ghinVerified,
      ghinVerifiedAt: user.ghinVerifiedAt,
      isActive: user.isActive,
      createdAt: user.createdAt,
      instagramUrl: (user as any).instagramUrl || null,
      twitterUrl: (user as any).twitterUrl || null,
      facebookUrl: (user as any).facebookUrl || null,
      tiktokUrl: (user as any).tiktokUrl || null,
      websiteUrl: (user as any).websiteUrl || null,
      ratings: user.ratings.map((r) => ({
        ratingId: r.ratingId,
        courseId: r.courseId,
        courseName: r.course.courseName,
        overallRating: Number(r.overallRating),
        reviewTitle: r.reviewTitle,
        createdAt: r.createdAt,
      })),
      scores: user.scores.map((s) => ({
        scoreId: s.scoreId,
        courseId: s.courseId,
        courseName: s.course.courseName,
        totalScore: s.totalScore,
        datePlayed: s.datePlayed,
        verificationStatus: s.verificationStatus,
      })),
      wishlists: user.wishlists.map((w) => ({
        id: w.id,
        courseId: w.courseId,
        courseName: w.course.courseName,
        status: w.status,
        createdAt: w.createdAt,
      })),
    });
  } catch (err) {
    console.error("User detail error:", err);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { role, isActive, ghinVerified, instagramUrl, twitterUrl, facebookUrl, tiktokUrl, websiteUrl } = body;

    const data: any = {};
    if (role !== undefined) data.role = role;
    if (isActive !== undefined) data.isActive = isActive;
    if (ghinVerified !== undefined) {
      data.ghinVerified = ghinVerified;
      data.ghinVerifiedAt = ghinVerified ? new Date() : null;
    }
    if (instagramUrl !== undefined) data.instagramUrl = instagramUrl || null;
    if (twitterUrl !== undefined) data.twitterUrl = twitterUrl || null;
    if (facebookUrl !== undefined) data.facebookUrl = facebookUrl || null;
    if (tiktokUrl !== undefined) data.tiktokUrl = tiktokUrl || null;
    if (websiteUrl !== undefined) data.websiteUrl = websiteUrl || null;

    const updated = await prisma.user.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (err) {
    console.error("User update error:", err);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
