import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface PopularRow {
  course_id: number;
  course_name: string;
  city: string | null;
  state: string | null;
  chameleon_score: number | null;
  primary_image_url: string | null;
}

// Curated popular comparison pairs with real course data
const POPULAR_COMPARISONS = [
  {
    label: "The Big 3: Augusta vs Pine Valley vs Cypress Point",
    description: "Three of the most exclusive and storied courses in golf",
    courseNames: ["Augusta National Golf Club", "Pine Valley Golf Club", "Cypress Point Club"],
  },
  {
    label: "Public Dream: Pebble Beach vs Pinehurst No. 2",
    description: "Two of America's finest public-access courses",
    courseNames: ["Pebble Beach Golf Links", "Pinehurst No. 2"],
  },
  {
    label: "Links Legends: St Andrews vs Royal County Down",
    description: "Classic links golf on both sides of the Irish Sea",
    courseNames: ["St Andrews Links (Old Course)", "Royal County Down Golf Club"],
  },
  {
    label: "Desert Duel: TPC Scottsdale vs Troon North",
    description: "Arizona's premier desert golf experiences",
    courseNames: ["TPC Scottsdale (Stadium Course)", "Troon North Golf Club"],
  },
  {
    label: "Carolina Showdown: Kiawah Ocean vs Pinehurst",
    description: "East Coast championship caliber courses",
    courseNames: ["Kiawah Island Golf Resort (Ocean Course)", "Pinehurst No. 2"],
  },
  {
    label: "Oregon Coast: Bandon Dunes vs Pacific Dunes",
    description: "Sister courses in the Pacific Northwest wilderness",
    courseNames: ["Bandon Dunes", "Pacific Dunes"],
  },
];

export async function GET(_req: NextRequest) {
  try {
    // Look up actual course IDs for the popular comparisons
    const allNames = POPULAR_COMPARISONS.flatMap((p) => p.courseNames);

    const courses = await prisma.$queryRawUnsafe<PopularRow[]>(
      `
      SELECT
        c.course_id,
        c.course_name,
        c.city,
        c.state,
        cs.chameleon_score,
        (SELECT cm.image_url FROM course_media cm WHERE cm.course_id = c.course_id AND cm.is_primary = true LIMIT 1) as primary_image_url
      FROM courses c
      LEFT JOIN chameleon_scores cs ON cs.course_id = c.course_id
      WHERE c.course_name = ANY($1)
      `,
      allNames
    );

    const courseMap = new Map(courses.map((c) => [c.course_name, c]));

    const popular = POPULAR_COMPARISONS.map((p) => {
      const matched = p.courseNames
        .map((name) => {
          const c = courseMap.get(name);
          if (!c) return null;
          return {
            courseId: Number(c.course_id),
            courseName: c.course_name,
            city: c.city,
            state: c.state,
            chameleonScore: c.chameleon_score ? Number(c.chameleon_score) : null,
            primaryImageUrl: c.primary_image_url,
          };
        })
        .filter(Boolean);

      return {
        label: p.label,
        description: p.description,
        ids: matched.map((c) => c!.courseId),
        courses: matched,
      };
    }).filter((p) => p.ids.length >= 2);

    return NextResponse.json({ comparisons: popular });
  } catch (error: any) {
    console.error("GET /api/compare/popular error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
