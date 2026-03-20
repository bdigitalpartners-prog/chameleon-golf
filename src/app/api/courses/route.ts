import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const DEFAULT_WEIGHT = 50;

function parseWeight(val: string | null): number {
  if (!val) return DEFAULT_WEIGHT;
  const n = parseFloat(val);
  return isNaN(n) ? DEFAULT_WEIGHT : Math.max(0, Math.min(100, n));
}

function isCustomWeights(weights: number[]): boolean {
  const first = weights[0];
  return weights.some((w) => Math.abs(w - first) > 0.01);
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") ?? "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "24"), 2000);
    const skip = (page - 1) * limit;

    const country = url.searchParams.get("country") || undefined;
    const state = url.searchParams.get("state") || undefined;
    const courseStyle = url.searchParams.get("courseStyle") || undefined;
    const accessType = url.searchParams.get("accessType") || undefined;
    const feeMin = url.searchParams.get("feeMin") ? parseFloat(url.searchParams.get("feeMin")!) : undefined;
    const feeMax = url.searchParams.get("feeMax") ? parseFloat(url.searchParams.get("feeMax")!) : undefined;
    const sortBy = url.searchParams.get("sortBy") ?? "chameleon";
    const sortDir = url.searchParams.get("sortDir") ?? "desc";
    // New filters
    const listId = url.searchParams.get("listId") ? parseInt(url.searchParams.get("listId")!) : undefined;
    const walkingPolicy = url.searchParams.get("walkingPolicy") || undefined;
    const yearMin = url.searchParams.get("yearMin") ? parseInt(url.searchParams.get("yearMin")!) : undefined;
    const yearMax = url.searchParams.get("yearMax") ? parseInt(url.searchParams.get("yearMax")!) : undefined;
    const architect = url.searchParams.get("architect") || undefined;

    // Weight params
    const w_expert = parseWeight(url.searchParams.get("w_expert"));
    const w_conditioning = parseWeight(url.searchParams.get("w_conditioning"));
    const w_layout = parseWeight(url.searchParams.get("w_layout"));
    const w_aesthetics = parseWeight(url.searchParams.get("w_aesthetics"));
    const w_challenge = parseWeight(url.searchParams.get("w_challenge"));
    const w_value = parseWeight(url.searchParams.get("w_value"));
    const w_walkability = parseWeight(url.searchParams.get("w_walkability"));
    const w_pace = parseWeight(url.searchParams.get("w_pace"));
    const w_amenities = parseWeight(url.searchParams.get("w_amenities"));
    const w_service = parseWeight(url.searchParams.get("w_service"));

    const weightValues = [w_expert, w_conditioning, w_layout, w_aesthetics, w_challenge, w_value, w_walkability, w_pace, w_amenities, w_service];
    const useWeightedSort = url.searchParams.has("w_expert") && isCustomWeights(weightValues);

    if (useWeightedSort) {
      // Use raw SQL for weighted scoring
      const totalWeight = weightValues.reduce((a, b) => a + b, 0) || 1;

      // Build WHERE clauses
      const conditions: Prisma.Sql[] = [Prisma.sql`1=1`];
      if (country) conditions.push(Prisma.sql`c.country = ${country}`);
      if (state) conditions.push(Prisma.sql`c.state = ${state}`);
      if (courseStyle) conditions.push(Prisma.sql`c.course_style = ${courseStyle}`);
      if (accessType) conditions.push(Prisma.sql`c.access_type = ${accessType}`);
      if (feeMin !== undefined) conditions.push(Prisma.sql`c.green_fee_low >= ${feeMin}`);
      if (feeMax !== undefined) conditions.push(Prisma.sql`c.green_fee_low <= ${feeMax}`);
      if (walkingPolicy) conditions.push(Prisma.sql`c.walking_policy = ${walkingPolicy}`);
      if (yearMin !== undefined) conditions.push(Prisma.sql`c.year_opened >= ${yearMin}`);
      if (yearMax !== undefined) conditions.push(Prisma.sql`c.year_opened <= ${yearMax}`);
      if (architect) conditions.push(Prisma.sql`c.original_architect ILIKE ${"%" + architect + "%"}`);
      if (listId !== undefined) conditions.push(Prisma.sql`EXISTS (SELECT 1 FROM ranking_entries re WHERE re.course_id = c.course_id AND re.list_id = ${listId})`);

      const whereClause = conditions.reduce((acc, cond) => Prisma.sql`${acc} AND ${cond}`);
      const orderDirection = sortDir === "asc" ? Prisma.sql`ASC` : Prisma.sql`DESC`;

      type RawCourse = {
        course_id: bigint;
        course_name: string;
        facility_name: string | null;
        city: string | null;
        state: string | null;
        country: string;
        course_style: string | null;
        course_type: string | null;
        access_type: string | null;
        par: number | null;
        num_holes: number | null;
        year_opened: number | null;
        original_architect: string | null;
        green_fee_low: string | null;
        green_fee_high: string | null;
        walking_policy: string | null;
        num_lists_appeared: number | null;
        chameleon_score: string | null;
        prestige_score: string | null;
        primary_image_url: string | null;
        weighted_score: string | null;
        total_count: bigint;
      };

      const rows = await prisma.$queryRaw<RawCourse[]>(Prisma.sql`
        SELECT
          c.course_id,
          c.course_name,
          c.facility_name,
          c.city,
          c.state,
          c.country,
          c.course_style,
          c.course_type,
          c.access_type,
          c.par,
          c.num_holes,
          c.year_opened,
          c.original_architect,
          c.green_fee_low::text,
          c.green_fee_high::text,
          c.walking_policy,
          c.num_lists_appeared,
          cs.chameleon_score::text,
          cs.prestige_score::text,
          (SELECT cm.url FROM course_media cm WHERE cm.course_id = c.course_id AND cm.is_primary = true LIMIT 1) as primary_image_url,
          CASE
            WHEN cs.id IS NOT NULL THEN
              (
                ${w_expert}::float * COALESCE(cs.prestige_score / 10.0, 0) +
                ${w_conditioning}::float * COALESCE(cs.avg_conditioning, 0) +
                ${w_layout}::float * COALESCE(cs.avg_layout_design, 0) +
                ${w_aesthetics}::float * COALESCE(cs.avg_aesthetics, 0) +
                ${w_challenge}::float * COALESCE(cs.avg_challenge, 0) +
                ${w_value}::float * COALESCE(cs.avg_value, 0) +
                ${w_walkability}::float * COALESCE(cs.avg_walkability, 0) +
                ${w_pace}::float * COALESCE(cs.avg_pace, 0) +
                ${w_amenities}::float * COALESCE(cs.avg_amenities, 0) +
                ${w_service}::float * COALESCE(cs.avg_service, 0)
              ) / ${totalWeight}::float
            ELSE NULL
          END as weighted_score,
          COUNT(*) OVER() as total_count
        FROM courses c
        LEFT JOIN chameleon_scores cs ON cs.course_id = c.course_id
        WHERE ${whereClause}
        ORDER BY weighted_score ${orderDirection} NULLS LAST
        LIMIT ${limit} OFFSET ${skip}
      `);

      const total = rows.length > 0 ? Number(rows[0].total_count) : 0;

      // Fetch rankings for each course in batch
      const courseIds = rows.map((r) => Number(r.course_id));
      const rankingsData = courseIds.length > 0
        ? await prisma.rankingEntry.findMany({
            where: { courseId: { in: courseIds } },
            include: { list: { include: { source: true } } },
            orderBy: { rankPosition: "asc" },
          })
        : [];

      const rankingsByCoursId = new Map<number, typeof rankingsData>();
      for (const r of rankingsData) {
        if (!rankingsByCoursId.has(r.courseId)) rankingsByCoursId.set(r.courseId, []);
        rankingsByCoursId.get(r.courseId)!.push(r);
      }

      const items = rows.map((r) => {
        const cId = Number(r.course_id);
        const rankings = rankingsByCoursId.get(cId) ?? [];
        return {
          courseId: cId,
          courseName: r.course_name,
          facilityName: r.facility_name,
          city: r.city,
          state: r.state,
          country: r.country,
          courseStyle: r.course_style,
          courseType: r.course_type,
          accessType: r.access_type,
          par: r.par,
          numHoles: r.num_holes,
          yearOpened: r.year_opened,
          originalArchitect: r.original_architect,
          greenFeeLow: r.green_fee_low,
          greenFeeHigh: r.green_fee_high,
          walkingPolicy: r.walking_policy,
          numListsAppeared: r.num_lists_appeared,
          chameleonScore: r.chameleon_score ? parseFloat(r.chameleon_score) : null,
          prestigeScore: r.prestige_score,
          primaryImageUrl: r.primary_image_url,
          bestRank: rankings[0]?.rankPosition ?? null,
          bestSource: rankings[0]?.list?.source?.sourceName ?? null,
          rankings: rankings.slice(0, 3).map((re) => ({
            rank: re.rankPosition,
            list: re.list?.listName ?? "",
            source: re.list?.source?.sourceName ?? "",
          })),
          weightedScore: r.weighted_score ? parseFloat(r.weighted_score) : null,
        };
      });

      return NextResponse.json({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
    }

    // --- Golf Digest Top 100 sort (raw SQL) ---
    if (sortBy === "gd100") {
      const conditions: Prisma.Sql[] = [Prisma.sql`1=1`];
      if (country) conditions.push(Prisma.sql`c.country = ${country}`);
      if (state) conditions.push(Prisma.sql`c.state = ${state}`);
      if (courseStyle) conditions.push(Prisma.sql`c.course_style = ${courseStyle}`);
      if (accessType) conditions.push(Prisma.sql`c.access_type = ${accessType}`);
      if (feeMin !== undefined) conditions.push(Prisma.sql`c.green_fee_low >= ${feeMin}`);
      if (feeMax !== undefined) conditions.push(Prisma.sql`c.green_fee_low <= ${feeMax}`);
      if (walkingPolicy) conditions.push(Prisma.sql`c.walking_policy = ${walkingPolicy}`);
      if (yearMin !== undefined) conditions.push(Prisma.sql`c.year_opened >= ${yearMin}`);
      if (yearMax !== undefined) conditions.push(Prisma.sql`c.year_opened <= ${yearMax}`);
      if (architect) conditions.push(Prisma.sql`c.original_architect ILIKE ${"%" + architect + "%"}`);
      if (listId !== undefined) conditions.push(Prisma.sql`EXISTS (SELECT 1 FROM ranking_entries re2 WHERE re2.course_id = c.course_id AND re2.list_id = ${listId})`);

      const whereClause = conditions.reduce((acc, cond) => Prisma.sql`${acc} AND ${cond}`);

      type GdRawCourse = {
        course_id: bigint;
        course_name: string;
        facility_name: string | null;
        city: string | null;
        state: string | null;
        country: string;
        latitude: string | null;
        longitude: string | null;
        course_style: string | null;
        course_type: string | null;
        access_type: string | null;
        par: number | null;
        num_holes: number | null;
        year_opened: number | null;
        original_architect: string | null;
        green_fee_low: string | null;
        green_fee_high: string | null;
        walking_policy: string | null;
        num_lists_appeared: number | null;
        chameleon_score: string | null;
        prestige_score: string | null;
        primary_image_url: string | null;
        gd_rank: number | null;
        total_count: bigint;
      };

      const rows = await prisma.$queryRaw<GdRawCourse[]>(Prisma.sql`
        SELECT
          c.course_id,
          c.course_name,
          c.facility_name,
          c.city,
          c.state,
          c.country,
          c.latitude::text,
          c.longitude::text,
          c.course_style,
          c.course_type,
          c.access_type,
          c.par,
          c.num_holes,
          c.year_opened,
          c.original_architect,
          c.green_fee_low::text,
          c.green_fee_high::text,
          c.walking_policy,
          c.num_lists_appeared,
          cs.chameleon_score::text,
          cs.prestige_score::text,
          (SELECT cm.url FROM course_media cm WHERE cm.course_id = c.course_id AND cm.is_primary = true LIMIT 1) as primary_image_url,
          re.rank_position as gd_rank,
          COUNT(*) OVER() as total_count
        FROM courses c
        LEFT JOIN ranking_entries re ON re.course_id = c.course_id
          AND re.list_id = (
            SELECT rl.list_id FROM ranking_lists rl
            JOIN ranking_sources rs ON rs.source_id = rl.source_id
            WHERE rs.source_name ILIKE '%Golf Digest%'
            AND rl.list_name ILIKE '%100 Greatest%'
            AND rl.list_name NOT ILIKE '%Second%'
            ORDER BY rl.year_published DESC LIMIT 1
          )
        LEFT JOIN chameleon_scores cs ON cs.course_id = c.course_id
        WHERE ${whereClause}
        ORDER BY
          CASE WHEN re.rank_position IS NOT NULL THEN 0 ELSE 1 END,
          re.rank_position ASC NULLS LAST,
          cs.chameleon_score DESC NULLS LAST
        LIMIT ${limit} OFFSET ${skip}
      `);

      const total = rows.length > 0 ? Number(rows[0].total_count) : 0;

      const courseIds = rows.map((r) => Number(r.course_id));
      const rankingsData = courseIds.length > 0
        ? await prisma.rankingEntry.findMany({
            where: { courseId: { in: courseIds } },
            include: { list: { include: { source: true } } },
            orderBy: { rankPosition: "asc" },
          })
        : [];

      const rankingsByCourseId = new Map<number, typeof rankingsData>();
      for (const r of rankingsData) {
        if (!rankingsByCourseId.has(r.courseId)) rankingsByCourseId.set(r.courseId, []);
        rankingsByCourseId.get(r.courseId)!.push(r);
      }

      const items = rows.map((r) => {
        const cId = Number(r.course_id);
        const rankings = rankingsByCourseId.get(cId) ?? [];
        return {
          courseId: cId,
          courseName: r.course_name,
          facilityName: r.facility_name,
          city: r.city,
          state: r.state,
          country: r.country,
          latitude: r.latitude,
          longitude: r.longitude,
          courseStyle: r.course_style,
          courseType: r.course_type,
          accessType: r.access_type,
          par: r.par,
          numHoles: r.num_holes,
          yearOpened: r.year_opened,
          originalArchitect: r.original_architect,
          greenFeeLow: r.green_fee_low,
          greenFeeHigh: r.green_fee_high,
          walkingPolicy: r.walking_policy,
          numListsAppeared: r.num_lists_appeared,
          chameleonScore: r.chameleon_score ? parseFloat(r.chameleon_score) : null,
          prestigeScore: r.prestige_score,
          primaryImageUrl: r.primary_image_url,
          bestRank: rankings[0]?.rankPosition ?? null,
          bestSource: rankings[0]?.list?.source?.sourceName ?? null,
          rankings: rankings.slice(0, 3).map((re) => ({
            rank: re.rankPosition,
            list: re.list?.listName ?? "",
            source: re.list?.source?.sourceName ?? "",
          })),
          weightedScore: null,
        };
      });

      return NextResponse.json({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
    }

    // --- Standard Prisma query path ---
    const where: any = {};
    if (country) where.country = country;
    if (state) where.state = state;
    if (courseStyle) where.courseStyle = courseStyle;
    if (accessType) where.accessType = accessType;
    if (feeMin !== undefined || feeMax !== undefined) {
      where.greenFeeLow = {};
      if (feeMin !== undefined) where.greenFeeLow.gte = feeMin;
      if (feeMax !== undefined) where.greenFeeLow.lte = feeMax;
    }
    if (walkingPolicy) where.walkingPolicy = walkingPolicy;
    if (yearMin !== undefined || yearMax !== undefined) {
      where.yearOpened = {};
      if (yearMin !== undefined) where.yearOpened.gte = yearMin;
      if (yearMax !== undefined) where.yearOpened.lte = yearMax;
    }
    if (architect) {
      where.originalArchitect = { contains: architect, mode: "insensitive" };
    }
    if (listId !== undefined) {
      where.rankings = { some: { listId } };
    }

    const orderBy: any =
      sortBy === "name" ? { courseName: sortDir }
      : sortBy === "fee" ? { greenFeeLow: sortDir }
      : sortBy === "rank" ? { numListsAppeared: sortDir }
      : sortBy === "architect" ? { originalArchitect: sortDir }
      : sortBy === "chameleon"
        ? [{ chameleonScores: { chameleonScore: sortDir } }, { numListsAppeared: "desc" }]
        : { numListsAppeared: "desc" };

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          media: { where: { isPrimary: true }, take: 1 },
          chameleonScores: true,
          rankings: {
            include: { list: { include: { source: true } } },
            orderBy: { rankPosition: "asc" },
            take: 3,
          },
        },
      }),
      prisma.course.count({ where }),
    ]);

    const items = courses.map((c) => ({
      courseId: c.courseId,
      courseName: c.courseName,
      facilityName: c.facilityName,
      city: c.city,
      state: c.state,
      country: c.country,
      latitude: c.latitude?.toString() ?? null,
      longitude: c.longitude?.toString() ?? null,
      courseStyle: c.courseStyle,
      courseType: c.courseType,
      accessType: c.accessType,
      par: c.par,
      numHoles: c.numHoles,
      yearOpened: c.yearOpened,
      originalArchitect: c.originalArchitect,
      greenFeeLow: c.greenFeeLow?.toString() ?? null,
      greenFeeHigh: c.greenFeeHigh?.toString() ?? null,
      walkingPolicy: c.walkingPolicy,
      numListsAppeared: c.numListsAppeared,
      chameleonScore: c.chameleonScores?.chameleonScore ? parseFloat(c.chameleonScores.chameleonScore.toString()) : null,
      prestigeScore: c.chameleonScores?.prestigeScore?.toString() ?? null,
      primaryImageUrl: c.media[0]?.url ?? null,
      bestRank: c.rankings[0]?.rankPosition ?? null,
      bestSource: c.rankings[0]?.list?.source?.sourceName ?? null,
      rankings: c.rankings.map((r) => ({
        rank: r.rankPosition,
        list: r.list?.listName ?? "",
        source: r.list?.source?.sourceName ?? "",
      })),
      weightedScore: null,
    }));

    return NextResponse.json({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error: any) {
    console.error("GET /api/courses error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
