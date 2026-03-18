import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  try {
    const items = await prisma.externalContent.findMany({
      where: { isApproved: true },
      orderBy: { publishedAt: "desc" },
      take: 50,
    });

    const now = new Date().toUTCString();

    const rssItems = items
      .map((item) => {
        const pubDate = item.publishedAt
          ? new Date(item.publishedAt).toUTCString()
          : new Date(item.createdAt).toUTCString();
        return `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.url)}</link>
      <description>${escapeXml(item.summary || "")}</description>
      <pubDate>${pubDate}</pubDate>
      <category>${escapeXml(item.contentType)}</category>
      <guid isPermaLink="true">${escapeXml(item.url)}</guid>
    </item>`;
      })
      .join("\n");

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>The Fairway — golfEQUALIZER</title>
    <link>https://golfequalizer.ai/fairway</link>
    <description>Curated golf architecture content — articles, videos, and podcasts about course design, architects, and the best courses in the world.</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="https://golfequalizer.ai/api/fairway/feed" rel="self" type="application/rss+xml" />
${rssItems}
  </channel>
</rss>`;

    return new NextResponse(rss, {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err: any) {
    console.error("RSS feed error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
