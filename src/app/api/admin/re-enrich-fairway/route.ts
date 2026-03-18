import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const CONTENT_ITEMS = [
  {
    title: "Top 10 Jack Nicklaus Designs You Can Play",
    url: "https://linksmagazine.com/top-10-jack-nicklaus-designs-you-can-play/",
    sourceName: "LINKS Magazine",
    contentType: "article",
    isFeatured: true,
    summary: "Ranking and describing the top 10 playable Jack Nicklaus-designed golf courses",
    architects: ["Jack Nicklaus"],
  },
  {
    title: "Remembering Pete Dye: His Greatness Extended Far Beyond His Own Game-Changing Work",
    url: "https://golf.com/news/pete-dye-greatness-extended-beyond-game-changing-work/",
    sourceName: "GOLF Magazine",
    contentType: "article",
    isFeatured: false,
    summary: "Pete Dye's profound influence on golf architecture through world-class designs and mentorship",
    architects: ["Pete Dye"],
  },
  {
    title: "Alister MacKenzie's Finest Works",
    url: "https://linksmagazine.com/alister-mackenzies-finest-works/",
    sourceName: "LINKS Magazine",
    contentType: "article",
    isFeatured: true,
    summary: "MacKenzie's design philosophy, his 13 essential features, and masterpieces like Cypress Point and Augusta",
    architects: ["Alister MacKenzie"],
  },
  {
    title: "The House That Ross Built",
    url: "https://www.usopen.com/2024/articles/the-house-that-ross-built.html",
    sourceName: "USGA",
    contentType: "article",
    isFeatured: true,
    summary: "Donald Ross's journey from Royal Dornoch to creating his masterpiece at Pinehurst No. 2",
    architects: ["Donald Ross"],
  },
  {
    title: "The Templates: A.W. Tillinghast's Great Hazard",
    url: "https://www.thefriedegg.com/articles/great-hazard",
    sourceName: "The Fried Egg",
    contentType: "article",
    isFeatured: true,
    summary: "Tillinghast's original Great Hazard template hole and its influence across 12 iconic courses",
    architects: ["A.W. Tillinghast"],
  },
  {
    title: "Bill Coore and Ben Crenshaw: The Minimalist Masters",
    url: "https://www.thefriedegg.com/architects/bill-coore-and-ben-crenshaw",
    sourceName: "The Fried Egg",
    contentType: "article",
    isFeatured: true,
    summary: "How Sand Hills established Coore & Crenshaw's influential minimalist approach to golf design",
    architects: ["Bill Coore", "Ben Crenshaw"],
  },
  {
    title: "An Elevated Golf Experience: Tom Fazio's Top 10 Mountain Courses",
    url: "https://blog.championhills.com/an-elevated-golf-experience-tom-fazios-top-10-mountain-courses",
    sourceName: "Champion Hills",
    contentType: "article",
    isFeatured: false,
    summary: "Tom Fazio's top 10 mountain courses including Champion Hills, Wade Hampton, and Mountaintop",
    architects: ["Tom Fazio"],
  },
  {
    title: "The Next A-List Golf Architects",
    url: "https://linksmagazine.com/the-next-a-list-golf-architects/",
    sourceName: "LINKS Magazine",
    contentType: "article",
    isFeatured: false,
    summary: "Profiles of Beau Welling, Kyle Phillips, and Tripp Davis as emerging elite designers",
    architects: [],
  },
  {
    title: "Golf Course Architecture 101: Playability, Width, Options, Strategy",
    url: "https://www.thefriedegg.com/articles/golf-course-architecture-101-part-1-playability-width-options-strategy",
    sourceName: "The Fried Egg",
    contentType: "article",
    isFeatured: false,
    summary: "Core strategic design principles covering playability, width, and risk-reward decisions",
    architects: ["Tom Doak", "Alister MacKenzie"],
  },
  {
    title: "Why Pinehurst No. 2 is America's Most Important Golf Course",
    url: "https://www.youtube.com/watch?v=Px8Hs_t6-yI",
    sourceName: "YouTube",
    contentType: "video",
    isFeatured: true,
    duration: "22:15",
    summary: "Deep dive into why Pinehurst No. 2 stands as America's most significant golf course",
    architects: ["Donald Ross"],
  },
  {
    title: "The History of Augusta National Golf Club",
    url: "https://www.youtube.com/watch?v=qGx2DGmXfMk",
    sourceName: "YouTube",
    contentType: "video",
    isFeatured: true,
    duration: "18:42",
    summary: "Comprehensive history of Augusta National's design and evolution",
    architects: ["Alister MacKenzie"],
  },
  {
    title: "TPC Sawgrass: The Island Green and Pete Dye's Vision",
    url: "https://www.youtube.com/watch?v=DZdQWzSXLkE",
    sourceName: "YouTube",
    contentType: "video",
    isFeatured: false,
    duration: "14:30",
    summary: "The story behind TPC Sawgrass and Pete Dye's revolutionary island green",
    architects: ["Pete Dye"],
  },
  {
    title: "Exploring America's Next GREAT Golf Destination: Rodeo Dunes",
    url: "https://youtu.be/DE7Jv57Gx8I?si=3zcMMi-wTMfH5qCi",
    sourceName: "YouTube",
    contentType: "video",
    isFeatured: false,
    summary: "Tour of the Rodeo Dunes golf destination showcasing modern golf architecture",
    architects: [],
  },
  {
    title: "The Architecture of Oakmont Country Club | 2025 U.S. Open Preview",
    url: "https://www.youtube.com/watch?v=FSCP7NUcYII",
    sourceName: "Fried Egg Golf",
    contentType: "video",
    isFeatured: true,
    summary: "Documentary deep-dive into Oakmont's architecture, history, and Gil Hanse restoration",
    architects: ["Gil Hanse"],
    publishedAt: "2025-05-01",
  },
  {
    title: "Every Hole at Sand Hills Golf Club",
    url: "https://www.youtube.com/watch?v=vHtj_2DRaBw",
    sourceName: "Golf Digest",
    contentType: "video",
    isFeatured: false,
    summary: "Flyover tour of every hole at Sand Hills, the minimalist masterpiece in Nebraska",
    architects: ["Bill Coore", "Ben Crenshaw"],
  },
  {
    title: "Golf Architecture 101: The Golden Age",
    url: "https://www.youtube.com/watch?v=CLWvZI3sqMs",
    sourceName: "Fried Egg Golf",
    contentType: "video",
    isFeatured: false,
    summary: "The three big ideas that sparked the Golden Age of golf architecture",
    architects: ["Alister MacKenzie", "Donald Ross", "A.W. Tillinghast"],
    publishedAt: "2025-12-01",
  },
  {
    title: "Yolk with Doak: Complete Episode Archive",
    url: "https://www.thefriedegg.com/articles/fried-egg-golf-podcast-yolk-tom-doak",
    sourceName: "The Fried Egg",
    contentType: "podcast",
    isFeatured: true,
    duration: "46 episodes",
    summary: "All 46 episodes of the Yolk with Doak series covering strategic golf design topics",
    architects: ["Tom Doak"],
  },
  {
    title: "Gil Hanse: Career, Golden Age Architecture & the Olympic Course",
    url: "https://www.thefriedegg.com/podcasts/gil-hanse---part-1",
    sourceName: "The Fried Egg",
    contentType: "podcast",
    isFeatured: false,
    summary: "Gil Hanse discusses his career, golden age architecture, and designing the Olympic Course in Rio",
    architects: ["Gil Hanse"],
  },
  {
    title: "Deep Dive: Royal Portrush",
    url: "https://www.youtube.com/watch?v=6DLxXJb0Ltk",
    sourceName: "Fried Egg Golf",
    contentType: "video",
    isFeatured: false,
    summary: "In-depth analysis of the Dunluce Links at Royal Portrush — premier links architecture",
    architects: [],
    publishedAt: "2025-07-01",
  },
  {
    title: "NLU Film Room: Great Dunes at Jekyll Island",
    url: "https://www.youtube.com/watch?v=bBz0YoOnBC4",
    sourceName: "No Laying Up",
    contentType: "video",
    isFeatured: false,
    summary: "Play and analysis of the reimagined Great Dunes course, originally designed by Walter Travis in 1927",
    architects: [],
    publishedAt: "2025-12-01",
  },
  {
    title: "Golfweek's Best: How We Rank Courses",
    url: "https://sports.yahoo.com/golfweek-best-rank-courses-score-120039327.html",
    sourceName: "Golfweek",
    contentType: "article",
    isFeatured: false,
    summary: "Golfweek's 10 criteria for rating golf courses, used by 800+ reviewers for design-focused rankings",
    architects: [],
  },
  {
    title: "Best New Golf Courses and Renovations of 2025",
    url: "https://www.si.com/golf/best-new-golf-courses-renovations-2025",
    sourceName: "Sports Illustrated",
    contentType: "article",
    isFeatured: false,
    summary: "Top new courses and renovations of 2025 with architectural analysis and standout holes",
    architects: [],
    publishedAt: "2025-12-01",
  },
  {
    title: "2024 Golf Course Awards: Best Renovations, Restorations & New Courses",
    url: "https://www.si.com/golf/2024-golf-course-awards-best-renovations-restorations-new-courses",
    sourceName: "Sports Illustrated",
    contentType: "article",
    isFeatured: false,
    summary: "Top 10 new and renovated courses of 2024 with deep dives into design strategies",
    architects: ["Gil Hanse"],
    publishedAt: "2024-12-01",
  },
];

export async function POST(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    // Collect all unique architect names from the content items
    const allArchitectNames = [
      ...new Set(CONTENT_ITEMS.flatMap((item) => item.architects)),
    ];

    // Look up architects by name (case-insensitive)
    const architectRecords = await prisma.architect.findMany({
      where: {
        OR: allArchitectNames.map((name) => ({
          name: { contains: name, mode: "insensitive" as const },
        })),
      },
      select: { id: true, name: true },
    });

    // Build a name -> id map (case-insensitive)
    const architectMap = new Map<string, number>();
    for (const arch of architectRecords) {
      architectMap.set(arch.name.toLowerCase(), arch.id);
    }

    // Delete all existing external content (cascade deletes links)
    await prisma.externalContent.deleteMany({});

    const now = new Date();
    const created: any[] = [];

    for (const item of CONTENT_ITEMS) {
      const { architects: architectNames, publishedAt, ...contentData } = item as any;

      const content = await prisma.externalContent.create({
        data: {
          ...contentData,
          isApproved: true,
          linkStatus: "ok",
          lastCheckedAt: now,
          publishedAt: publishedAt ? new Date(publishedAt) : null,
          tags: [],
        },
      });

      // Link architects
      const architectIds: number[] = [];
      for (const name of architectNames) {
        const id = architectMap.get(name.toLowerCase());
        if (id) architectIds.push(id);
      }

      if (architectIds.length > 0) {
        await prisma.contentArchitectLink.createMany({
          data: architectIds.map((architectId) => ({
            contentId: content.id,
            architectId,
            relevance: "primary",
          })),
        });
      }

      created.push({ id: content.id, title: content.title, architects: architectIds.length });
    }

    return NextResponse.json({
      success: true,
      message: `Re-enriched Fairway with ${created.length} content items`,
      items: created,
      architectsFound: architectRecords.map((a) => a.name),
    });
  } catch (err: any) {
    console.error("Re-enrich fairway error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
