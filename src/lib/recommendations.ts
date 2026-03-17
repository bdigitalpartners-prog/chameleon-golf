import prisma from "./prisma";

/**
 * Generate course recommendations for a user based on circle data.
 * Algorithm:
 * 1. Content-based: Courses rated highly by user's circles that user hasn't rated
 * 2. Collaborative: Courses loved by members with similar rating patterns
 * 3. Tag-based: Courses matching user's tags
 */
export async function generateRecommendations(userId: string): Promise<void> {
  // Get user's circles
  const memberships = await prisma.circleMembership.findMany({
    where: { userId, role: { in: ["OWNER", "ADMIN", "MEMBER"] } },
    select: { circleId: true },
  });
  const circleIds = memberships.map((m) => m.circleId);

  // Get courses user has already rated
  const userRatings = await prisma.userCourseRating.findMany({
    where: { userId },
    select: { courseId: true },
  });
  const ratedCourseIds = new Set(userRatings.map((r) => r.courseId));

  // Get existing recommendations to avoid duplicates
  const existing = await prisma.courseRecommendation.findMany({
    where: { userId },
    select: { courseId: true },
  });
  const existingIds = new Set(existing.map((e) => e.courseId));

  const recommendations: {
    courseId: number;
    score: number;
    reason: string;
    sourceCircleId?: string;
  }[] = [];

  // 1. Circle-based: Courses rated highly by user's circles
  if (circleIds.length > 0) {
    const circleAggregates = await prisma.circleCourseAggregate.findMany({
      where: {
        circleId: { in: circleIds },
        avgScore: { gte: 7.0 },
        ratingCount: { gte: 2 },
      },
      include: {
        circle: { select: { name: true } },
        course: { select: { courseId: true, courseName: true } },
      },
      orderBy: { avgScore: "desc" },
      take: 50,
    });

    for (const agg of circleAggregates) {
      if (ratedCourseIds.has(agg.courseId) || existingIds.has(agg.courseId)) continue;
      const score = Math.min((agg.avgScore / 10) * 0.9, 1);
      recommendations.push({
        courseId: agg.courseId,
        score,
        reason: `Your ${agg.circle.name} circle rates ${agg.course.courseName} ${agg.avgScore.toFixed(1)}/10`,
        sourceCircleId: agg.circleId,
      });
      existingIds.add(agg.courseId);
    }
  }

  // 2. Collaborative: Courses loved by users who play the same courses
  if (ratedCourseIds.size > 0) {
    const ratedArr = Array.from(ratedCourseIds);
    const similarUsers = await prisma.userCourseRating.findMany({
      where: {
        courseId: { in: ratedArr.slice(0, 20) },
        userId: { not: userId },
        overallRating: { gte: 8 },
      },
      select: { userId: true },
      distinct: ["userId"],
      take: 30,
    });

    const similarUserIds = similarUsers.map((u) => u.userId);
    if (similarUserIds.length > 0) {
      const theirTopCourses = await prisma.userCourseRating.findMany({
        where: {
          userId: { in: similarUserIds },
          overallRating: { gte: 8 },
          courseId: { notIn: ratedArr },
        },
        include: {
          course: { select: { courseId: true, courseName: true } },
        },
        orderBy: { overallRating: "desc" },
        take: 30,
      });

      for (const rating of theirTopCourses) {
        if (existingIds.has(rating.courseId)) continue;
        recommendations.push({
          courseId: rating.courseId,
          score: Number(rating.overallRating) / 10 * 0.75,
          reason: `Golfers who play similar courses rated ${rating.course.courseName} ${Number(rating.overallRating).toFixed(1)}/10`,
        });
        existingIds.add(rating.courseId);
      }
    }
  }

  // 3. Tag-based: Courses matching user's tags via course style/type
  const userTags = await prisma.userTag.findMany({
    where: { userId },
    include: { tag: true },
  });

  if (userTags.length > 0) {
    const tagNames = userTags.map((ut) => ut.tag.name.toLowerCase());
    const styleMatches: string[] = [];
    if (tagNames.some((t) => t.includes("links"))) styleMatches.push("Links");
    if (tagNames.some((t) => t.includes("parkland"))) styleMatches.push("Parkland");
    if (tagNames.some((t) => t.includes("desert"))) styleMatches.push("Desert");
    if (tagNames.some((t) => t.includes("mountain"))) styleMatches.push("Mountain");

    if (styleMatches.length > 0) {
      const tagCourses = await prisma.course.findMany({
        where: {
          courseStyle: { in: styleMatches },
          courseId: { notIn: Array.from(existingIds) },
        },
        include: {
          chameleonScores: { select: { chameleonScore: true } },
        },
        orderBy: { numListsAppeared: "desc" },
        take: 15,
      });

      for (const course of tagCourses) {
        if (ratedCourseIds.has(course.courseId)) continue;
        const cscore = course.chameleonScores
          ? Number(course.chameleonScores.chameleonScore) / 100
          : 0.5;
        recommendations.push({
          courseId: course.courseId,
          score: cscore * 0.6,
          reason: `Matches your ${styleMatches.join("/")} style preference`,
        });
        existingIds.add(course.courseId);
      }
    }
  }

  // Sort by score and take top 40
  recommendations.sort((a, b) => b.score - a.score);
  const topRecs = recommendations.slice(0, 40);

  // Upsert recommendations
  for (const rec of topRecs) {
    await prisma.courseRecommendation.upsert({
      where: { userId_courseId: { userId, courseId: rec.courseId } },
      create: {
        userId,
        courseId: rec.courseId,
        score: rec.score,
        reason: rec.reason,
        sourceCircleId: rec.sourceCircleId,
      },
      update: {
        score: rec.score,
        reason: rec.reason,
        sourceCircleId: rec.sourceCircleId,
      },
    });
  }
}

/**
 * Suggest circles based on mutual connections, shared courses, and tag overlap.
 */
export async function getCircleRecommendations(userId: string) {
  // Get user's current circles
  const myMemberships = await prisma.circleMembership.findMany({
    where: { userId, role: { in: ["OWNER", "ADMIN", "MEMBER"] } },
    select: { circleId: true },
  });
  const myCircleIds = myMemberships.map((m) => m.circleId);

  // Get user's connections
  const connections = await prisma.connection.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
    select: { senderId: true, receiverId: true },
  });
  const friendIds = connections.map((c) =>
    c.senderId === userId ? c.receiverId : c.senderId
  );

  // Find circles friends are in that user isn't
  const friendCircles = await prisma.circleMembership.findMany({
    where: {
      userId: { in: friendIds },
      circleId: { notIn: myCircleIds },
      role: { in: ["OWNER", "ADMIN", "MEMBER"] },
      circle: { privacy: { not: "SECRET" } },
    },
    include: {
      circle: {
        include: {
          _count: { select: { members: true } },
        },
      },
    },
  });

  // Count mutual connections per circle
  const circleMap = new Map<
    string,
    { circle: any; mutualCount: number; reason: string }
  >();
  for (const fc of friendCircles) {
    const existing = circleMap.get(fc.circleId);
    if (existing) {
      existing.mutualCount++;
    } else {
      circleMap.set(fc.circleId, {
        circle: {
          id: fc.circle.id,
          name: fc.circle.name,
          slug: fc.circle.slug,
          type: fc.circle.type,
          privacy: fc.circle.privacy,
          imageUrl: fc.circle.imageUrl,
          description: fc.circle.description,
          memberCount: fc.circle._count.members,
        },
        mutualCount: 1,
        reason: "Friends are members",
      });
    }
  }

  // Sort by mutual connections
  const results = Array.from(circleMap.values())
    .sort((a, b) => b.mutualCount - a.mutualCount)
    .slice(0, 10)
    .map((r) => ({
      ...r.circle,
      mutualConnections: r.mutualCount,
      matchReason: `${r.mutualCount} friend${r.mutualCount > 1 ? "s" : ""} in this circle`,
    }));

  return results;
}

/**
 * "People You May Know" based on overlapping circles, common courses, and mutual connections.
 */
export async function getPeopleRecommendations(userId: string) {
  // Get user's connections
  const connections = await prisma.connection.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
    select: { senderId: true, receiverId: true },
  });
  const friendIds = new Set(
    connections.map((c) => (c.senderId === userId ? c.receiverId : c.senderId))
  );

  // Get user's circles
  const myCircles = await prisma.circleMembership.findMany({
    where: { userId, role: { in: ["OWNER", "ADMIN", "MEMBER"] } },
    select: { circleId: true },
  });
  const myCircleIds = myCircles.map((m) => m.circleId);

  // Find people in same circles who aren't already friends
  const circleMembers = await prisma.circleMembership.findMany({
    where: {
      circleId: { in: myCircleIds },
      userId: { not: userId },
      role: { in: ["OWNER", "ADMIN", "MEMBER"] },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          handicapIndex: true,
        },
      },
      circle: { select: { id: true, name: true } },
    },
  });

  const peopleMap = new Map<
    string,
    {
      user: any;
      sharedCircles: string[];
      mutualFriends: number;
    }
  >();

  for (const cm of circleMembers) {
    if (friendIds.has(cm.userId) || cm.userId === userId) continue;
    const existing = peopleMap.get(cm.userId);
    if (existing) {
      if (!existing.sharedCircles.includes(cm.circle.name)) {
        existing.sharedCircles.push(cm.circle.name);
      }
    } else {
      peopleMap.set(cm.userId, {
        user: cm.user,
        sharedCircles: [cm.circle.name],
        mutualFriends: 0,
      });
    }
  }

  // Count mutual friends for each candidate
  for (const [candidateId, data] of peopleMap.entries()) {
    const candidateConnections = await prisma.connection.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ senderId: candidateId }, { receiverId: candidateId }],
      },
      select: { senderId: true, receiverId: true },
    });
    const candidateFriends = new Set(
      candidateConnections.map((c) =>
        c.senderId === candidateId ? c.receiverId : c.senderId
      )
    );
    data.mutualFriends = [...friendIds].filter((f) => candidateFriends.has(f)).length;
  }

  return Array.from(peopleMap.values())
    .sort((a, b) => {
      const scoreA = a.sharedCircles.length * 2 + a.mutualFriends * 3;
      const scoreB = b.sharedCircles.length * 2 + b.mutualFriends * 3;
      return scoreB - scoreA;
    })
    .slice(0, 15)
    .map((p) => ({
      ...p.user,
      sharedCircles: p.sharedCircles,
      mutualFriends: p.mutualFriends,
    }));
}
