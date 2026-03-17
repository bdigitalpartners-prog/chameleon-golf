import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/**
 * Merge two duplicate courses. The primary course is kept and enriched
 * with any missing data from the secondary course. All relations from
 * the secondary are re-pointed to the primary, then the secondary is deleted.
 *
 * Body: { primaryId: number, secondaryId: number }
 */
export async function POST(request: NextRequest) {
  const authErr = await checkAdminAuth(request);
  if (authErr) return authErr;

  try {
    const { primaryId, secondaryId } = await request.json();
    if (!primaryId || !secondaryId || primaryId === secondaryId) {
      return NextResponse.json(
        { error: "Valid primaryId and secondaryId are required (and must differ)" },
        { status: 400 }
      );
    }

    const [primary, secondary] = await Promise.all([
      prisma.course.findUnique({ where: { courseId: primaryId } }),
      prisma.course.findUnique({ where: { courseId: secondaryId } }),
    ]);

    if (!primary || !secondary) {
      return NextResponse.json({ error: "One or both courses not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // ── 1. Merge enrichment data: fill empty fields on primary from secondary ──
      const MERGE_TEXT_FIELDS = [
        "facilityName", "streetAddress", "city", "state", "zipCode", "country",
        "courseType", "accessType", "courseStyle", "originalArchitect",
        "renovationArchitect", "websiteUrl", "phone", "email",
        "description", "tagline", "walkingPolicy", "dressCode",
        "caddieAvailability", "caddieFee", "cartPolicy", "cartFee",
        "cellPhonePolicy", "bookingUrl", "howToGetOn", "resortAffiliateAccess",
        "guestPolicy", "signatureHoleDescription", "courseStrategy",
        "whatToExpect", "bestTimeToPlay", "paceOfPlayNotes",
        "fairwayGrass", "greenGrass", "greenSpeed", "aerationSchedule",
        "bestConditionMonths", "golfSeason", "architectBio", "designPhilosophy",
        "resortNameField", "resortBookingUrl", "averageRoundTime",
        "instagramUrl", "twitterUrl", "facebookUrl", "tiktokUrl",
        "priceTier", "dataSources",
      ] as const;

      const MERGE_NUMBER_FIELDS = [
        "latitude", "longitude", "numHoles", "par", "yearOpened",
        "renovationYear", "greenFeeLow", "greenFeeHigh",
        "greenFeePeak", "greenFeeOffPeak", "greenFeeTwilight",
        "signatureHoleNumber", "architectId",
      ] as const;

      const MERGE_BOOL_FIELDS = [
        "onSiteLodging", "clubRentalAvailable", "includesCart",
      ] as const;

      const MERGE_JSON_FIELDS = [
        "practiceFacilities", "insiderTips", "championshipHistory",
        "famousMoments", "upcomingEvents", "weatherData", "bestMonths",
        "worstMonths", "templateHoles", "renovationHistory",
        "stayAndPlayPackages", "bestPar3", "bestPar4", "bestPar5",
        "renovationNotes",
      ] as const;

      const updates: Record<string, unknown> = {};

      for (const field of MERGE_TEXT_FIELDS) {
        const pVal = (primary as Record<string, unknown>)[field];
        const sVal = (secondary as Record<string, unknown>)[field];
        if ((!pVal || pVal === "") && sVal && sVal !== "") {
          updates[field] = sVal;
        }
      }

      for (const field of MERGE_NUMBER_FIELDS) {
        const pVal = (primary as Record<string, unknown>)[field];
        const sVal = (secondary as Record<string, unknown>)[field];
        if ((pVal === null || pVal === undefined) && sVal !== null && sVal !== undefined) {
          updates[field] = sVal;
        }
      }

      for (const field of MERGE_BOOL_FIELDS) {
        const pVal = (primary as Record<string, unknown>)[field];
        const sVal = (secondary as Record<string, unknown>)[field];
        if (pVal === null && sVal !== null) {
          updates[field] = sVal;
        }
      }

      for (const field of MERGE_JSON_FIELDS) {
        const pVal = (primary as Record<string, unknown>)[field];
        const sVal = (secondary as Record<string, unknown>)[field];
        if (!pVal && sVal) {
          updates[field] = sVal;
        }
      }

      // Merge numListsAppeared (take the higher)
      const pLists = primary.numListsAppeared || 0;
      const sLists = secondary.numListsAppeared || 0;
      if (sLists > pLists) {
        updates.numListsAppeared = sLists;
      }

      // If secondary is enriched and primary is not, mark primary as enriched
      if (!primary.isEnriched && secondary.isEnriched) {
        updates.isEnriched = true;
      }

      // Merge dataSources
      if (primary.dataSources || secondary.dataSources) {
        const combined = new Set([
          ...(primary.dataSources || "").split(",").filter(Boolean),
          ...(secondary.dataSources || "").split(",").filter(Boolean),
        ]);
        if (combined.size > 0) {
          updates.dataSources = Array.from(combined).join(",");
        }
      }

      updates.updatedAt = new Date();

      if (Object.keys(updates).length > 0) {
        await tx.course.update({ where: { courseId: primaryId }, data: updates });
      }

      // ── 2. Re-point non-cascading relations from secondary → primary ──

      // Rankings – transfer, skip if primary already has same list entry
      const secondaryRankings = await tx.rankingEntry.findMany({
        where: { courseId: secondaryId },
      });
      for (const r of secondaryRankings) {
        const existing = await tx.rankingEntry.findUnique({
          where: { listId_courseId: { listId: r.listId, courseId: primaryId } },
        });
        if (!existing) {
          await tx.rankingEntry.update({
            where: { id: r.id },
            data: { courseId: primaryId },
          });
        }
      }

      // CourseArchitect – transfer, skip duplicates
      const secondaryArchitects = await tx.courseArchitect.findMany({
        where: { courseId: secondaryId },
      });
      for (const ca of secondaryArchitects) {
        const existing = await tx.courseArchitect.findUnique({
          where: {
            courseId_architectId_role: {
              courseId: primaryId,
              architectId: ca.architectId,
              role: ca.role,
            },
          },
        });
        if (!existing) {
          await tx.courseArchitect.update({
            where: { id: ca.id },
            data: { courseId: primaryId },
          });
        }
      }

      // Media – transfer all (no unique constraint)
      await tx.courseMedia.updateMany({
        where: { courseId: secondaryId },
        data: { courseId: primaryId },
      });

      // Intelligence notes
      await tx.courseIntelligenceNote.updateMany({
        where: { courseId: secondaryId },
        data: { courseId: primaryId },
      });

      // Nearby dining/lodging/attractions/courses/rv parks/metro distances
      // Delete secondary's entries (they'll just be re-generated)
      await tx.courseNearbyDining.deleteMany({ where: { courseId: secondaryId } });
      await tx.courseNearbyLodging.deleteMany({ where: { courseId: secondaryId } });
      await tx.courseNearbyAttractions.deleteMany({ where: { courseId: secondaryId } });
      await tx.courseNearbyCourses.deleteMany({ where: { courseId: secondaryId } });
      await tx.courseNearbyCourses.deleteMany({ where: { nearbyCourseId: secondaryId } });
      await tx.courseNearbyRvParks.deleteMany({ where: { courseId: secondaryId } });
      await tx.courseNearbyMetroDistance.deleteMany({ where: { courseId: secondaryId } });

      // Wishlist – transfer
      const secondaryWishlists = await tx.courseWishlist.findMany({
        where: { courseId: secondaryId },
      });
      for (const w of secondaryWishlists) {
        const existing = await tx.courseWishlist.findFirst({
          where: { userId: w.userId, courseId: primaryId },
        });
        if (!existing) {
          await tx.courseWishlist.update({
            where: { id: w.id },
            data: { courseId: primaryId },
          });
        }
      }

      // Condition reports
      await tx.conditionReport.updateMany({
        where: { courseId: secondaryId },
        data: { courseId: primaryId },
      });

      // User-generated content: posts, games, events, etc.
      await tx.post.updateMany({ where: { courseId: secondaryId }, data: { courseId: primaryId } });
      await tx.game.updateMany({ where: { courseId: secondaryId }, data: { courseId: primaryId } });
      await tx.event.updateMany({ where: { courseId: secondaryId }, data: { courseId: primaryId } });
      await tx.eventMatch.updateMany({ where: { courseId: secondaryId }, data: { courseId: primaryId } });
      await tx.prediction.updateMany({ where: { courseId: secondaryId }, data: { courseId: primaryId } });
      await tx.prepPack.updateMany({ where: { courseId: secondaryId }, data: { courseId: primaryId } });
      await tx.roundHistory.updateMany({ where: { courseId: secondaryId }, data: { courseId: primaryId } });
      await tx.leagueRound.updateMany({ where: { courseId: secondaryId }, data: { courseId: primaryId } });
      await tx.tripRound.updateMany({ where: { courseId: secondaryId }, data: { courseId: primaryId } });

      // Trip courses – transfer, skip duplicates
      const secondaryTripCourses = await tx.tripCourse.findMany({
        where: { courseId: secondaryId },
      });
      for (const tc of secondaryTripCourses) {
        const existing = await tx.tripCourse.findFirst({
          where: { tripId: tc.tripId, courseId: primaryId },
        });
        if (!existing) {
          await tx.tripCourse.update({
            where: { id: tc.id },
            data: { courseId: primaryId },
          });
        }
      }

      await tx.tripVote.updateMany({ where: { courseId: secondaryId }, data: { courseId: primaryId } });

      // Circle-related
      await tx.circleConsensus.updateMany({ where: { courseId: secondaryId }, data: { courseId: primaryId } });
      await tx.circleEvent.updateMany({ where: { courseId: secondaryId }, data: { courseId: primaryId } });

      // Circle course aggregate and ratings – handle unique constraints
      const secondaryAggregates = await tx.circleCourseAggregate.findMany({
        where: { courseId: secondaryId },
      });
      for (const agg of secondaryAggregates) {
        const existing = await tx.circleCourseAggregate.findFirst({
          where: { circleId: agg.circleId, courseId: primaryId },
        });
        if (!existing) {
          await tx.circleCourseAggregate.update({
            where: { id: agg.id },
            data: { courseId: primaryId },
          });
        }
      }

      const secondaryCircleRatings = await tx.circleCourseRating.findMany({
        where: { courseId: secondaryId },
      });
      for (const cr of secondaryCircleRatings) {
        const existing = await tx.circleCourseRating.findFirst({
          where: { circleId: cr.circleId, userId: cr.userId, courseId: primaryId },
        });
        if (!existing) {
          await tx.circleCourseRating.update({
            where: { id: cr.id },
            data: { courseId: primaryId },
          });
        }
      }

      // Course check-ins and recommendations
      await tx.courseCheckIn.updateMany({ where: { courseId: secondaryId }, data: { courseId: primaryId } });
      await tx.courseRecommendation.updateMany({ where: { courseId: secondaryId }, data: { courseId: primaryId } });

      // ── 3. Delete the secondary course (cascading relations auto-removed) ──
      await tx.course.delete({ where: { courseId: secondaryId } });
    });

    // Fetch the merged result
    const merged = await prisma.course.findUnique({
      where: { courseId: primaryId },
      include: {
        rankings: { include: { list: { include: { source: true } } } },
        media: true,
      },
    });

    return NextResponse.json({
      message: `Merged course #${secondaryId} into #${primaryId}`,
      course: merged,
    });
  } catch (err) {
    console.error("Course merge error:", err);
    return NextResponse.json(
      { error: "Failed to merge courses", details: String(err) },
      { status: 500 }
    );
  }
}
