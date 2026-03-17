"use client";

import { useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  MapPin, ChevronRight, Home, Pencil, ArrowRight,
} from "lucide-react";
import { CoursePlaceholder } from "./CoursePlaceholder";
import { OverviewTab, TheCourseTab, PlayItTab, TravelStayTab, HistoryTab, CommunityTab } from "./tabs";
import { accessBadgeStyle, safeText } from "./tabs/shared";

/* ─── Tab Configuration ─── */

const TAB_CONFIG = [
  { key: "overview", label: "Overview" },
  { key: "the-course", label: "The Course" },
  { key: "play-it", label: "Play It" },
  { key: "travel-stay", label: "Travel & Stay" },
  { key: "history", label: "History & Legacy" },
  { key: "community", label: "Community" },
] as const;

type TabKey = (typeof TAB_CONFIG)[number]["key"];

/* ════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════ */

export function CourseDetailClient({ course }: { course: any }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const tabParam = searchParams.get("tab") || "overview";
  const activeTab: TabKey = TAB_CONFIG.some((t) => t.key === tabParam) ? (tabParam as TabKey) : "overview";

  const setActiveTab = useCallback((tab: TabKey) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "overview") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    const qs = params.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [searchParams, router, pathname]);

  /* ── Derived data ── */
  const activeMedia = course.media?.filter((m: any) => m.isActive !== false);
  const primaryImage = activeMedia?.find((m: any) => m.isPrimary) ?? activeMedia?.[0];
  const location = [course.city, course.state].filter(Boolean).join(", ");
  const maxTeeYardage = course.teeBoxes?.[0]?.totalYardage;

  const csData = Array.isArray(course.chameleonScores) ? course.chameleonScores[0] : course.chameleonScores;
  const scoreNum = csData?.chameleonScore ? parseFloat(csData.chameleonScore) : null;

  /* ─────────── RENDER ─────────── */

  return (
    <div style={{ backgroundColor: "var(--cg-bg-primary)" }}>
      {/* ══════ BREADCRUMBS ══════ */}
      <nav className="mx-auto max-w-7xl px-4 py-3" aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5 text-xs" style={{ color: "var(--cg-text-muted)" }}>
          <li>
            <Link href="/" className="flex items-center gap-1 hover:opacity-80 transition-opacity" style={{ color: "var(--cg-text-muted)" }}>
              <Home className="h-3.5 w-3.5" />
              Home
            </Link>
          </li>
          <li><ChevronRight className="h-3 w-3" /></li>
          <li>
            <Link href="/discover" className="hover:opacity-80 transition-opacity" style={{ color: "var(--cg-text-muted)" }}>
              Courses
            </Link>
          </li>
          <li><ChevronRight className="h-3 w-3" /></li>
          <li className="truncate max-w-[200px]" style={{ color: "var(--cg-text-secondary)" }}>
            {course.courseName || "Course"}
          </li>
        </ol>
      </nav>

      {/* ══════ HERO ══════ */}
      <div className="relative overflow-hidden" style={{ minHeight: primaryImage ? undefined : 200 }}>
        {primaryImage ? (
          <>
            <div className="aspect-[21/9] max-h-[480px] w-full">
              <img
                src={primaryImage.url}
                alt={course.courseName}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
            {primaryImage.credit && (
              <div className="absolute bottom-3 right-3 z-10 rounded px-2 py-1 text-xs text-white/90 bg-black/50 backdrop-blur-sm">
                Photo: {primaryImage.credit}
              </div>
            )}
          </>
        ) : (
          <div className="h-48 md:h-64">
            <CoursePlaceholder
              courseName={course.courseName}
              courseStyle={course.courseStyle}
              size="card"
            />
          </div>
        )}

        {/* Hero badges - top left */}
        <div className="absolute top-4 left-4 md:top-6 md:left-6 flex items-center gap-2">
          {course.accessType && (
            <span className="rounded-full px-3 py-1 text-xs font-semibold" style={accessBadgeStyle(course.accessType)}>
              {course.accessType}
            </span>
          )}
          {course.priceTier && (
            <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{
              backgroundColor: "rgba(234,179,8,0.15)", color: "#fbbf24", border: "1px solid rgba(234,179,8,0.3)",
            }}>
              {course.priceTier}
            </span>
          )}
        </div>

        {/* CF Score ring - top right */}
        {scoreNum !== null && (
          <div className="absolute top-4 right-4 md:top-6 md:right-6">
            <div
              className="flex items-center justify-center rounded-full h-16 w-16 text-lg font-bold shadow-lg"
              style={{
                backgroundColor: scoreNum >= 80 ? "var(--cg-accent)" : scoreNum >= 50 ? "#eab308" : "var(--cg-bg-card)",
                color: scoreNum >= 50 ? "white" : "var(--cg-text-primary)",
              }}
            >
              {Math.round(scoreNum)}
            </div>
          </div>
        )}

        {/* Hero text - bottom */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-5 md:px-6 md:pb-6">
          <div className="mx-auto max-w-7xl">
            <h1 className="font-display text-3xl font-bold text-white md:text-4xl lg:text-5xl drop-shadow-lg">
              {course.courseName}
            </h1>
            {course.tagline && (
              <p className="mt-1 text-base text-white/80 italic">{course.tagline}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/90">
              {(location || course.country) && (
                <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{location}{course.country && location ? `, ${course.country}` : course.country || ""}</span>
              )}
              {course.par != null && <span>Par {course.par}</span>}
              {maxTeeYardage != null && <span>{Number(maxTeeYardage).toLocaleString()} yards</span>}
              {course.numHoles != null && <span>{course.numHoles} holes</span>}
            </div>
          </div>
        </div>
      </div>

      {/* ══════ ARCHITECT CARD — HERO AREA ══════ */}
      {(course.architect || safeText(course.originalArchitect)) && (
        <div className="mx-auto max-w-7xl px-4 -mt-6 relative z-10">
          <div
            className="rounded-xl p-4 flex items-center gap-4 backdrop-blur-sm"
            style={{
              backgroundColor: "rgba(26,26,26,0.95)",
              border: "1px solid var(--cg-border)",
            }}
          >
            {course.architect?.portraitUrl || course.architect?.imageUrl ? (
              <img
                src={course.architect.portraitUrl || course.architect.imageUrl}
                alt={course.architect?.name || course.originalArchitect}
                className="h-14 w-14 rounded-lg object-cover flex-shrink-0"
                style={{ border: "1px solid var(--cg-border)" }}
              />
            ) : (
              <div
                className="h-14 w-14 rounded-lg flex items-center justify-center flex-shrink-0 text-lg font-bold"
                style={{ backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-accent)" }}
              >
                <Pencil className="h-6 w-6" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs uppercase tracking-wider font-medium" style={{ color: "var(--cg-text-muted)" }}>
                  Designed by
                </span>
                {course.architect?.era && (
                  <span
                    className="text-[10px] rounded-full px-2 py-0.5 font-medium"
                    style={{ backgroundColor: "rgba(46,204,113,0.15)", color: "#2ECC71", border: "1px solid rgba(46,204,113,0.3)" }}
                  >
                    {course.architect.era}
                  </span>
                )}
              </div>
              {course.architect?.slug ? (
                <Link
                  href={`/architects/${course.architect.slug}`}
                  className="font-semibold text-base transition-colors hover:underline mt-0.5 block truncate"
                  style={{ color: "#2ECC71" }}
                >
                  {course.architect?.name || course.originalArchitect}
                </Link>
              ) : (
                <div className="font-semibold text-base mt-0.5 truncate" style={{ color: "var(--cg-text-primary)" }}>
                  {course.originalArchitect}
                </div>
              )}
              {course.architect?.totalCoursesDesigned && (
                <span className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
                  {course.architect.totalCoursesDesigned} courses designed
                </span>
              )}
            </div>

            {course.architect?.slug && (
              <Link
                href={`/architects/${course.architect.slug}`}
                className="flex items-center justify-center h-10 w-10 rounded-lg shrink-0 transition-colors hover:opacity-80"
                style={{ backgroundColor: "rgba(46,204,113,0.15)", color: "#2ECC71" }}
              >
                <ArrowRight className="h-5 w-5" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ══════ 6-TAB BAR ══════ */}
      <div className="sticky top-0 z-30 mt-4" style={{ backgroundColor: "var(--cg-bg-primary)", borderBottom: "1px solid var(--cg-border)" }}>
        <div className="mx-auto max-w-7xl px-4">
          <nav className="flex gap-1 overflow-x-auto scrollbar-hide -mb-px">
            {TAB_CONFIG.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="shrink-0 px-4 py-3 text-sm font-medium transition-colors relative whitespace-nowrap"
                style={{
                  color: activeTab === tab.key ? "var(--cg-accent)" : "var(--cg-text-muted)",
                  backgroundColor: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: "var(--cg-accent)" }} />
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* ══════ TAB CONTENT ══════ */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        {activeTab === "overview" && <OverviewTab course={course} />}
        {activeTab === "the-course" && <TheCourseTab course={course} />}
        {activeTab === "play-it" && <PlayItTab course={course} />}
        {activeTab === "travel-stay" && <TravelStayTab course={course} />}
        {activeTab === "history" && <HistoryTab course={course} />}
        {activeTab === "community" && <CommunityTab course={course} />}
      </div>
    </div>
  );
}
