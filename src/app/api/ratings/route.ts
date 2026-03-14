import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id;
    const body = await req.json();
    const {
      courseId, overallRating, conditioning, layoutDesign, paceOfPlay,
      aesthetics, challenge, value, amenities, walkability, service,
      reviewTitle, reviewText, datePlayed
    } = body;

    // Check for existing published rating
    const existing = await prisma.userCourseRating.findFirst({
      where: { userId, courseId: parseInt(courseId), isPublished: true },
    });

    if (existing) {
      // Archive old rating to history
      await prisma.ratingHistory.create({
        data: {
          ratingId: existing.ratingId,
          userId,
          courseId: parseInt(courseId),
          overallRating: existing.overallRating,
          conditioning: existing.conditioning,
          layoutDesign: existing.layoutDesign,
          paceOfPlay: existing.paceOfPlay,
          aesthetics: existing.aesthetics,
          challenge: existing.challenge,
          value: existing.value,
          amenities: existing.amenities,
          walkability: existing.walkability,
          service: existing.service,
          reviewText: existing.reviewText,
          handicapAtRating: existing.handicapAtRating,
          datePlayed: existing.datePlayed,
        },
      });

      // Update existing rating
      const updated = await prisma.userCourseRating.update({
        where: { ratingId: existing.ratingId },
        data: {
          overallRating: parseFloat(overallRating),
          conditioning: conditioning ? parseFloat(conditioning) : null,
          layoutDesign: layoutDesign ? parseFloat(layoutDesign) : null,
          paceOfPlay: paceOfPlay ? parseFloat(paceOfPlay) : null,
          aesthetics: aesthetics ? parseFloat(aesthetics) : null,
          challenge: challenge ? parseFloat(challenge) : null,
          value: value ? parseFloat(value) : null,
          amenities: amenities ? parseFloat(amenities) : null,
          walkability: walkability ? parseFloat(walkability) : null,
          service: service ? parseFloat(service) : null,
          reviewTitle: reviewTitle || null,
          reviewText: reviewText || null,
          datePlayed: datePlayed ? new Date(datePlayed) : null,
          timesRated: existing.timesRated + 1,
          previousRatingId: existing.ratingId,
          updatedAt: new Date(),
        },
      });
      return NextResponse.json(updated);
    }

    // Create new rating
    const rating = await prisma.userCourseRating.create({
      data: {
        userId,
        courseId: parseInt(courseId),
        overallRating: parseFloat(overallRating),
        conditioning: conditioning ? parseFloat(conditioning) : null,
        layoutDesign: layoutDesign ? parseFloat(layoutDesign) : null,
        paceOfPlay: paceOfPlay ? parseFloat(paceOfPlay) : null,
        aesthetics: aesthetics ? parseFloat(aesthetics) : null,
        challenge: challenge ? parseFloat(challenge) : null,
        value: value ? parseFloat(value) : null,
        amenities: amenities ? parseFloat(amenities) : null,
        walkability: walkability ? parseFloat(walkability) : null,
        service: service ? parseFloat(service) : null,
        reviewTitle: reviewTitle || null,
        reviewText: reviewText || null,
        datePlayed: datePlayed ? new Date(datePlayed) : null,
      },
    });

    return NextResponse.json(rating, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/ratings error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
