import prisma from '@/lib/prisma';
import { fetchGhinRounds } from '@/lib/ghin/client';

export async function importRoundsFromGhin(userId: string): Promise<{ imported: number; skipped: number }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { ghinNumber: true },
  });

  if (!user?.ghinNumber) return { imported: 0, skipped: 0 };

  const ghinRounds = await fetchGhinRounds(user.ghinNumber);
  let imported = 0;
  let skipped = 0;

  for (const round of ghinRounds) {
    // Check if round already imported
    const existing = await prisma.roundHistory.findFirst({
      where: { userId, ghinRoundId: round.roundId },
    });

    if (existing) {
      skipped++;
      continue;
    }

    // Try to match course by name
    const course = await prisma.course.findFirst({
      where: { courseName: { contains: round.courseName, mode: 'insensitive' } },
    });

    if (!course) {
      skipped++;
      continue;
    }

    const roundHistory = await prisma.roundHistory.create({
      data: {
        userId,
        courseId: course.courseId,
        ghinRoundId: round.roundId,
        score: round.score,
        adjustedScore: round.adjustedScore,
        differential: round.differential,
        teeBoxName: round.teeBoxName,
        courseRating: round.courseRating,
        slopeRating: round.slopeRating,
        playDate: new Date(round.playDate),
        numHoles: round.numHoles,
        isVerified: true,
        source: 'ghin',
      },
    });

    // Create verified play badge
    await prisma.verifiedPlay.create({
      data: {
        roundId: roundHistory.id,
        userId,
        badgeType: 'ghin_verified',
        verificationSource: 'ghin',
      },
    });

    imported++;
  }

  return { imported, skipped };
}
