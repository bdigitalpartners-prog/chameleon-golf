import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import crypto from "crypto";

const PERSONALITY_TYPES = [
  "The Architecture Nerd",
  "The Value Hunter",
  "The Bucket Lister",
  "The Local Explorer",
  "The Data Junkie",
];

const REGIONS = ["Northeast", "Southeast", "Midwest", "Southwest", "Pacific", "Mountain West", "Mid-Atlantic", "UK & Ireland", "Scotland"];
const STYLES = ["Links", "Parkland", "Heathland", "Desert", "Mountain", "Coastal", "Prairie"];
const TOP_COURSES = [
  "Pine Valley Golf Club", "Augusta National Golf Club", "Pebble Beach Golf Links",
  "Cypress Point Club", "Shinnecock Hills Golf Club", "Merion Golf Club",
  "National Golf Links of America", "Oakmont Country Club", "Sand Hills Golf Club",
  "Pacific Dunes", "Bandon Dunes", "Whistling Straits", "Pinehurst No. 2",
  "Kiawah Island (Ocean Course)", "TPC Sawgrass (Stadium)",
];

function generateDemoWrapped(year: number, userName: string) {
  const coursesViewed = Math.floor(Math.random() * 400) + 50;
  const coursesRated = Math.floor(Math.random() * 30) + 3;
  const coursesPlayed = Math.floor(Math.random() * 40) + 5;

  // Pick random top 5 courses
  const shuffled = [...TOP_COURSES].sort(() => 0.5 - Math.random());
  const topCoursesViewed = shuffled.slice(0, 5);

  // Pick random architect
  const architects = [
    "Alister MacKenzie", "Pete Dye", "Tom Doak", "Donald Ross",
    "C.B. Macdonald", "Seth Raynor", "Tom Fazio", "Jack Nicklaus",
    "Robert Trent Jones Sr.", "Bill Coore & Ben Crenshaw",
  ];

  const hours = [5, 6, 7].map((h) => `${h}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")} AM`);

  return {
    year,
    user_name: userName,
    courses_viewed: coursesViewed,
    courses_rated: coursesRated,
    courses_played: coursesPlayed,
    conditions_reported: Math.floor(Math.random() * 15),
    top_region: REGIONS[Math.floor(Math.random() * REGIONS.length)],
    favorite_style: STYLES[Math.floor(Math.random() * STYLES.length)],
    favorite_architect: architects[Math.floor(Math.random() * architects.length)],
    eq_score_range_viewed: {
      min: Math.floor(Math.random() * 30) + 30,
      max: Math.floor(Math.random() * 20) + 80,
    },
    top_courses_viewed: topCoursesViewed,
    total_green_fees_estimated: Math.floor(Math.random() * 8000) + 1000,
    rounds_logged: coursesPlayed,
    trips_planned: Math.floor(Math.random() * 6) + 1,
    concierge_queries: Math.floor(Math.random() * 30),
    comparisons_made: Math.floor(Math.random() * 20),
    personality_type: PERSONALITY_TYPES[Math.floor(Math.random() * PERSONALITY_TYPES.length)],
    fun_stats: {
      most_viewed_course: topCoursesViewed[0],
      earliest_morning_browse: hours[Math.floor(Math.random() * hours.length)],
      total_time_on_platform_hours: Math.floor(Math.random() * 80) + 10,
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt((session.user as any).id, 10);
    const userName = session.user?.name || "Golfer";
    const body = await request.json().catch(() => ({}));
    const year = body.year || new Date().getFullYear();
    const demo = body.demo !== false; // Default to demo mode

    let wrappedData;
    if (demo) {
      wrappedData = generateDemoWrapped(year, userName);
    } else {
      // Real generation would query user activity tables
      // For now, fall back to demo
      wrappedData = generateDemoWrapped(year, userName);
    }

    const shareToken = crypto.randomBytes(16).toString("hex");

    // Upsert wrapped data
    await prisma.$queryRawUnsafe(
      `INSERT INTO eq_wrapped (user_id, year, data, share_token, is_public, generated_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, false, NOW(), NOW(), NOW())
       ON CONFLICT (user_id, year)
       DO UPDATE SET data = $3, share_token = $4, generated_at = NOW(), updated_at = NOW()`,
      userId,
      year,
      JSON.stringify(wrappedData),
      shareToken
    );

    return NextResponse.json({
      success: true,
      year,
      data: wrappedData,
      share_token: shareToken,
    });
  } catch (error) {
    console.error("POST /api/wrapped/generate error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
