import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    const existingCount = await prisma.externalContent.count();
    if (existingCount > 0) {
      return NextResponse.json({ message: "Content already seeded", existingCount });
    }

    const architects = await prisma.architect.findMany({ select: { id: true, name: true } });
    const byName = new Map<string, number>();
    for (const a of architects) byName.set(a.name.toLowerCase(), a.id);

    const seeds = [
      { contentType: "article", title: "The Legacy of A.W. Tillinghast", url: "https://www.golfdigest.com/tillinghast-legacy", summary: "A.W. Tillinghast's contributions to golf course design.", sourceName: "Golf Digest", publishedAt: new Date("2023-06-15"), isApproved: true, isFeatured: true, names: ["A.W. Tillinghast"] },
      { contentType: "article", title: "Alister MacKenzie: The Doctor of Golf Course Design", url: "https://www.linksmagazine.com/mackenzie", summary: "How a physician became one of the most influential golf architects.", sourceName: "LINKS Magazine", publishedAt: new Date("2022-11-20"), isApproved: true, isFeatured: true, names: ["Alister MacKenzie"] },
      { contentType: "article", title: "Pete Dye's Lasting Impact on Modern Golf Architecture", url: "https://www.golfchannel.com/pete-dye-impact", summary: "From TPC Sawgrass to Whistling Straits.", sourceName: "Golf Channel", publishedAt: new Date("2023-01-10"), isApproved: true, isFeatured: false, names: ["Pete Dye"] },
      { contentType: "article", title: "Donald Ross: From Dornoch to Pinehurst", url: "https://www.golfdigest.com/donald-ross", summary: "The remarkable journey of Donald Ross.", sourceName: "Golf Digest", publishedAt: new Date("2023-04-05"), isApproved: true, isFeatured: true, names: ["Donald Ross"] },
      { contentType: "article", title: "The Genius of Tom Fazio's Mountain Courses", url: "https://www.golfweek.com/fazio-mountains", summary: "How Tom Fazio mastered mountain course design.", sourceName: "Golfweek", publishedAt: new Date("2023-03-18"), isApproved: true, isFeatured: false, names: ["Tom Fazio"] },
      { contentType: "article", title: "Jack Nicklaus: From Player to Designer", url: "https://www.golf.com/nicklaus-top-designs", summary: "The Golden Bear's 400+ course designs.", sourceName: "GOLF Magazine", publishedAt: new Date("2023-08-22"), isApproved: true, isFeatured: true, names: ["Jack Nicklaus"] },
      { contentType: "video", title: "The History of Augusta National Golf Club", url: "https://www.youtube.com/watch?v=qGx2DGmXfMk", thumbnailUrl: "https://img.youtube.com/vi/qGx2DGmXfMk/maxresdefault.jpg", summary: "MacKenzie and Bobby Jones created the most famous course.", sourceName: "YouTube", duration: "18:42", publishedAt: new Date("2023-04-01"), isApproved: true, isFeatured: true, names: ["Alister MacKenzie"] },
      { contentType: "video", title: "Why Pinehurst No. 2 is America's Most Important Course", url: "https://www.youtube.com/watch?v=Px8Hs_t6-yI", thumbnailUrl: "https://img.youtube.com/vi/Px8Hs_t6-yI/maxresdefault.jpg", summary: "Exploring Donald Ross's masterpiece.", sourceName: "YouTube", duration: "22:15", publishedAt: new Date("2024-01-20"), isApproved: true, isFeatured: true, names: ["Donald Ross"] },
      { contentType: "podcast", title: "Tom Doak on Strategic Golf Design", url: "https://podcasts.apple.com/fried-egg-doak", summary: "Width vs. length and favorite courses worldwide.", sourceName: "The Fried Egg Podcast", duration: "1:05:00", publishedAt: new Date("2023-10-22"), isApproved: true, isFeatured: true, names: ["Tom Doak"] },
    ];

    let contentCreated = 0;
    for (const { names, ...data } of seeds) {
      const ids = names.map(n => byName.get(n.toLowerCase())).filter((id): id is number => !!id);
      try {
        await prisma.externalContent.create({
          data: { ...data, architects: ids.length ? { create: ids.map(id => ({ architectId: id, relevance: "primary" })) } : undefined },
        });
        contentCreated++;
      } catch {}
    }

    const bookSeeds = [
      { title: "The Spirit of St. Andrews", authors: ["Alister MacKenzie"], yearPublished: 1995, description: "MacKenzie's classic treatise on golf course design.", amazonUrl: "https://www.amazon.com/dp/1886947007", names: ["Alister MacKenzie"] },
      { title: "The Anatomy of a Golf Course", authors: ["Tom Doak"], yearPublished: 1992, description: "A groundbreaking guide to golf course architecture.", amazonUrl: "https://www.amazon.com/dp/1580800076", names: ["Tom Doak"] },
      { title: "Bury Me in a Pot Bunker", authors: ["Pete Dye", "Mark Shaw"], yearPublished: 1995, description: "Pete Dye's autobiography.", amazonUrl: "https://www.amazon.com/dp/0201407647", names: ["Pete Dye"] },
      { title: "Golf Has Never Failed Me", authors: ["Donald Ross"], yearPublished: 1996, description: "Design philosophy of Donald Ross.", amazonUrl: "https://www.amazon.com/dp/1886947015", names: ["Donald Ross"] },
      { title: "The Confidential Guide to Golf Courses", authors: ["Tom Doak"], yearPublished: 2014, description: "Tom Doak's ratings and reviews.", amazonUrl: "https://www.amazon.com/dp/0615883877", names: ["Tom Doak"] },
    ];

    let booksCreated = 0;
    for (const { names, ...data } of bookSeeds) {
      const ids = names.map(n => byName.get(n.toLowerCase())).filter((id): id is number => !!id);
      try {
        await prisma.book.create({
          data: { ...data, architects: ids.length ? { create: ids.map(id => ({ architectId: id })) } : undefined },
        });
        booksCreated++;
      } catch {}
    }

    return NextResponse.json({ message: "Seed complete", contentCreated, booksCreated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
