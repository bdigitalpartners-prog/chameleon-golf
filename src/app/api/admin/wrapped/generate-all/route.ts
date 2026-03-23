import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";
import crypto from "crypto";

const PERSONALITY_TYPES = [
  "The Architecture Nerd", "The Value Hunter", "The Bucket Lister",
  "The Local Explorer", "The Data Junkie",
];
const REGIONS = ["Northeast", "Southeast", "Midwest", "Southwest", "Pacific", "Mountain West"];
const STYLES = ["Links", "Parkland", "Heathland", "Desert", "Mountain", "Coastal"];
const COURSES = [
  "Pine Valley Golf Club", "Augusta National Golf Club", "Pebble Beach Golf Links",
  "Cypress Point Club", "Shinnecock Hills Golf Club", "Merion Golf Club",
  "Sand Hills Golf Club", "Pacific Dunes", "Bandon Dunes", "Pinehurst No. 2",
];

export async function POST(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json().catch(() => ({}));
    const year = body.year || new Date().getFullYear();

    // Get all users
    const users = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id, name, email FROM users WHERE is_active = true OR is_active IS NULL LIMIT 500`
    );

    let generated = 0;
    for (const user of users) {
      const shuffled = [...COURSES].sort(() => 0.5 - Math.random());
      const data = {
        year,
        user_name: user.name || "Golfer",
        courses_viewed: Math.floor(Math.random() * 400) + 50,
        courses_rated: Math.floor(Math.random() * 30) + 3,
        courses_played: Math.floor(Math.random() * 40) + 5,
        conditions_reported: Math.floor(Math.random() * 15),
        top_region: REGIONS[Math.floor(Math.random() * REGIONS.length)],
        favorite_style: STYLES[Math.floor(Math.random() * STYLES.length)],
        favorite_architect: "Alister MacKenzie",
        eq_score_range_viewed: { min: 35, max: 95 },
        top_courses_viewed: shuffled.slice(0, 5),
        total_green_fees_estimated: Math.floor(Math.random() * 8000) + 1000,
        rounds_logged: Math.floor(Math.random() * 40) + 5,
        trips_planned: Math.floor(Math.random() * 6) + 1,
        concierge_queries: Math.floor(Math.random() * 30),
        comparisons_made: Math.floor(Math.random() * 20),
        personality_type: PERSONALITY_TYPES[Math.floor(Math.random() * PERSONALITY_TYPES.length)],
        fun_stats: {
          most_viewed_course: shuffled[0],
          earliest_morning_browse: "6:12 AM",
          total_time_on_platform_hours: Math.floor(Math.random() * 80) + 10,
        },
      };

      const shareToken = crypto.randomBytes(16).toString("hex");
      await prisma.$queryRawUnsafe(
        `INSERT INTO eq_wrapped (user_id, year, data, share_token, is_public, generated_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, false, NOW(), NOW(), NOW())
         ON CONFLICT (user_id, year)
         DO UPDATE SET data = $3, share_token = $4, generated_at = NOW(), updated_at = NOW()`,
        user.id,
        year,
        JSON.stringify(data),
        shareToken
      );
      generated++;
    }

    return NextResponse.json({ success: true, generated, year });
  } catch (error) {
    console.error("POST /api/admin/wrapped/generate-all error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
