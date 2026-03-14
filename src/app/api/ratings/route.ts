import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const body = await req.json();
  const { courseId, overallRating, conditionRating, designRating, ambienceRating, difficultyRating, valueRating, reviewText } = body;

  // Check for existing rating
  const existing = await prisma.userCourseRating.findFirst({
    where: { userId, courseId: parseInt(courseId), isActive: true },
  });

  if (existing) {
    // Archive old rating
    await prisma.ratingHistory.create({
      data: {
        ratingId: existing.ratingId,
        userId,
        courseId: parseInt(courseId),
        overallRating: existing.overallRating,
        reason: "re-rating",
      },
    });

    // Update existing
    const updated = await prisma.userCourseRating.update({
      where: { ratingId: existing.ratingId },
      data: {
        overallRating: parseFloat(overallRating),
        conditionRating: conditionRating ? parseFloat(conditionRating) : null,
        designRating: designRating ? parseFloat(designRating) : null,
        ambienceRating: ambienceRating ? parseFloat(ambienceRating) : null,
        difficultyRating: difficultyRating ? parseFloat(difficultyRating) : null,
        valueRating: valueRating ? parseFloat(valueRating) : null,
        reviewText: reviewText || null,
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
      conditionRating: conditionRating ? parseFloat(conditionRating) : null,
      designRating: designRating ? parseFloat(designRating) : null,
      ambienceRating: ambienceRating ? parseFloat(ambienceRating) : null,
      difficultyRating: difficultyRating ? parseFloat(difficultyRating) : null,
      valueRating: valueRating ? parseFloat(valueRating) : null,
      reviewText: reviewText || null,
    },
  });

  return NextResponse.json(rating, { status: 201 });
}
