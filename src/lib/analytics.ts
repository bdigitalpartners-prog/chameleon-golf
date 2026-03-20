/**
 * golfEQUALIZER — Analytics Event System
 * ─────────────────────────────────────────
 * Centralised event tracking layer that fires to both GA4 and
 * Vercel Analytics.  Every user-facing action of consequence
 * should call one of the helpers below.
 *
 * GA4 custom events are sent via gtag().
 * Vercel Analytics custom events via track().
 */

import { track } from "@vercel/analytics";

/* ─── Low-level GA4 push ───────────────────────────────────── */

function gtag(...args: unknown[]) {
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag(...args);
  }
}

/** Fire a GA4 custom event **and** a Vercel Analytics event */
function emit(name: string, params?: Record<string, string | number | boolean>) {
  // GA4
  gtag("event", name, params);
  // Vercel Analytics (strips numeric values to strings automatically)
  try {
    const vParams: Record<string, string> = {};
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        vParams[k] = String(v);
      }
    }
    track(name, vParams);
  } catch {
    // Vercel Analytics not loaded — silent fail
  }
}

/* ─── Page / Navigation ────────────────────────────────────── */

/** Fired on every client-side route change (handled by the analytics provider) */
export function trackPageView(url: string) {
  gtag("event", "page_view", { page_path: url });
}

/* ─── Course Engagement ────────────────────────────────────── */

export function trackCourseView(courseId: number, courseName: string, state?: string, country?: string) {
  emit("course_view", {
    course_id: courseId,
    course_name: courseName,
    state: state ?? "",
    country: country ?? "",
  });
}

export function trackCourseSearch(query: string, resultCount: number) {
  emit("course_search", {
    search_term: query,
    result_count: resultCount,
  });
}

export function trackCourseFilter(filters: Record<string, string>) {
  emit("course_filter", {
    ...filters,
  });
}

export function trackCourseCompare(courseIds: number[], courseNames: string[]) {
  emit("course_compare", {
    course_ids: courseIds.join(","),
    course_names: courseNames.join(","),
    compare_count: courseIds.length,
  });
}

export function trackBucketListAdd(courseId: number, courseName: string) {
  emit("bucket_list_add", {
    course_id: courseId,
    course_name: courseName,
  });
}

export function trackBucketListRemove(courseId: number, courseName: string) {
  emit("bucket_list_remove", {
    course_id: courseId,
    course_name: courseName,
  });
}

/* ─── Rankings ─────────────────────────────────────────────── */

export function trackRankingView(listName: string, source: string) {
  emit("ranking_view", {
    list_name: listName,
    ranking_source: source,
  });
}

export function trackWeightAdjustment(weights: Record<string, number>) {
  const weightStr = Object.entries(weights)
    .map(([k, v]) => `${k}:${v}`)
    .join(",");
  emit("weight_adjustment", {
    weights: weightStr,
  });
}

/* ─── Map ──────────────────────────────────────────────────── */

export function trackMapInteraction(action: "pin_click" | "cluster_zoom" | "region_filter", detail?: string) {
  emit("map_interaction", {
    map_action: action,
    detail: detail ?? "",
  });
}

/* ─── Architect ────────────────────────────────────────────── */

export function trackArchitectView(architectName: string) {
  emit("architect_view", {
    architect_name: architectName,
  });
}

/* ─── Content / Fairway ────────────────────────────────────── */

export function trackContentView(contentType: string, title: string, slug?: string) {
  emit("content_view", {
    content_type: contentType,
    title,
    slug: slug ?? "",
  });
}

/* ─── Auth ─────────────────────────────────────────────────── */

export function trackSignUp(method: string) {
  emit("sign_up", { method });
}

export function trackSignIn(method: string) {
  emit("sign_in", { method });
}

/* ─── Performance Center ───────────────────────────────────── */

export function trackPerformanceView(category: string) {
  emit("performance_view", { category });
}

/* ─── Academy ──────────────────────────────────────────────── */

export function trackAcademyView(section: string) {
  emit("academy_view", { section });
}

export function trackPrepPackView(courseId: number, courseName: string) {
  emit("prep_pack_view", {
    course_id: courseId,
    course_name: courseName,
  });
}

/* ─── Concierge AI ─────────────────────────────────────────── */

export function trackConciergeQuery(query: string) {
  emit("concierge_query", {
    query: query.slice(0, 100), // trim for payload limits
  });
}

/* ─── Engagement / Social ──────────────────────────────────── */

export function trackShare(itemType: string, itemId: string, method: string) {
  emit("share", {
    item_type: itemType,
    item_id: itemId,
    share_method: method,
  });
}

export function trackExternalLinkClick(url: string, context: string) {
  emit("external_link_click", {
    outbound_url: url,
    link_context: context,
  });
}

/* ─── CTA / Conversion ─────────────────────────────────────── */

export function trackCTAClick(ctaName: string, location: string) {
  emit("cta_click", {
    cta_name: ctaName,
    cta_location: location,
  });
}

export function trackWaitlistSignup(email: string) {
  emit("waitlist_signup", {
    // Don't send PII to analytics — just track that it happened
    has_email: "true",
  });
}

/* ─── Rounds / Scoring ─────────────────────────────────────── */

export function trackRoundLogged(courseId: number, courseName: string) {
  emit("round_logged", {
    course_id: courseId,
    course_name: courseName,
  });
}

/* ─── Pro Shop ─────────────────────────────────────────────── */

export function trackProShopView(category?: string) {
  emit("pro_shop_view", {
    category: category ?? "all",
  });
}

/* ─── Trips / Travel ───────────────────────────────────────── */

export function trackTripPlanned(destination: string, courseCount: number) {
  emit("trip_planned", {
    destination,
    course_count: courseCount,
  });
}

/* ─── Generic fallback for ad-hoc events ───────────────────── */

export function trackCustomEvent(name: string, params?: Record<string, string | number | boolean>) {
  emit(name, params);
}
