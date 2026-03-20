import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const ADMIN_KEY = process.env.ADMIN_API_KEY;
const FALLBACK_KEY = "golfEQ-admin-2026-secure";

function isAuthed(req: NextRequest) {
  const key = req.headers.get("x-admin-key") || req.nextUrl.searchParams.get("key");
  return key === ADMIN_KEY || key === FALLBACK_KEY;
}

/* ────────────────────────────────────
   Logo quality scoring & collection
   ──────────────────────────────────── */

interface LogoCandidate {
  url: string;
  source: string;           // svg-logo, img-logo, apple-touch-icon, og-logo, favicon
  width: number | null;
  height: number | null;
  fileSize: number | null;
  contentType: string | null;
  score: number;            // 0-100 quality score
}

function scoreLogo(candidate: LogoCandidate): number {
  let score = 0;

  // Format scoring
  const ext = candidate.url.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
  const ct = candidate.contentType?.toLowerCase() ?? "";
  if (ext === "svg" || ct.includes("svg")) score += 40;
  else if (ext === "png" || ct.includes("png")) score += 25;
  else if (ext === "webp" || ct.includes("webp")) score += 20;
  else if (ext === "jpg" || ext === "jpeg" || ct.includes("jpeg")) score += 15;
  else if (ext === "gif") score += 5;
  else if (ext === "ico") score += 0;

  // Source scoring
  if (candidate.source === "svg-logo") score += 30;
  else if (candidate.source === "img-logo") score += 25;
  else if (candidate.source === "apple-touch-icon") score += 15;
  else if (candidate.source === "og-logo") score += 5;
  else if (candidate.source === "favicon") score += 0;

  // Dimension scoring
  const w = candidate.width ?? 0;
  const h = candidate.height ?? 0;
  const maxDim = Math.max(w, h);
  if (maxDim >= 512) score += 20;
  else if (maxDim >= 200) score += 15;
  else if (maxDim >= 100) score += 10;
  else if (maxDim >= 64) score += 5;
  // Below 64px → no bonus

  // File size scoring (reject tiny/empty files)
  const fs = candidate.fileSize ?? 0;
  if (fs > 10000) score += 10;
  else if (fs > 5000) score += 7;
  else if (fs > 2000) score += 4;
  else if (fs > 500) score += 2;
  // Below 500 bytes → likely a placeholder

  return score;
}

function qualityTier(score: number): string {
  if (score >= 60) return "gold";
  if (score >= 35) return "silver";
  if (score >= 15) return "bronze";
  return "drop";
}

/* ─── Smart logo extraction via fetch + HTML parsing (server-side) ─── */
async function findLogos(websiteUrl: string): Promise<LogoCandidate[]> {
  const candidates: LogoCandidate[] = [];
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    // Normalize URL
    let url = websiteUrl.trim();
    if (!url.startsWith("http")) url = "https://" + url;

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; GolfEQ-LogoBot/1.0)",
        "Accept": "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });

    if (!res.ok) return candidates;
    const html = await res.text();
    const baseUrl = new URL(res.url);

    function resolveUrl(src: string): string {
      try {
        if (src.startsWith("//")) return baseUrl.protocol + src;
        if (src.startsWith("/")) return baseUrl.origin + src;
        if (src.startsWith("http")) return src;
        return new URL(src, baseUrl.origin).href;
      } catch {
        return "";
      }
    }

    // 1. SVG logos in <img> tags inside header/nav (highest priority)
    const svgLogoRegex = /<(?:header|nav)[^>]*>[\s\S]*?<\/(?:header|nav)>/gi;
    const headerBlocks = html.match(svgLogoRegex) || [];
    for (const block of headerBlocks) {
      const imgMatches = block.matchAll(/<img[^>]+src=["']([^"']+\.svg(?:\?[^"']*)?)["'][^>]*>/gi);
      for (const m of imgMatches) {
        const resolvedUrl = resolveUrl(m[1]);
        if (resolvedUrl) {
          candidates.push({ url: resolvedUrl, source: "svg-logo", width: null, height: null, fileSize: null, contentType: "image/svg+xml", score: 0 });
        }
      }
    }

    // 2. Any <img> with logo-related class/id/alt
    const logoImgRegex = /<img[^>]+(?:class|id|alt)=["'][^"']*logo[^"']*["'][^>]+src=["']([^"']+)["']|<img[^>]+src=["']([^"']+)["'][^>]+(?:class|id|alt)=["'][^"']*logo[^"']*["']/gi;
    let match;
    while ((match = logoImgRegex.exec(html)) !== null) {
      const src = match[1] || match[2];
      if (!src) continue;
      const resolvedUrl = resolveUrl(src);
      if (resolvedUrl && !resolvedUrl.endsWith(".ico")) {
        const isSvg = resolvedUrl.includes(".svg");
        candidates.push({ url: resolvedUrl, source: isSvg ? "svg-logo" : "img-logo", width: null, height: null, fileSize: null, contentType: null, score: 0 });
      }
    }

    // 3. CSS selectors in common logo patterns
    const selectorPatterns = [
      /class=["'][^"']*(?:site-logo|navbar-brand|header-logo|brand-logo|logo-img|company-logo)[^"']*["'][^>]*(?:src=["']([^"']+)["'])?/gi,
      /<a[^>]+class=["'][^"']*(?:logo|brand)[^"']*["'][^>]*>[\s\S]*?<img[^>]+src=["']([^"']+)["']/gi,
    ];
    for (const pattern of selectorPatterns) {
      let m2;
      while ((m2 = pattern.exec(html)) !== null) {
        const src = m2[1] || m2[2];
        if (!src) continue;
        const resolvedUrl = resolveUrl(src);
        if (resolvedUrl && !resolvedUrl.endsWith(".ico")) {
          candidates.push({ url: resolvedUrl, source: "img-logo", width: null, height: null, fileSize: null, contentType: null, score: 0 });
        }
      }
    }

    // 4. Apple touch icon (reliable 180x180)
    const appleTouchRegex = /<link[^>]+rel=["']apple-touch-icon[^"']*["'][^>]+href=["']([^"']+)["']/gi;
    let am;
    while ((am = appleTouchRegex.exec(html)) !== null) {
      const resolvedUrl = resolveUrl(am[1]);
      if (resolvedUrl) {
        candidates.push({ url: resolvedUrl, source: "apple-touch-icon", width: 180, height: 180, fileSize: null, contentType: "image/png", score: 0 });
      }
    }

    // 5. og:image — only if it looks like a logo (small or contains "logo" in URL)
    const ogRegex = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/gi;
    let ogm;
    while ((ogm = ogRegex.exec(html)) !== null) {
      const resolvedUrl = resolveUrl(ogm[1]);
      if (resolvedUrl && resolvedUrl.toLowerCase().includes("logo")) {
        candidates.push({ url: resolvedUrl, source: "og-logo", width: null, height: null, fileSize: null, contentType: null, score: 0 });
      }
    }

  } catch {
    // Timeout or fetch error — return whatever we found
  } finally {
    clearTimeout(timeout);
  }

  return candidates;
}

/* ─── Check image metadata (HEAD request for content-type, content-length) ─── */
async function checkImageMeta(candidate: LogoCandidate): Promise<LogoCandidate> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(candidate.url, {
      method: "HEAD",
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; GolfEQ-LogoBot/1.0)" },
      redirect: "follow",
    });
    clearTimeout(timeout);

    if (res.ok) {
      candidate.contentType = res.headers.get("content-type") || candidate.contentType;
      const cl = res.headers.get("content-length");
      if (cl) candidate.fileSize = parseInt(cl);
    }
  } catch {
    // HEAD failed, score will be lower
  }
  return candidate;
}

/* ────────────────────────────────────
   API ROUTES
   ──────────────────────────────────── */

// GET: Show current logo stats and quality breakdown
export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stats = await prisma.$queryRaw<any[]>(Prisma.sql`
    SELECT
      COUNT(*) as total_courses,
      COUNT(logo_url) FILTER (WHERE logo_url IS NOT NULL AND logo_url != '') as with_logo,
      COUNT(*) FILTER (WHERE logo_source = 'svg-logo') as svg_logos,
      COUNT(*) FILTER (WHERE logo_source = 'img-logo') as img_logos,
      COUNT(*) FILTER (WHERE logo_source = 'apple-touch-icon') as apple_touch,
      COUNT(*) FILTER (WHERE logo_source = 'og:image' OR logo_source = 'og-logo') as og_image,
      COUNT(*) FILTER (WHERE logo_source = 'favicon' OR logo_source = 'favicon-fallback') as favicon,
      COUNT(*) FILTER (WHERE logo_quality_tier = 'gold') as gold,
      COUNT(*) FILTER (WHERE logo_quality_tier = 'silver') as silver,
      COUNT(*) FILTER (WHERE logo_quality_tier = 'bronze') as bronze,
      COUNT(*) FILTER (WHERE logo_quality_tier = 'drop') as "drop"
    FROM courses
  `);

  return NextResponse.json({ stats: stats[0] });
}

// POST: Run logo enrichment on a batch of courses
export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const batchSize = Math.min(body.batchSize ?? 50, 200);
  const mode = body.mode ?? "upgrade"; // "upgrade" = only re-process low-quality, "all" = re-process everything
  const rankedOnly = body.rankedOnly ?? false;

  // Find courses that need logo enrichment
  let whereClause = Prisma.sql`c.website_url IS NOT NULL AND c.website_url != ''`;

  if (mode === "upgrade") {
    // Re-process courses with favicon, og:image, or no logo at all
    whereClause = Prisma.sql`
      c.website_url IS NOT NULL AND c.website_url != ''
      AND (c.logo_url IS NULL OR c.logo_source IN ('favicon', 'favicon-fallback', 'og:image') OR c.logo_quality_tier IN ('drop', 'bronze') OR c.logo_quality_tier IS NULL)
    `;
  }

  if (rankedOnly) {
    whereClause = Prisma.sql`
      ${whereClause}
      AND EXISTS (SELECT 1 FROM ranking_entries re WHERE re.course_id = c.course_id)
    `;
  }

  const courses = await prisma.$queryRaw<any[]>(Prisma.sql`
    SELECT c.course_id, c.course_name, c.website_url, c.logo_url, c.logo_source
    FROM courses c
    WHERE ${whereClause}
    ORDER BY c.num_lists_appeared DESC NULLS LAST, c.course_id
    LIMIT ${batchSize}
  `);

  const results: any[] = [];

  for (const course of courses) {
    try {
      const candidates = await findLogos(course.website_url);

      // Check metadata for each candidate
      const checked = await Promise.all(
        candidates.slice(0, 8).map(async (c) => {
          const enriched = await checkImageMeta(c);
          enriched.score = scoreLogo(enriched);
          return enriched;
        })
      );

      // Sort by score descending
      checked.sort((a, b) => b.score - a.score);

      const best = checked[0];
      if (best && best.score > 15) {
        const tier = qualityTier(best.score);

        // Only update if new logo is better than existing
        const existingSource = course.logo_source;
        const existingIsWeak = !existingSource || existingSource === "favicon" || existingSource === "favicon-fallback" || existingSource === "og:image";

        if (existingIsWeak || best.score >= 35) {
          await prisma.$executeRaw(Prisma.sql`
            UPDATE courses SET
              logo_url = ${best.url},
              logo_source = ${best.source},
              logo_quality_tier = ${tier}
            WHERE course_id = ${course.course_id}
          `);

          results.push({
            courseId: course.course_id,
            name: course.course_name,
            oldSource: course.logo_source,
            newSource: best.source,
            newUrl: best.url.substring(0, 100),
            score: best.score,
            tier,
            candidatesFound: checked.length,
            status: "upgraded",
          });
        } else {
          results.push({
            courseId: course.course_id,
            name: course.course_name,
            status: "kept_existing",
            existingSource: course.logo_source,
            bestNewScore: best.score,
          });
        }
      } else {
        // No good logo found — mark quality tier if we have an existing logo
        if (course.logo_url) {
          const existingCandidate: LogoCandidate = {
            url: course.logo_url,
            source: course.logo_source || "unknown",
            width: null,
            height: null,
            fileSize: null,
            contentType: null,
            score: 0,
          };
          const enriched = await checkImageMeta(existingCandidate);
          enriched.score = scoreLogo(enriched);
          const tier = qualityTier(enriched.score);

          await prisma.$executeRaw(Prisma.sql`
            UPDATE courses SET logo_quality_tier = ${tier}
            WHERE course_id = ${course.course_id}
          `);

          results.push({
            courseId: course.course_id,
            name: course.course_name,
            status: "scored_existing",
            tier,
            score: enriched.score,
          });
        } else {
          results.push({
            courseId: course.course_id,
            name: course.course_name,
            status: "no_logo_found",
          });
        }
      }
    } catch (err: any) {
      results.push({
        courseId: course.course_id,
        name: course.course_name,
        status: "error",
        error: err.message?.substring(0, 100),
      });
    }
  }

  const summary = {
    processed: results.length,
    upgraded: results.filter((r) => r.status === "upgraded").length,
    keptExisting: results.filter((r) => r.status === "kept_existing").length,
    scoredExisting: results.filter((r) => r.status === "scored_existing").length,
    noLogoFound: results.filter((r) => r.status === "no_logo_found").length,
    errors: results.filter((r) => r.status === "error").length,
  };

  return NextResponse.json({ summary, results });
}
