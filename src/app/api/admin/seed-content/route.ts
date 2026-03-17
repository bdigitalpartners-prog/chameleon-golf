import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface ContentSeed {
  contentType: string;
  title: string;
  url: string;
  thumbnailUrl?: string;
  summary?: string;
  sourceName: string;
  authorName?: string;
  publishedAt?: Date;
  duration?: string;
  isApproved: boolean;
  isFeatured: boolean;
  architectNames?: string[];
}

interface BookSeed {
  title: string;
  authors: string[];
  yearPublished?: number;
  description?: string;
  amazonUrl?: string;
  architectNames?: string[];
}

const contentSeeds: ContentSeed[] = [
  {
    contentType: "article",
    title: "The Legacy of A.W. Tillinghast: America's Greatest Golf Course Architect",
    url: "https://www.golfdigest.com/story/the-legacy-of-a-w-tillinghast",
    summary: "An in-depth look at A.W. Tillinghast's contributions to golf course design, including his work at Bethpage Black, Winged Foot, and Baltusrol.",
    sourceName: "Golf Digest",
    authorName: "Ron Whitten",
    publishedAt: new Date("2023-06-15"),
    isApproved: true,
    isFeatured: true,
    architectNames: ["A.W. Tillinghast"],
  },
  {
    contentType: "article",
    title: "Alister MacKenzie: The Doctor of Golf Course Design",
    url: "https://www.linksmagazine.com/alister-mackenzie-the-doctor-of-golf-course-design/",
    summary: "How a physician from Yorkshire became one of the most influential golf architects in history.",
    sourceName: "LINKS Magazine",
    authorName: "David DeSmith",
    publishedAt: new Date("2022-11-20"),
    isApproved: true,
    isFeatured: true,
    architectNames: ["Alister MacKenzie"],
  },
  {
    contentType: "article",
    title: "Pete Dye's Lasting Impact on Modern Golf Architecture",
    url: "https://www.golfchannel.com/article/golf-central-blog/pete-dyes-lasting-impact-modern-golf",
    summary: "From TPC Sawgrass to Whistling Straits, Pete Dye revolutionized how courses challenge golfers.",
    sourceName: "Golf Channel",
    publishedAt: new Date("2023-01-10"),
    isApproved: true,
    isFeatured: false,
    architectNames: ["Pete Dye"],
  },
  {
    contentType: "article",
    title: "Donald Ross: From Dornoch to Pinehurst",
    url: "https://www.golfdigest.com/story/donald-ross-from-dornoch-to-pinehurst",
    summary: "The remarkable journey of Donald Ross from Scotland to becoming America's most prolific golf architect.",
    sourceName: "Golf Digest",
    authorName: "Bradley Klein",
    publishedAt: new Date("2023-04-05"),
    isApproved: true,
    isFeatured: true,
    architectNames: ["Donald Ross"],
  },
  {
    contentType: "article",
    title: "The Genius of Tom Fazio's Mountain Courses",
    url: "https://www.golfweek.com/features/the-genius-of-tom-fazios-mountain-courses",
    summary: "How Tom Fazio mastered the art of building championship-caliber courses in the mountains.",
    sourceName: "Golfweek",
    publishedAt: new Date("2023-03-18"),
    isApproved: true,
    isFeatured: false,
    architectNames: ["Tom Fazio"],
  },
  {
    contentType: "article",
    title: "Jack Nicklaus: From Player to Designer — His Top 10 Courses",
    url: "https://www.golf.com/news/features/jack-nicklaus-top-10-golf-course-designs/",
    summary: "The Golden Bear's journey from dominating tournaments to creating over 400 courses worldwide.",
    sourceName: "GOLF Magazine",
    publishedAt: new Date("2023-08-22"),
    isApproved: true,
    isFeatured: true,
    architectNames: ["Jack Nicklaus"],
  },
  {
    contentType: "article",
    title: "Coore & Crenshaw: The Minimalist Masters of Modern Golf",
    url: "https://www.golfdigest.com/story/coore-crenshaw-minimalist-masters",
    summary: "Their philosophy of working with the land has produced some of the 21st century's most acclaimed courses.",
    sourceName: "Golf Digest",
    authorName: "Derek Duncan",
    publishedAt: new Date("2023-09-30"),
    isApproved: true,
    isFeatured: true,
    architectNames: ["Bill Coore", "Ben Crenshaw", "Coore & Crenshaw"],
  },
  {
    contentType: "video",
    title: "The History of Augusta National Golf Club",
    url: "https://www.youtube.com/watch?v=qGx2DGmXfMk",
    thumbnailUrl: "https://img.youtube.com/vi/qGx2DGmXfMk/maxresdefault.jpg",
    summary: "How Alister MacKenzie and Bobby Jones created the most famous golf course in the world.",
    sourceName: "YouTube",
    duration: "18:42",
    publishedAt: new Date("2023-04-01"),
    isApproved: true,
    isFeatured: true,
    architectNames: ["Alister MacKenzie"],
  },
  {
    contentType: "video",
    title: "TPC Sawgrass: The Island Green and Pete Dye's Vision",
    url: "https://www.youtube.com/watch?v=DZdQWzSXLkE",
    thumbnailUrl: "https://img.youtube.com/vi/DZdQWzSXLkE/maxresdefault.jpg",
    summary: "Behind the design of the world's most iconic par-3.",
    sourceName: "YouTube",
    duration: "14:30",
    publishedAt: new Date("2023-03-15"),
    isApproved: true,
    isFeatured: false,
    architectNames: ["Pete Dye"],
  },
  {
    contentType: "video",
    title: "Why Pinehurst No. 2 is America's Most Important Golf Course",
    url: "https://www.youtube.com/watch?v=Px8Hs_t6-yI",
    thumbnailUrl: "https://img.youtube.com/vi/Px8Hs_t6-yI/maxresdefault.jpg",
    summary: "Exploring Donald Ross's masterpiece and why it continues to host golf's biggest events.",
    sourceName: "YouTube",
    duration: "22:15",
    publishedAt: new Date("2024-01-20"),
    isApproved: true,
    isFeatured: true,
    architectNames: ["Donald Ross"],
  },
  {
    contentType: "podcast",
    title: "The Evolution of Golf Course Design with Gil Hanse",
    url: "https://podcasts.apple.com/us/podcast/the-fried-egg/id1067279883",
    summary: "Gil Hanse discusses his design philosophy, the Olympic Course in Rio, and what makes a truly great golf hole.",
    sourceName: "The Fried Egg Podcast",
    duration: "1:12:00",
    publishedAt: new Date("2023-07-15"),
    isApproved: true,
    isFeatured: false,
    architectNames: ["Gil Hanse"],
  },
  {
    contentType: "podcast",
    title: "Tom Doak on Strategic Golf Design",
    url: "https://podcasts.apple.com/us/podcast/the-fried-egg-tom-doak",
    summary: "The acclaimed architect shares thoughts on width vs. length and his favorite courses worldwide.",
    sourceName: "The Fried Egg Podcast",
    duration: "1:05:00",
    publishedAt: new Date("2023-10-22"),
    isApproved: true,
    isFeatured: true,
    architectNames: ["Tom Doak"],
  },
];

const bookSeeds: BookSeed[] = [
  {
    title: "The Spirit of St. Andrews",
    authors: ["Alister MacKenzie"],
    yearPublished: 1995,
    description: "MacKenzie's classic treatise on golf course design, originally written in 1934.",
    amazonUrl: "https://www.amazon.com/Spirit-St-Andrews-Alister-MacKenzie/dp/1886947007",
    architectNames: ["Alister MacKenzie"],
  },
  {
    title: "The Anatomy of a Golf Course",
    authors: ["Tom Doak"],
    yearPublished: 1992,
    description: "A groundbreaking guide to golf course architecture that demystifies how courses are designed.",
    amazonUrl: "https://www.amazon.com/Anatomy-Golf-Course-Tom-Doak/dp/1580800076",
    architectNames: ["Tom Doak"],
  },
  {
    title: "Bury Me in a Pot Bunker",
    authors: ["Pete Dye", "Mark Shaw"],
    yearPublished: 1995,
    description: "Pete Dye's autobiography detailing his unconventional path to becoming golf's most innovative architect.",
    amazonUrl: "https://www.amazon.com/Bury-Pot-Bunker-Pete-Dye/dp/0201407647",
    architectNames: ["Pete Dye"],
  },
  {
    title: "Golf Has Never Failed Me",
    authors: ["Donald Ross"],
    yearPublished: 1996,
    description: "The reflections and design philosophy of Donald Ross.",
    amazonUrl: "https://www.amazon.com/Golf-Has-Never-Failed-Me/dp/1886947015",
    architectNames: ["Donald Ross"],
  },
  {
    title: "The Confidential Guide to Golf Courses",
    authors: ["Tom Doak"],
    yearPublished: 2014,
    description: "Tom Doak's opinionated ratings and reviews of courses around the world.",
    amazonUrl: "https://www.amazon.com/Confidential-Guide-Golf-Courses-Vol/dp/0615883877",
    architectNames: ["Tom Doak"],
  },
  {
    title: "Golf Architecture in America",
    authors: ["George C. Thomas Jr."],
    yearPublished: 1927,
    description: "One of the earliest and most influential texts on golf course architecture.",
    amazonUrl: "https://www.amazon.com/Golf-Architecture-America-George-Thomas/dp/1566199999",
    architectNames: ["George C. Thomas Jr."],
  },
  {
    title: "A Good Walk Spoiled",
    authors: ["John Feinstein"],
    yearPublished: 1995,
    description: "A deep dive into the PGA Tour — the courses, the pressure, and the human stories.",
    amazonUrl: "https://www.amazon.com/Good-Walk-Spoiled-Through-Money/dp/0316277371",
    architectNames: [],
  },
];

export async function POST(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const architects = await prisma.architect.findMany({
      select: { id: true, name: true },
    });
    const architectByName = new Map<string, number>();
    for (const a of architects) {
      architectByName.set(a.name.toLowerCase(), a.id);
    }

    const results = { contentCreated: 0, contentSkipped: 0, booksCreated: 0, booksSkipped: 0, errors: [] as string[] };

    // Seed content
    for (const seed of contentSeeds) {
      const { architectNames, ...data } = seed;
      const architectIds: number[] = [];
      for (const name of architectNames ?? []) {
        const id = architectByName.get(name.toLowerCase());
        if (id) architectIds.push(id);
      }

      const existing = await prisma.externalContent.findFirst({ where: { url: data.url } });
      if (existing) { results.contentSkipped++; continue; }

      try {
        await prisma.externalContent.create({
          data: {
            ...data,
            architects: architectIds.length
              ? { create: architectIds.map((id) => ({ architectId: id, relevance: "primary" })) }
              : undefined,
          },
        });
        results.contentCreated++;
      } catch (err: any) {
        results.errors.push(`Content "${data.title}": ${err.message}`);
      }
    }

    // Seed books
    for (const seed of bookSeeds) {
      const { architectNames, ...data } = seed;
      const architectIds: number[] = [];
      for (const name of architectNames ?? []) {
        const id = architectByName.get(name.toLowerCase());
        if (id) architectIds.push(id);
      }

      const existing = await prisma.book.findFirst({ where: { title: data.title } });
      if (existing) { results.booksSkipped++; continue; }

      try {
        await prisma.book.create({
          data: {
            ...data,
            architects: architectIds.length
              ? { create: architectIds.map((id) => ({ architectId: id })) }
              : undefined,
          },
        });
        results.booksCreated++;
      } catch (err: any) {
        results.errors.push(`Book "${data.title}": ${err.message}`);
      }
    }

    return NextResponse.json(results);
  } catch (err: any) {
    console.error("Seed content error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
