import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const RELEVANCE_KEYWORDS = [
  "architect", "design", "course", "ranking", "renovation", "restoration",
  "routing", "bunker", "green complex", "links golf", "strategic", "golden age",
  "minimalist", "coore", "crenshaw", "doak", "fazio", "nicklaus", "dye", "ross",
  "mackenzie", "tillinghast", "hanse", "raynor", "thomas", "flynn", "maxwell",
  "macdonald", "seth raynor", "king-collins", "hole", "par 3", "par 4", "par 5",
  "new course", "best courses", "top 100", "u.s. open", "open championship",
  "masters", "pga championship", "ryder cup",
];

interface FeedItem {
  title: string;
  link: string;
  pubDate: string | null;
  description: string | null;
  sourceName: string;
  contentType: string;
}

/** Extract text content from between XML tags */
function extractTag(xml: string, tag: string): string {
  // Handle self-closing <link href="..."/> (Atom)
  if (tag === "link") {
    const hrefMatch = xml.match(/<link[^>]+href=["']([^"']+)["'][^>]*\/>/);
    if (hrefMatch) return hrefMatch[1];
  }
  const re = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>|<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const match = xml.match(re);
  if (!match) return "";
  return (match[1] || match[2] || "").trim();
}

/** Parse RSS 2.0 or Atom feed XML into items */
function parseFeed(xml: string, sourceName: string, contentTypes: string[]): FeedItem[] {
  const items: FeedItem[] = [];
  const isAtom = xml.includes("<feed") && xml.includes("xmlns=\"http://www.w3.org/2005/Atom\"");
  const contentType = contentTypes[0] || "article";

  if (isAtom) {
    // Atom feed — split on <entry>
    const entries = xml.split(/<entry[\s>]/).slice(1);
    for (const entry of entries) {
      const title = extractTag(entry, "title");
      // Atom link: <link rel="alternate" href="..."/> or <link href="..."/>
      const linkMatch = entry.match(/<link[^>]*href=["']([^"']+)["'][^>]*>/);
      const link = linkMatch ? linkMatch[1] : "";
      const published = extractTag(entry, "published") || extractTag(entry, "updated");
      const summary = extractTag(entry, "summary") || extractTag(entry, "content");
      if (title && link) {
        items.push({
          title: decodeHtmlEntities(title),
          link,
          pubDate: published || null,
          description: decodeHtmlEntities(stripHtml(summary)).slice(0, 500) || null,
          sourceName,
          contentType,
        });
      }
    }
  } else {
    // RSS 2.0 feed — split on <item>
    const rssItems = xml.split(/<item[\s>]/).slice(1);
    for (const item of rssItems) {
      const title = extractTag(item, "title");
      const link = extractTag(item, "link");
      const pubDate = extractTag(item, "pubDate");
      const description = extractTag(item, "description") || extractTag(item, "content:encoded");
      if (title && link) {
        items.push({
          title: decodeHtmlEntities(title),
          link,
          pubDate: pubDate || null,
          description: decodeHtmlEntities(stripHtml(description)).slice(0, 500) || null,
          sourceName,
          contentType,
        });
      }
    }
  }

  return items;
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"');
}

function isRelevant(title: string, description: string | null): boolean {
  const text = `${title} ${description || ""}`.toLowerCase();
  return RELEVANCE_KEYWORDS.some((kw) => text.includes(kw));
}

export async function POST(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json().catch(() => ({}));
    const dryRun = body.dryRun !== false; // default true

    // Fetch all active content sources
    const sources = await prisma.contentSource.findMany({
      where: { isActive: true },
    });

    if (sources.length === 0) {
      return NextResponse.json({
        error: "No active content sources. Run POST /api/admin/seed-content-sources first.",
      }, { status: 400 });
    }

    // Fetch all architects for cross-referencing
    const architects = await prisma.architect.findMany({
      select: { id: true, name: true },
    });

    let sourcesScanned = 0;
    let itemsFound = 0;
    let relevantItems = 0;
    let newItems = 0;
    let duplicateSkipped = 0;
    const discoveredItems: (FeedItem & { isNew: boolean; matchedArchitects: { id: number; name: string }[] })[] = [];

    for (const source of sources) {
      if (!source.feedUrl) continue;

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const res = await fetch(source.feedUrl, {
          signal: controller.signal,
          headers: {
            "User-Agent": "golfEQUALIZER-Bot/1.0 (content-enrichment)",
          },
        });
        clearTimeout(timeout);

        if (!res.ok) continue;

        const xml = await res.text();
        const feedItems = parseFeed(xml, source.name, source.contentTypes);
        sourcesScanned++;
        itemsFound += feedItems.length;

        // Filter for relevant items
        for (const item of feedItems) {
          if (!isRelevant(item.title, item.description)) continue;
          relevantItems++;

          // Check for duplicate
          const existing = await prisma.externalContent.findFirst({
            where: { url: item.link },
          });

          if (existing) {
            duplicateSkipped++;
            discoveredItems.push({ ...item, isNew: false, matchedArchitects: [] });
            continue;
          }

          // Cross-reference architects
          const text = `${item.title} ${item.description || ""}`.toLowerCase();
          const matchedArchitects = architects.filter((a) => {
            const nameLower = a.name.toLowerCase();
            // Check full name
            if (text.includes(nameLower)) return true;
            // Check last name only (for multi-word names)
            const parts = nameLower.split(" ");
            if (parts.length > 1) {
              const lastName = parts[parts.length - 1];
              if (lastName.length > 3 && text.includes(lastName)) return true;
            }
            return false;
          });

          newItems++;
          discoveredItems.push({ ...item, isNew: true, matchedArchitects });
        }

        // Update lastFetchedAt
        await prisma.contentSource.update({
          where: { id: source.id },
          data: { lastFetchedAt: new Date() },
        });
      } catch (fetchErr: any) {
        // Skip failed feeds silently
        console.error(`Failed to fetch feed for ${source.name}:`, fetchErr.message);
        continue;
      }
    }

    // If not dry run, insert new items
    if (!dryRun) {
      for (const item of discoveredItems) {
        if (!item.isNew) continue;

        const created = await prisma.externalContent.create({
          data: {
            contentType: item.contentType,
            title: item.title,
            url: item.link,
            summary: item.description,
            sourceName: item.sourceName,
            publishedAt: item.pubDate ? new Date(item.pubDate) : null,
            isApproved: false,
            linkStatus: "ok",
            lastCheckedAt: new Date(),
          },
        });

        // Auto-link matched architects
        for (const arch of item.matchedArchitects) {
          await prisma.contentArchitectLink.create({
            data: {
              contentId: created.id,
              architectId: arch.id,
              relevance: "auto-matched",
            },
          }).catch(() => {}); // skip if duplicate
        }
      }
    }

    return NextResponse.json({
      dryRun,
      sourcesScanned,
      itemsFound,
      relevantItems,
      newItems,
      duplicateSkipped,
      items: discoveredItems.map((item) => ({
        title: item.title,
        link: item.link,
        pubDate: item.pubDate,
        source: item.sourceName,
        contentType: item.contentType,
        isNew: item.isNew,
        matchedArchitects: item.matchedArchitects.map((a) => a.name),
        description: item.description?.slice(0, 200),
      })),
    });
  } catch (err: any) {
    console.error("Enrich fairway error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
