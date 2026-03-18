"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import ContourBackground from "@/components/background/ContourBackground";
import {
  ArrowRight,
  SlidersHorizontal,
  BarChart3,
  Trophy,
  Star,
  MapPin,
  Zap,
  ExternalLink,
  ChevronRight,
  Globe,
  BookOpen,
  Users,
  TrendingUp,
  Award,
  Mail,
} from "lucide-react";

// ─── Format number with commas (e.g. 1499 → "1,499") ──────────
function fmt(n: number): string {
  return n.toLocaleString("en-US");
}

// ─── Dynamic stats hook ────────────────────────────────────────
interface SiteStats {
  courses: number;
  rankingLists: number;
  rankingEntries: number;
  architects: number;
  rankingSources: number;
  airports: number;
}

const FALLBACK_STATS: SiteStats = {
  courses: 1499,
  rankingLists: 46,
  rankingEntries: 2665,
  architects: 100,
  rankingSources: 4,
  airports: 714,
};

function useSiteStats(): SiteStats {
  const [stats, setStats] = useState<SiteStats>(FALLBACK_STATS);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data: SiteStats) => setStats(data))
      .catch(() => {});
  }, []);

  return stats;
}

// ─── Ranking Sources Data ───────────────────────────────────────
const RANKING_SOURCES = [
  {
    name: "Golf Digest",
    slug: "golf-digest",
    logo: "GD",
    listCount: 12,
    entryCount: 800,
    authorityWeight: 1.0,
    url: "https://www.golfdigest.com/",
    methodology:
      "Panel of 2,300+ low-handicap amateur evaluators rate courses on a 1–10 scale across shot values, design variety, resistance to scoring, memorability, aesthetics, conditioning, and ambience. Courses must receive minimum evaluation counts to qualify.",
    keyLists: [
      "America's 100 Greatest",
      "World's 100 Greatest",
      "America's Second 100 Greatest",
      "Best in State",
    ],
    color: "#c41230",
    founded: "Since 1966",
  },
  {
    name: "Golfweek",
    slug: "golfweek",
    logo: "GW",
    listCount: 14,
    entryCount: 750,
    authorityWeight: 0.95,
    url: "https://golfweek.usatoday.com/",
    methodology:
      "A volunteer rater panel scores courses 1–10 across 10 criteria including routing, conditioning, aesthetics, and challenge. Separate panels rate public, private, and resort courses. The 'Best Modern' list uniquely highlights post-1960 designs.",
    keyLists: [
      "Top 200 Classic Courses",
      "Top 200 Modern Courses",
      "Best Courses You Can Play",
      "Top Campus Courses",
    ],
    color: "#1e5aa8",
    founded: "Since 1997",
  },
  {
    name: "GOLF.com / GOLF Magazine",
    slug: "golf-magazine",
    logo: "GM",
    listCount: 8,
    entryCount: 600,
    authorityWeight: 0.90,
    url: "https://golf.com/",
    methodology:
      "Expert panelists — including touring pros, architects, and industry insiders — evaluate courses on design, conditioning, variety, memorability, ambience, and resistance to scoring. Strong emphasis on international coverage and the 'Top 100 in the World' list.",
    keyLists: [
      "Top 100 Courses in the World",
      "Top 100 Courses in the U.S.",
      "Top 100 Courses You Can Play",
      "Best New Courses",
    ],
    color: "#007a33",
    founded: "Since 1985",
  },
  {
    name: "Top100GolfCourses.com",
    slug: "top100golf",
    logo: "T1",
    listCount: 12,
    entryCount: 500,
    authorityWeight: 0.80,
    url: "https://www.top100golfcourses.com/",
    methodology:
      "Crowdsourced global platform where any registered golfer can rate courses across multiple dimensions. Ratings are normalized and weighted by reviewer activity. Largest sample size of any ranking — strong for international courses not covered by U.S.-centric publications.",
    keyLists: [
      "World Top 100",
      "European Top 100",
      "UK & Ireland Top 100",
      "Best by Country",
    ],
    color: "#ff8c00",
    founded: "Since 2005",
  },
];

function WaitlistCTA() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [position, setPosition] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source: "homepage" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }
      setPosition(data.position);
      setSuccess(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      className="py-16 sm:py-20"
      style={{
        backgroundColor: "var(--cg-bg-primary)",
        borderTop: "1px solid var(--cg-border-subtle)",
      }}
    >
      <div className="mx-auto max-w-2xl px-4 text-center">
        <div
          className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
          style={{
            backgroundColor: "rgba(1, 105, 111, 0.1)",
            color: "#01696F",
            border: "1px solid rgba(1, 105, 111, 0.4)",
          }}
        >
          <Mail className="h-3 w-3" />
          Early Access
        </div>
        <h2
          className="text-2xl font-bold sm:text-3xl"
          style={{ color: "var(--cg-text-primary)" }}
        >
          Get early access to{" "}
          <span style={{ color: "#01696F" }}>personalized rankings</span>
        </h2>
        <p
          className="mt-3 text-base"
          style={{ color: "var(--cg-text-secondary)" }}
        >
          Join the waitlist for Chameleon Golf — course rankings that adapt to
          what matters to you.
        </p>

        {success ? (
          <div className="mt-6">
            <p className="text-lg font-semibold" style={{ color: "#01696F" }}>
              You're on the list! We'll be in touch soon.
            </p>
            {position && (
              <p className="mt-1 text-sm" style={{ color: "var(--cg-text-secondary)" }}>
                You're #{position} on the waitlist.
              </p>
            )}
            <Link
              href="/waitlist"
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium transition-colors"
              style={{ color: "#01696F" }}
            >
              Learn more about Chameleon Golf
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-6 flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 rounded-xl px-4 py-3 text-sm outline-none placeholder:opacity-50"
              style={{
                backgroundColor: "var(--cg-bg-tertiary)",
                color: "var(--cg-text-primary)",
                border: "1px solid var(--cg-border)",
              }}
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl px-6 py-3 text-sm font-semibold transition-all hover:-translate-y-0.5 disabled:opacity-60 whitespace-nowrap"
              style={{
                backgroundColor: "#01696F",
                color: "#ffffff",
                boxShadow: "0 8px 30px rgba(1, 105, 111, 0.25)",
              }}
            >
              {loading ? "Joining..." : "Get Early Access"}
            </button>
          </form>
        )}
        {error && (
          <p className="mt-2 text-sm" style={{ color: "var(--cg-error)" }}>
            {error}
          </p>
        )}
      </div>
    </section>
  );
}

function FromTheFairway() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/fairway?limit=4&featured=true")
      .then((r) => r.json())
      .then((data) => setItems(data.content || []))
      .catch(() => {});
  }, []);

  if (items.length === 0) return null;

  const typeColors: Record<string, { bg: string; text: string }> = {
    article: { bg: "rgba(59,130,246,0.15)", text: "#60a5fa" },
    video: { bg: "rgba(239,68,68,0.15)", text: "#f87171" },
    podcast: { bg: "rgba(168,85,247,0.15)", text: "#c084fc" },
  };

  return (
    <section
      className="py-16 sm:py-20"
      style={{
        backgroundColor: "var(--cg-bg-secondary)",
        borderTop: "1px solid var(--cg-border-subtle)",
      }}
    >
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2
              className="text-2xl font-bold sm:text-3xl"
              style={{ color: "var(--cg-text-primary)" }}
            >
              From The Fairway
            </h2>
            <p
              className="mt-2 text-sm"
              style={{ color: "var(--cg-text-secondary)" }}
            >
              Curated golf architecture content — articles, videos, and podcasts
            </p>
          </div>
          <Link
            href="/fairway"
            className="inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-medium transition-all"
            style={{
              border: "1px solid var(--cg-border)",
              color: "var(--cg-accent)",
            }}
          >
            Explore The Fairway
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item: any) => {
            const colors = typeColors[item.contentType] || { bg: "var(--cg-bg-tertiary)", text: "var(--cg-text-muted)" };
            return (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-xl overflow-hidden transition-all hover:ring-1 hover:ring-emerald-500/40"
                style={{
                  backgroundColor: "var(--cg-bg-card)",
                  border: "1px solid var(--cg-border)",
                }}
              >
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="text-[10px] font-medium rounded-full px-2 py-0.5"
                      style={{ backgroundColor: colors.bg, color: colors.text }}
                    >
                      {item.contentType}
                    </span>
                    {item.sourceName && (
                      <span className="text-[10px]" style={{ color: "var(--cg-text-muted)" }}>
                        {item.sourceName}
                      </span>
                    )}
                  </div>
                  <h3
                    className="text-sm font-semibold line-clamp-2 group-hover:text-emerald-400 transition-colors"
                    style={{ color: "var(--cg-text-primary)" }}
                  >
                    {item.title}
                  </h3>
                  {item.summary && (
                    <p
                      className="text-xs mt-2 line-clamp-2"
                      style={{ color: "var(--cg-text-muted)" }}
                    >
                      {item.summary}
                    </p>
                  )}
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  const { data: session, status } = useSession();
  const [activeSource, setActiveSource] = useState(0);
  const stats = useSiteStats();

  // Show nothing while checking auth (prevents flash)
  if (status === "loading") {
    return null;
  }

  return (
    <div style={{ backgroundColor: "var(--cg-bg-primary)" }}>
      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden">
        {/* Procedural contour line background */}
        <ContourBackground />

        <div className="relative mx-auto max-w-7xl px-4 pt-20 pb-24 sm:pt-28 sm:pb-32" style={{ zIndex: 4 }}>
          <div className="max-w-3xl">
            {/* Tag */}
            <div
              className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium"
              style={{
                backgroundColor: "var(--cg-accent-bg)",
                color: "var(--cg-accent)",
                border: "1px solid var(--cg-accent-muted)",
              }}
            >
              <Zap className="h-3.5 w-3.5" />
              Rankings that adapt to you
            </div>

            <h1
              className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
              style={{ color: "var(--cg-text-primary)" }}
            >
              Every major golf ranking.{" "}
              <span style={{ color: "var(--cg-accent)" }}>One engine.</span>
            </h1>

            <p
              className="mt-6 text-lg leading-relaxed sm:text-xl max-w-2xl"
              style={{ color: "var(--cg-text-secondary)" }}
            >
              golfEQUALIZER aggregates Golf Digest, Golfweek, GOLF Magazine, and
              Top100GolfCourses — then lets you re-weight them based on what matters
              to you. Explore {fmt(stats.rankingLists)} ranking lists from {fmt(stats.rankingSources)} trusted sources.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                href="/explore"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-8 py-3.5 text-base font-semibold transition-all hover:-translate-y-0.5"
                style={{
                  backgroundColor: "var(--cg-accent)",
                  color: "var(--cg-text-inverse)",
                  boxShadow: `0 8px 30px var(--cg-accent-glow)`,
                }}
              >
                Explore {fmt(stats.courses)} Courses
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/rankings"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-8 py-3.5 text-base font-medium transition-all"
                style={{
                  border: "1px solid var(--cg-border)",
                  color: "var(--cg-text-secondary)",
                }}
              >
                Browse All {fmt(stats.rankingLists)} Lists
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Quick links */}
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/architects"
                className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-80"
                style={{ color: "var(--cg-accent)" }}
              >
                {fmt(stats.architects)} Architects
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/fairway"
                className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-80"
                style={{ color: "var(--cg-accent)" }}
              >
                The Fairway — Articles & Media
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/performance"
                className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-80"
                style={{ color: "var(--cg-accent)" }}
              >
                Performance Center
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Stats bar */}
            <div
              className="mt-10 flex flex-wrap gap-6 text-sm"
              style={{ color: "var(--cg-text-muted)" }}
            >
              <span>
                <strong style={{ color: "var(--cg-accent)" }}>{fmt(stats.rankingSources)}</strong> ranking sources
              </span>
              <span>
                <strong style={{ color: "var(--cg-accent)" }}>{fmt(stats.rankingLists)}</strong> ranking lists
              </span>
              <span>
                <strong style={{ color: "var(--cg-accent)" }}>{fmt(stats.rankingEntries)}</strong> ranked entries
              </span>
              <span>
                <strong style={{ color: "var(--cg-accent)" }}>{fmt(stats.courses)}</strong> courses
              </span>
              <span>
                <strong style={{ color: "var(--cg-accent)" }}>{fmt(stats.architects)}</strong> architects
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── RANKING SOURCES (Main Feature) ─── */}
      <section id="rankings" className="py-20 sm:py-24" style={{ backgroundColor: "var(--cg-bg-secondary)" }}>
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-12">
            <h2
              className="text-2xl font-bold sm:text-3xl lg:text-4xl"
              style={{ color: "var(--cg-text-primary)" }}
            >
              The Sources Behind the Scores
            </h2>
            <p
              className="mt-4 mx-auto max-w-2xl text-base"
              style={{ color: "var(--cg-text-secondary)" }}
            >
              Each ranking publication has its own methodology, panel composition, and
              criteria. Dig into how they think, why they rank differently, and which
              one aligns with your values.
            </p>
          </div>

          {/* Source Selector Tabs */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {RANKING_SOURCES.map((source, i) => (
              <button
                key={source.slug}
                onClick={() => setActiveSource(i)}
                className="flex items-center gap-2.5 rounded-xl px-5 py-3 text-sm font-semibold transition-all"
                style={{
                  backgroundColor: activeSource === i ? "var(--cg-accent-bg)" : "var(--cg-bg-tertiary)",
                  color: activeSource === i ? "var(--cg-accent)" : "var(--cg-text-secondary)",
                  border: `1.5px solid ${activeSource === i ? "var(--cg-accent)" : "var(--cg-border)"}`,
                }}
              >
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold text-white"
                  style={{ backgroundColor: source.color }}
                >
                  {source.logo}
                </span>
                <span className="hidden sm:inline">{source.name}</span>
              </button>
            ))}
          </div>

          {/* Active Source Detail Card */}
          {(() => {
            const s = RANKING_SOURCES[activeSource];
            return (
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  backgroundColor: "var(--cg-bg-card)",
                  border: "1px solid var(--cg-border)",
                }}
              >
                {/* Header */}
                <div
                  className="px-8 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                  style={{
                    borderBottom: "1px solid var(--cg-border)",
                    background: `linear-gradient(135deg, var(--cg-bg-tertiary), var(--cg-bg-card))`,
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-xl text-lg font-bold text-white shadow-lg"
                      style={{ backgroundColor: s.color }}
                    >
                      {s.logo}
                    </div>
                    <div>
                      <h3
                        className="text-xl font-bold"
                        style={{ color: "var(--cg-text-primary)" }}
                      >
                        {s.name}
                      </h3>
                      <p className="text-sm" style={{ color: "var(--cg-text-muted)" }}>
                        {s.founded} · Authority Weight: {s.authorityWeight.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                      style={{
                        color: "var(--cg-accent)",
                        border: "1px solid var(--cg-accent-muted)",
                      }}
                    >
                      Visit Source <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>

                {/* Body */}
                <div className="p-8">
                  <div className="grid gap-8 lg:grid-cols-5">
                    {/* Methodology */}
                    <div className="lg:col-span-3">
                      <div className="flex items-center gap-2 mb-3">
                        <BookOpen className="h-4 w-4" style={{ color: "var(--cg-accent)" }} />
                        <h4
                          className="text-sm font-semibold uppercase tracking-wider"
                          style={{ color: "var(--cg-text-muted)" }}
                        >
                          Methodology
                        </h4>
                      </div>
                      <p
                        className="text-base leading-relaxed"
                        style={{ color: "var(--cg-text-secondary)" }}
                      >
                        {s.methodology}
                      </p>
                    </div>

                    {/* Stats + Key Lists */}
                    <div className="lg:col-span-2 space-y-6">
                      {/* Quick stats */}
                      <div className="grid grid-cols-2 gap-3">
                        <div
                          className="rounded-xl p-4 text-center"
                          style={{ backgroundColor: "var(--cg-bg-tertiary)" }}
                        >
                          <div className="text-2xl font-bold" style={{ color: "var(--cg-accent)" }}>
                            {s.listCount}
                          </div>
                          <div className="text-xs mt-1" style={{ color: "var(--cg-text-muted)" }}>
                            Lists
                          </div>
                        </div>
                        <div
                          className="rounded-xl p-4 text-center"
                          style={{ backgroundColor: "var(--cg-bg-tertiary)" }}
                        >
                          <div className="text-2xl font-bold" style={{ color: "var(--cg-accent)" }}>
                            ~{s.entryCount}
                          </div>
                          <div className="text-xs mt-1" style={{ color: "var(--cg-text-muted)" }}>
                            Entries
                          </div>
                        </div>
                      </div>

                      {/* Key Lists */}
                      <div>
                        <h4
                          className="text-xs font-semibold uppercase tracking-wider mb-3"
                          style={{ color: "var(--cg-text-muted)" }}
                        >
                          Key Lists
                        </h4>
                        <div className="space-y-2">
                          {s.keyLists.map((list) => (
                            <div
                              key={list}
                              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm"
                              style={{
                                backgroundColor: "var(--cg-bg-tertiary)",
                                color: "var(--cg-text-secondary)",
                              }}
                            >
                              <Trophy className="h-3.5 w-3.5 flex-shrink-0" style={{ color: s.color }} />
                              {list}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer — open access */}
                <div
                  className="px-8 py-5 flex items-center justify-between"
                  style={{
                    borderTop: "1px solid var(--cg-border)",
                    backgroundColor: "var(--cg-bg-tertiary)",
                  }}
                >
                  <div className="flex items-center gap-2 text-sm" style={{ color: "var(--cg-text-muted)" }}>
                    <Trophy className="h-3.5 w-3.5" style={{ color: "var(--cg-accent)" }} />
                    View every list and every ranked course
                  </div>
                  <Link
                    href="/rankings"
                    className="text-sm font-medium transition-colors"
                    style={{ color: "var(--cg-accent)" }}
                  >
                    Browse All Lists →
                  </Link>
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section
        className="py-20 sm:py-24"
        style={{
          backgroundColor: "var(--cg-bg-primary)",
          borderTop: "1px solid var(--cg-border-subtle)",
        }}
      >
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center">
            <h2
              className="text-2xl font-bold sm:text-3xl"
              style={{ color: "var(--cg-text-primary)" }}
            >
              Not just another ranking. A ranking engine.
            </h2>
            <p
              className="mt-4 mx-auto max-w-2xl text-base"
              style={{ color: "var(--cg-text-secondary)" }}
            >
              Traditional golf rankings are static — one committee's opinion frozen
              in time. golfEQUALIZER is dynamic. It synthesizes multiple sources
              and your preferences into a score that adapts.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: BarChart3,
                title: "Aggregated Intelligence",
                desc: "We pull rankings from 4 trusted publications. Each source is weighted by authority, and the best ranking per source feeds into a composite CF Score.",
              },
              {
                icon: SlidersHorizontal,
                title: "Your Filters, Your Rankings",
                desc: "Care more about walkability than exclusivity? Prefer links over parkland? Adjust the sliders and watch rankings shift to reflect what matters to you.",
              },
              {
                icon: Trophy,
                title: "The CF Score",
                desc: "Our algorithm combines expert rankings with community ratings, weighted by your profile. A score that factors in what matters to you.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl p-8 transition-colors"
                style={{
                  backgroundColor: "var(--cg-bg-card)",
                  border: "1px solid var(--cg-border)",
                }}
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ backgroundColor: "var(--cg-accent-bg)", color: "var(--cg-accent)" }}
                >
                  <item.icon className="h-6 w-6" />
                </div>
                <h3
                  className="mt-5 text-lg font-semibold"
                  style={{ color: "var(--cg-text-primary)" }}
                >
                  {item.title}
                </h3>
                <p
                  className="mt-3 text-sm leading-relaxed"
                  style={{ color: "var(--cg-text-secondary)" }}
                >
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── STATS + FEATURES ─── */}
      <section
        className="py-20 sm:py-24"
        style={{
          backgroundColor: "var(--cg-bg-secondary)",
          borderTop: "1px solid var(--cg-border-subtle)",
        }}
      >
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <div>
              <h2
                className="text-2xl font-bold sm:text-3xl"
                style={{ color: "var(--cg-text-primary)" }}
              >
                Everything you need to plan your next round
              </h2>
              <p
                className="mt-4 text-base max-w-lg"
                style={{ color: "var(--cg-text-secondary)" }}
              >
                More than rankings — a complete golf course discovery platform built
                for serious golfers who travel.
              </p>

              <div className="mt-10 space-y-6">
                {[
                  {
                    icon: Star,
                    title: "Rate & Review",
                    desc: "Score 10 dimensions — conditioning, design, pace, aesthetics, challenge, value, amenities, walkability, service, and more.",
                  },
                  {
                    icon: MapPin,
                    title: "Airport Proximity",
                    desc: "Every course mapped to the nearest commercial, regional, and FBO/private airports within 250 miles.",
                  },
                  {
                    icon: TrendingUp,
                    title: "Score Verification",
                    desc: "Post scores with GHIN verification. Screenshots and API cross-referencing ensure every posted score is legitimate.",
                  },
                ].map((f) => (
                  <div key={f.title} className="flex gap-4">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-text-secondary)" }}
                    >
                      <f.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3
                        className="text-sm font-semibold"
                        style={{ color: "var(--cg-text-primary)" }}
                      >
                        {f.title}
                      </h3>
                      <p
                        className="mt-1 text-sm"
                        style={{ color: "var(--cg-text-secondary)" }}
                      >
                        {f.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: fmt(stats.courses), label: "Ranked Courses" },
                { value: fmt(stats.rankingSources), label: "Ranking Sources" },
                { value: fmt(stats.rankingLists), label: "Ranking Lists" },
                { value: fmt(stats.airports), label: "Airports Mapped" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl p-6 text-center"
                  style={{
                    backgroundColor: "var(--cg-bg-card)",
                    border: "1px solid var(--cg-border)",
                  }}
                >
                  <div className="text-3xl font-bold" style={{ color: "var(--cg-accent)" }}>
                    {stat.value}
                  </div>
                  <div className="mt-1 text-sm" style={{ color: "var(--cg-text-muted)" }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── WAITLIST CTA ─── */}
      <WaitlistCTA />

      {/* ─── FROM THE FAIRWAY ─── */}
      <FromTheFairway />

      {/* ─── CTA ─── */}
      <section
        className="py-20 sm:py-24"
        style={{
          backgroundColor: "var(--cg-bg-tertiary)",
          borderTop: "1px solid var(--cg-border-subtle)",
        }}
      >
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2
            className="text-2xl font-bold sm:text-3xl"
            style={{ color: "var(--cg-text-primary)" }}
          >
            Ready to find your next great round?
          </h2>
          <p
            className="mt-4 text-base"
            style={{ color: "var(--cg-text-secondary)" }}
          >
            Browse the world's best courses, filter by what you care about, and
            discover courses you've never heard of — ranked alongside the ones you have.
          </p>
          <Link
            href="/explore"
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl px-8 py-3.5 text-base font-semibold transition-all hover:-translate-y-0.5"
            style={{
              backgroundColor: "var(--cg-accent)",
              color: "var(--cg-text-inverse)",
              boxShadow: `0 8px 30px var(--cg-accent-glow)`,
            }}
          >
            Start Exploring
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
