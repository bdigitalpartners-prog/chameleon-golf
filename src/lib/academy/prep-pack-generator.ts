import prisma from "@/lib/prisma";

interface PrepPackData {
  keyHoles: Array<{ holeNumber: number; description: string; strategy: string }>;
  strategyTips: Array<{ tip: string; source: string }>;
  clubSuggestions: Array<{ situation: string; suggestion: string }>;
  expectations: {
    expectedScore: string;
    courseConditions: string;
    paceOfPlay: string;
    bestTimeToPlay: string;
  };
  courseNotes: Array<{ category: string; title: string; content: string }>;
}

export async function generatePrepPack(
  userId: string,
  courseId: number
): Promise<PrepPackData | null> {
  const [course, userScores, difficulty, user] = await Promise.all([
    prisma.course.findUnique({
      where: { courseId },
      include: { teeBoxes: true, intelligenceNotes: true, chameleonScores: true },
    }),
    prisma.postedScore.findMany({
      where: { userId },
      orderBy: { datePlayed: "desc" },
      take: 10,
    }),
    prisma.courseDifficulty.findUnique({ where: { courseId } }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { handicapIndex: true },
    }),
  ]);

  if (!course) return null;

  // Key holes
  const keyHoles: PrepPackData["keyHoles"] = [];
  if (course.signatureHoleNumber) {
    keyHoles.push({
      holeNumber: course.signatureHoleNumber,
      description: course.signatureHoleDescription || "Signature hole",
      strategy: "Play conservatively for par — this hole rewards smart positioning over power.",
    });
  }
  if (course.bestPar3) {
    const p3 = course.bestPar3 as any;
    keyHoles.push({
      holeNumber: p3.holeNumber ?? 0,
      description: p3.description ?? "Best par 3",
      strategy: "Club selection is key. Take one more club than you think.",
    });
  }

  // Strategy tips
  const strategyTips: PrepPackData["strategyTips"] = [];
  if (course.courseStrategy) {
    strategyTips.push({ tip: course.courseStrategy, source: "course_data" });
  }
  if (course.greenSpeed) {
    strategyTips.push({
      tip: `Greens run ${course.greenSpeed}. Adjust your putting speed accordingly.`,
      source: "conditions",
    });
  }
  if (difficulty) {
    strategyTips.push({
      tip: `True Difficulty Index: ${Number(difficulty.trueDifficultyIndex).toFixed(1)}/100. Ideal handicap range: ${Number(difficulty.idealHandicapLow)}-${Number(difficulty.idealHandicapHigh)}.`,
      source: "difficulty_analysis",
    });
  }
  strategyTips.push({
    tip: `Best time to play: ${course.bestTimeToPlay || "Morning for best conditions"}.`,
    source: "general",
  });

  // Club suggestions based on course style
  const clubSuggestions = generateClubSuggestions(course);

  // Expectations
  const avgScore = userScores.length > 0
    ? Math.round(userScores.reduce((s, r) => s + r.totalScore, 0) / userScores.length)
    : null;

  const expectations = {
    expectedScore: avgScore
      ? `Based on your recent average of ${avgScore}, expect to score around ${avgScore + 2}-${avgScore + 5} on a new course.`
      : "Track more rounds to get personalized score predictions.",
    courseConditions: course.fairwayGrass
      ? `Fairways: ${course.fairwayGrass}. Greens: ${course.greenGrass || "Unknown"}.`
      : "Check course conditions before your round.",
    paceOfPlay: course.paceOfPlayNotes || "Expect 4-4.5 hours for 18 holes.",
    bestTimeToPlay: course.bestTimeToPlay || "Morning rounds typically offer the best conditions.",
  };

  // Course intelligence notes
  const courseNotes = (course.intelligenceNotes || []).map((n) => ({
    category: n.category,
    title: n.title,
    content: n.content,
  }));

  return { keyHoles, strategyTips, clubSuggestions, expectations, courseNotes };
}

function generateClubSuggestions(
  course: any
): Array<{ situation: string; suggestion: string }> {
  const suggestions = [];

  const slope = course.teeBoxes?.[0]?.slopeRating;
  if (slope && slope > 135) {
    suggestions.push({
      situation: "Off the tee",
      suggestion: "Consider hybrid or 3-wood on narrow holes — accuracy is rewarded on this challenging layout.",
    });
  } else {
    suggestions.push({
      situation: "Off the tee",
      suggestion: "Driver is playable on most holes. Focus on finding the fairway.",
    });
  }

  if (course.greenSpeed?.toLowerCase().includes("fast")) {
    suggestions.push({
      situation: "Around the greens",
      suggestion: "Greens are fast — use a putter from off the green when possible. Chipping requires a soft touch.",
    });
  }

  suggestions.push({
    situation: "Course management",
    suggestion: "Play to the center of greens on your first visit. Avoid sucker pins.",
  });

  return suggestions;
}
