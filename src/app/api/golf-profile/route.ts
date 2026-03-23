import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const profiles = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM user_golf_profile WHERE user_id = $1 LIMIT 1`,
      parseInt(userId)
    );

    if (profiles.length === 0) {
      return NextResponse.json({ profile: null });
    }

    const profile = profiles[0];
    return NextResponse.json({
      profile: {
        ...profile,
        preferred_style: profile.preferred_style ? JSON.parse(profile.preferred_style) : [],
        values_most: profile.values_most ? JSON.parse(profile.values_most) : [],
      },
    });
  } catch (err) {
    console.error("Error fetching golf profile:", err);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = parseInt((session.user as any).id);

  let body: {
    handicap_range?: string;
    preferred_style?: string[];
    preferred_terrain?: string;
    walking_preference?: string;
    budget_range?: string;
    values_most?: string[];
    travel_radius_miles?: number;
    home_latitude?: number;
    home_longitude?: number;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const preferredStyle = body.preferred_style ? JSON.stringify(body.preferred_style) : null;
    const valuesMost = body.values_most ? JSON.stringify(body.values_most) : null;

    await prisma.$queryRawUnsafe(
      `INSERT INTO user_golf_profile (user_id, handicap_range, preferred_style, preferred_terrain, walking_preference, budget_range, values_most, travel_radius_miles, home_latitude, home_longitude, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         handicap_range = EXCLUDED.handicap_range,
         preferred_style = EXCLUDED.preferred_style,
         preferred_terrain = EXCLUDED.preferred_terrain,
         walking_preference = EXCLUDED.walking_preference,
         budget_range = EXCLUDED.budget_range,
         values_most = EXCLUDED.values_most,
         travel_radius_miles = EXCLUDED.travel_radius_miles,
         home_latitude = EXCLUDED.home_latitude,
         home_longitude = EXCLUDED.home_longitude,
         updated_at = NOW()`,
      userId,
      body.handicap_range || null,
      preferredStyle,
      body.preferred_terrain || null,
      body.walking_preference || null,
      body.budget_range || null,
      valuesMost,
      body.travel_radius_miles || null,
      body.home_latitude || null,
      body.home_longitude || null
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error saving golf profile:", err);
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }
}
