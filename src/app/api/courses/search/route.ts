import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

type SearchRow = {
  course_id: bigint;
  course_name: string;
  facility_name: string | null;
  city: string | null;
  state: string | null;
  country: string;
  original_architect: string | null;
  num_lists_appeared: number | null;
  logo_url: string | null;
  logo_source: string | null;
  rank_score: number;
};

export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ results: [] });

  const limit = Math.min(
    parseInt(new URL(req.url).searchParams.get("limit") ?? "15"),
    50
  );

  try {
    // Use the search_courses database function for combined full-text + trigram search
    const rows = await prisma.$queryRaw<SearchRow[]>(
      Prisma.sql`SELECT * FROM search_courses(${q}, ${limit})`
    );

    const results = rows.map((r) => ({
      courseId: Number(r.course_id),
      courseName: r.course_name,
      facilityName: r.facility_name,
      city: r.city,
      state: r.state,
      country: r.country,
      originalArchitect: r.original_architect,
      numListsAppeared: r.num_lists_appeared,
      logoUrl: r.logo_url,
      logoSource: r.logo_source,
      score: r.rank_score,
    }));

    return NextResponse.json({ results });
  } catch {
    // Fallback: if the search_courses function doesn't exist yet (migration pending),
    // use inline combined ILIKE + trigram query
    try {
      const rows = await prisma.$queryRaw<SearchRow[]>(Prisma.sql`
        SELECT
          c.course_id,
          c.course_name,
          c.facility_name,
          c.city,
          c.state,
          c.country,
          c.original_architect,
          c.num_lists_appeared,
          c.logo_url,
          c.logo_source,
          (
            COALESCE(similarity(c.course_name, ${q}), 0) * 5.0 +
            COALESCE(similarity(c.city, ${q}), 0) * 2.0 +
            COALESCE(similarity(c.state, ${q}), 0) * 2.0 +
            COALESCE(similarity(c.original_architect, ${q}), 0) * 2.0 +
            COALESCE(similarity(c.facility_name, ${q}), 0) * 1.5 +
            COALESCE(c.num_lists_appeared, 0)::float * 0.05
          )::float AS rank_score
        FROM courses c
        WHERE
          c.course_name ILIKE ${"%" + q + "%"}
          OR c.facility_name ILIKE ${"%" + q + "%"}
          OR c.city ILIKE ${"%" + q + "%"}
          OR c.state ILIKE ${"%" + q + "%"}
          OR c.original_architect ILIKE ${"%" + q + "%"}
        ORDER BY rank_score DESC
        LIMIT ${limit}
      `);

      const results = rows.map((r) => ({
        courseId: Number(r.course_id),
        courseName: r.course_name,
        facilityName: r.facility_name,
        city: r.city,
        state: r.state,
        country: r.country,
        originalArchitect: r.original_architect,
        numListsAppeared: r.num_lists_appeared,
        logoUrl: r.logo_url,
        logoSource: r.logo_source,
        score: r.rank_score,
      }));

      return NextResponse.json({ results });
    } catch {
      // Ultimate fallback: basic Prisma ILIKE (works without any extensions)
      const courses = await prisma.course.findMany({
        where: {
          OR: [
            { courseName: { contains: q, mode: "insensitive" } },
            { facilityName: { contains: q, mode: "insensitive" } },
            { city: { contains: q, mode: "insensitive" } },
            { state: { contains: q, mode: "insensitive" } },
            { originalArchitect: { contains: q, mode: "insensitive" } },
          ],
        },
        select: {
          courseId: true,
          courseName: true,
          facilityName: true,
          city: true,
          state: true,
          country: true,
          originalArchitect: true,
          numListsAppeared: true,
          logoUrl: true,
          logoSource: true,
        },
        take: limit,
        orderBy: { numListsAppeared: "desc" },
      });

      return NextResponse.json({
        results: courses.map((c) => ({ ...c, score: 0 })),
      });
    }
  }
}
