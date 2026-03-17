/**
 * Seed initial external content (articles, videos) linked to architects and courses.
 * Run with: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/seed-content.ts
 * Or: npx tsx scripts/seed-content.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
  // Match by architect name or course name
  architectNames?: string[];
  courseNames?: string[];
}

const contentSeeds: ContentSeed[] = [
  // --- ARCHITECT-FOCUSED ARTICLES ---
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
    summary: "How a physician from Yorkshire became one of the most influential golf architects in history, creating masterpieces like Augusta National and Cypress Point.",
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
    summary: "From the Stadium Course at TPC Sawgrass to Whistling Straits, Pete Dye revolutionized how courses challenge and entertain golfers.",
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
    summary: "The remarkable journey of Donald Ross from Scotland to becoming America's most prolific and beloved golf course architect.",
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
    summary: "How Tom Fazio mastered the art of building championship-caliber courses in the mountains of the American Southeast.",
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
    summary: "The Golden Bear's journey from dominating tournaments to creating over 400 golf courses worldwide.",
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
    summary: "Bill Coore and Ben Crenshaw's philosophy of working with the land has produced some of the 21st century's most acclaimed courses.",
    sourceName: "Golf Digest",
    authorName: "Derek Duncan",
    publishedAt: new Date("2023-09-30"),
    isApproved: true,
    isFeatured: true,
    architectNames: ["Bill Coore", "Ben Crenshaw", "Coore & Crenshaw"],
  },

  // --- VIDEO CONTENT ---
  {
    contentType: "video",
    title: "The History of Augusta National Golf Club",
    url: "https://www.youtube.com/watch?v=qGx2DGmXfMk",
    thumbnailUrl: "https://img.youtube.com/vi/qGx2DGmXfMk/maxresdefault.jpg",
    summary: "A comprehensive look at how Alister MacKenzie and Bobby Jones created the most famous golf course in the world.",
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
    summary: "Behind the design of the world's most iconic par-3 and the revolutionary course that changed tournament golf.",
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
    summary: "Exploring Donald Ross's masterpiece and why it continues to host the biggest events in golf.",
    sourceName: "YouTube",
    duration: "22:15",
    publishedAt: new Date("2024-01-20"),
    isApproved: true,
    isFeatured: true,
    architectNames: ["Donald Ross"],
  },

  // --- PODCAST CONTENT ---
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
    url: "https://podcasts.apple.com/us/podcast/the-fried-egg/id1067279883",
    summary: "The acclaimed architect shares his thoughts on width vs. length, the Confidential Guide, and his favorite courses around the world.",
    sourceName: "The Fried Egg Podcast",
    duration: "1:05:00",
    publishedAt: new Date("2023-10-22"),
    isApproved: true,
    isFeatured: true,
    architectNames: ["Tom Doak"],
  },
];

interface BookSeed {
  title: string;
  authors: string[];
  isbn?: string;
  coverImageUrl?: string;
  yearPublished?: number;
  description?: string;
  amazonUrl?: string;
  bookshopUrl?: string;
  architectNames?: string[];
}

const bookSeeds: BookSeed[] = [
  {
    title: "The Spirit of St. Andrews",
    authors: ["Alister MacKenzie"],
    yearPublished: 1995,
    description: "MacKenzie's classic treatise on golf course design, originally written in 1934, covering his design principles and philosophy.",
    amazonUrl: "https://www.amazon.com/Spirit-St-Andrews-Alister-MacKenzie/dp/1886947007",
    architectNames: ["Alister MacKenzie"],
  },
  {
    title: "The Anatomy of a Golf Course",
    authors: ["Tom Doak"],
    yearPublished: 1992,
    description: "A groundbreaking guide to golf course architecture that demystifies how courses are designed and built.",
    amazonUrl: "https://www.amazon.com/Anatomy-Golf-Course-Tom-Doak/dp/1580800076",
    architectNames: ["Tom Doak"],
  },
  {
    title: "Bury Me in a Pot Bunker",
    authors: ["Pete Dye", "Mark Shaw"],
    yearPublished: 1995,
    description: "Pete Dye's autobiography detailing his unconventional path from insurance salesman to one of golf's most innovative architects.",
    amazonUrl: "https://www.amazon.com/Bury-Pot-Bunker-Pete-Dye/dp/0201407647",
    architectNames: ["Pete Dye"],
  },
  {
    title: "Golf Architecture in America",
    authors: ["George C. Thomas Jr."],
    yearPublished: 1927,
    description: "One of the earliest and most influential texts on golf course architecture, with detailed analysis of design principles.",
    amazonUrl: "https://www.amazon.com/Golf-Architecture-America-George-Thomas/dp/1566199999",
    architectNames: ["George C. Thomas Jr."],
  },
  {
    title: "The Confidential Guide to Golf Courses",
    authors: ["Tom Doak"],
    yearPublished: 2014,
    description: "Tom Doak's opinionated ratings and reviews of golf courses around the world, now in its expanded multi-volume edition.",
    amazonUrl: "https://www.amazon.com/Confidential-Guide-Golf-Courses-Vol/dp/0615883877",
    architectNames: ["Tom Doak"],
  },
  {
    title: "A Good Walk Spoiled",
    authors: ["John Feinstein"],
    yearPublished: 1995,
    description: "A deep dive into the PGA Tour, featuring the courses, the pressure, and the human stories behind professional golf.",
    amazonUrl: "https://www.amazon.com/Good-Walk-Spoiled-Through-Money/dp/0316277371",
    architectNames: [],
  },
  {
    title: "Golf Has Never Failed Me",
    authors: ["Donald Ross"],
    yearPublished: 1996,
    description: "The reflections and design philosophy of Donald Ross, one of the most celebrated architects in golf history.",
    amazonUrl: "https://www.amazon.com/Golf-Has-Never-Failed-Me/dp/1886947015",
    architectNames: ["Donald Ross"],
  },
];

async function main() {
  console.log("Seeding external content...");

  // Get architect lookup map
  const architects = await prisma.architect.findMany({
    select: { id: true, name: true },
  });
  const architectByName = new Map<string, number>();
  for (const a of architects) {
    architectByName.set(a.name.toLowerCase(), a.id);
  }

  let contentCreated = 0;
  for (const seed of contentSeeds) {
    const { architectNames, courseNames, ...data } = seed;

    // Find architect IDs
    const architectIds: number[] = [];
    for (const name of architectNames ?? []) {
      const id = architectByName.get(name.toLowerCase());
      if (id) architectIds.push(id);
    }

    // Check if content with this URL already exists
    const existing = await prisma.externalContent.findFirst({
      where: { url: data.url },
    });
    if (existing) {
      console.log(`  Skipping (exists): ${data.title}`);
      continue;
    }

    try {
      await prisma.externalContent.create({
        data: {
          ...data,
          architects: architectIds.length
            ? {
                create: architectIds.map((id) => ({
                  architectId: id,
                  relevance: "primary",
                })),
              }
            : undefined,
        },
      });
      contentCreated++;
      console.log(`  Created: ${data.title}`);
    } catch (err: any) {
      console.error(`  Error creating "${data.title}":`, err.message);
    }
  }

  console.log(`\nCreated ${contentCreated} content items.`);

  // Seed books
  console.log("\nSeeding books...");
  let booksCreated = 0;
  for (const seed of bookSeeds) {
    const { architectNames, ...data } = seed;

    const architectIds: number[] = [];
    for (const name of architectNames ?? []) {
      const id = architectByName.get(name.toLowerCase());
      if (id) architectIds.push(id);
    }

    // Check if book with this title already exists
    const existing = await prisma.book.findFirst({
      where: { title: data.title },
    });
    if (existing) {
      console.log(`  Skipping (exists): ${data.title}`);
      continue;
    }

    try {
      await prisma.book.create({
        data: {
          ...data,
          architects: architectIds.length
            ? {
                create: architectIds.map((id) => ({
                  architectId: id,
                })),
              }
            : undefined,
        },
      });
      booksCreated++;
      console.log(`  Created: ${data.title}`);
    } catch (err: any) {
      console.error(`  Error creating "${data.title}":`, err.message);
    }
  }

  console.log(`\nCreated ${booksCreated} books.`);
  console.log("Done!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
