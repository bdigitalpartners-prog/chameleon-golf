import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const SEED_SOURCES = [
  { name: "The Fried Egg", feedUrl: "https://www.thefriedegg.com/feed", websiteUrl: "https://www.thefriedegg.com", contentTypes: ["article", "podcast"] },
  { name: "No Laying Up", feedUrl: "https://nolayingup.com/feed", websiteUrl: "https://nolayingup.com", contentTypes: ["article", "video", "podcast"] },
  { name: "Golf Digest", feedUrl: "https://www.golfdigest.com/feed/rss", websiteUrl: "https://www.golfdigest.com", contentTypes: ["article"] },
  { name: "LINKS Magazine", feedUrl: "https://linksmagazine.com/feed/", websiteUrl: "https://linksmagazine.com", contentTypes: ["article"] },
  { name: "Golfweek", feedUrl: "https://golfweek.usatoday.com/feed/", websiteUrl: "https://golfweek.usatoday.com", contentTypes: ["article"] },
  { name: "Sports Illustrated Golf", feedUrl: "https://www.si.com/golf/rss", websiteUrl: "https://www.si.com/golf", contentTypes: ["article"] },
  { name: "Fried Egg Golf (YouTube)", feedUrl: "https://www.youtube.com/feeds/videos.xml?channel_id=UCaW3GIFbeDSgMaRyBQ1YsXA", websiteUrl: "https://www.youtube.com/@FriedEggGolf", contentTypes: ["video"] },
  { name: "No Laying Up (YouTube)", feedUrl: "https://www.youtube.com/feeds/videos.xml?channel_id=UC4qlKzMTiGPiYmCiETM3Edg", websiteUrl: "https://www.youtube.com/@NoLayingUp", contentTypes: ["video"] },
  { name: "Golf Digest (YouTube)", feedUrl: "https://www.youtube.com/feeds/videos.xml?channel_id=UCfbLDMh6uGOZePAfqqjVZ-g", websiteUrl: "https://www.youtube.com/@GolfDigest", contentTypes: ["video"] },
  { name: "GOLF Magazine", feedUrl: "https://golf.com/feed/", websiteUrl: "https://golf.com", contentTypes: ["article"] },
];

export async function POST(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    let created = 0;
    let skipped = 0;

    for (const source of SEED_SOURCES) {
      const existing = await prisma.contentSource.findFirst({
        where: { name: source.name },
      });
      if (existing) {
        skipped++;
        continue;
      }
      await prisma.contentSource.create({ data: source });
      created++;
    }

    return NextResponse.json({ success: true, created, skipped, total: SEED_SOURCES.length });
  } catch (err: any) {
    console.error("Seed content sources error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
