import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const BATCH_SIZE = 5;
const TIMEOUT_MS = 10000;
const USER_AGENT = "Mozilla/5.0 (compatible; GolfEQ LinkChecker/1.0)";

async function checkUrl(url: string): Promise<{ status: string; note: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    // Try HEAD first
    let res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT },
      redirect: "follow",
    });

    // Some servers don't support HEAD — fall back to GET
    if (res.status === 405 || res.status === 403) {
      res = await fetch(url, {
        method: "GET",
        signal: controller.signal,
        headers: { "User-Agent": USER_AGENT },
        redirect: "follow",
      });
    }

    clearTimeout(timeout);

    if (res.ok) {
      // Check if we were redirected to a different domain (possible soft 404)
      const finalUrl = res.url;
      if (finalUrl && new URL(finalUrl).hostname !== new URL(url).hostname) {
        return { status: "redirect", note: `Redirected to ${finalUrl}` };
      }
      return { status: "ok", note: `${res.status} OK` };
    }

    if (res.status >= 300 && res.status < 400) {
      return { status: "redirect", note: `${res.status} ${res.statusText}` };
    }

    return { status: "broken", note: `${res.status} ${res.statusText}` };
  } catch (err: any) {
    clearTimeout(timeout);
    if (err.name === "AbortError") {
      return { status: "error", note: "Timeout after 10s" };
    }
    return { status: "error", note: err.message || "Network error" };
  }
}

export async function POST(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const allContent = await prisma.externalContent.findMany({
      select: { id: true, url: true, title: true },
    });

    const results: { id: number; title: string; url: string; status: string; note: string }[] = [];

    // Process in batches
    for (let i = 0; i < allContent.length; i += BATCH_SIZE) {
      const batch = allContent.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(async (item) => {
          const { status, note } = await checkUrl(item.url);
          return { id: item.id, title: item.title, url: item.url, status, note };
        })
      );
      results.push(...batchResults);
    }

    // Update all records
    const now = new Date();
    for (const result of results) {
      await prisma.externalContent.update({
        where: { id: result.id },
        data: {
          linkStatus: result.status,
          lastCheckedAt: now,
          checkNote: result.note,
        },
      });
    }

    const ok = results.filter((r) => r.status === "ok").length;
    const broken = results.filter((r) => r.status === "broken" || r.status === "error").length;
    const redirect = results.filter((r) => r.status === "redirect").length;

    return NextResponse.json({
      success: true,
      total: results.length,
      ok,
      broken,
      redirect,
      brokenItems: results.filter((r) => r.status === "broken" || r.status === "error"),
      allResults: results,
    });
  } catch (err: any) {
    console.error("Check links error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
