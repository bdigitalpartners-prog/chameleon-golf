"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Trophy,
  ChevronRight,
  Loader2,
  ExternalLink,
  ListOrdered,
  Globe,
  Star,
  Filter,
  ArrowUpDown,
} from "lucide-react";

interface RankingList {
  listId: number;
  listName: string;
  prestigeTier: string;
  listWeight: string;
  yearPublished: number;
  region: string | null;
  _count: { entries: number };
}

interface RankingSource {
  sourceId: number;
  sourceName: string;
  sourceUrl: string | null;
  methodologyNotes: string | null;
  authorityWeight: string;
  lists: RankingList[];
}

const SOURCE_COLORS: Record<string, string> = {
  "Golf Digest": "#c41230",
  Golfweek: "#1e5aa8",
  "GOLF.com / GOLF Magazine": "#007a33",
  "Top100GolfCourses.com": "#ff8c00",
};

const SOURCE_LOGOS: Record<string, string> = {
  "Golf Digest": "GD",
  Golfweek: "GW",
  "GOLF.com / GOLF Magazine": "GM",
  "Top100GolfCourses.com": "T1",
};

const PRESTIGE_ORDER: Record<string, number> = {
  flagship: 0,
  national: 1,
  regional: 2,
  specialty: 3,
};

const PRESTIGE_LABELS: Record<string, string> = {
  flagship: "Flagship",
  national: "National",
  regional: "Regional",
  specialty: "Specialty",
};

export default function RankingsPage() {
  const [sources, setSources] = useState<RankingSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSource, setActiveSource] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetch("/api/rankings")
      .then((r) => r.json())
      .then((data) => {
        setSources(data);
        if (data.length > 0) setActiveSource(data[0].sourceId);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const totalLists = sources.reduce((a, s) => a + s.lists.length, 0);
  const totalEntries = sources.reduce(
    (a, s) => a + s.lists.reduce((b, l) => b + l._count.entries, 0),
    0
  );

  const filteredSource = sources.find((s) => s.sourceId === activeSource);
  const filteredLists = (filteredSource?.lists ?? [])
    .filter(
      (l) =>
        !searchTerm ||
        l.listName.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      // Pin "100 Greatest Golf Courses" to the very top
      const aIsGreatest = /100 Greatest Golf Courses$/i.test(a.listName) ? 0 : 1;
      const bIsGreatest = /100 Greatest Golf Courses$/i.test(b.listName) ? 0 : 1;
      if (aIsGreatest !== bIsGreatest) return aIsGreatest - bIsGreatest;

      // Then sort by prestige tier
      const tierDiff =
        (PRESTIGE_ORDER[a.prestigeTier] ?? 9) -
        (PRESTIGE_ORDER[b.prestigeTier] ?? 9);
      if (tierDiff !== 0) return tierDiff;

      // Then alphabetically
      return a.listName.localeCompare(b.listName);
    });

  // Group by prestige tier
  const grouped = filteredLists.reduce(
    (acc, list) => {
      const tier = list.prestigeTier || "regional";
      if (!acc[tier]) acc[tier] = [];
      acc[tier].push(list);
      return acc;
    },
    {} as Record<string, RankingList[]>
  );

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--cg-bg-primary)" }}
    >
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="font-display text-3xl font-bold md:text-4xl"
            style={{ color: "var(--cg-text-primary)" }}
          >
            Ranking Lists
          </h1>
          <p
            className="mt-2 text-base max-w-2xl"
            style={{ color: "var(--cg-text-secondary)" }}
          >
            Browse all {totalLists} ranking lists from {sources.length} trusted
            sources. Click any list to see every ranked course.
          </p>

          {/* Summary stats */}
          <div
            className="mt-4 flex flex-wrap gap-5 text-sm"
            style={{ color: "var(--cg-text-muted)" }}
          >
            <span>
              <strong style={{ color: "var(--cg-accent)" }}>
                {sources.length}
              </strong>{" "}
              Sources
            </span>
            <span>
              <strong style={{ color: "var(--cg-accent)" }}>
                {totalLists}
              </strong>{" "}
              Lists
            </span>
            <span>
              <strong style={{ color: "var(--cg-accent)" }}>
                {totalEntries.toLocaleString()}
              </strong>{" "}
              Ranked Entries
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2
              className="h-8 w-8 animate-spin"
              style={{ color: "var(--cg-accent)" }}
            />
          </div>
        ) : (
          <>
            {/* Source tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              {sources.map((source) => {
                const color =
                  SOURCE_COLORS[source.sourceName] ?? "var(--cg-accent)";
                const isActive = activeSource === source.sourceId;
                return (
                  <button
                    key={source.sourceId}
                    onClick={() => {
                      setActiveSource(source.sourceId);
                      setSearchTerm("");
                    }}
                    className="flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all"
                    style={{
                      backgroundColor: isActive
                        ? "var(--cg-accent-bg)"
                        : "var(--cg-bg-tertiary)",
                      color: isActive
                        ? "var(--cg-accent)"
                        : "var(--cg-text-secondary)",
                      border: `1.5px solid ${isActive ? "var(--cg-accent)" : "var(--cg-border)"}`,
                    }}
                  >
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold text-white"
                      style={{ backgroundColor: color }}
                    >
                      {SOURCE_LOGOS[source.sourceName] ?? "?"}
                    </span>
                    <span className="hidden sm:inline">
                      {source.sourceName}
                    </span>
                    <span
                      className="text-xs rounded-full px-2 py-0.5"
                      style={{
                        backgroundColor: isActive
                          ? "var(--cg-accent-muted)"
                          : "var(--cg-bg-card)",
                        color: isActive
                          ? "var(--cg-accent)"
                          : "var(--cg-text-muted)",
                      }}
                    >
                      {source.lists.length}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search within source */}
            <div className="mb-6">
              <input
                type="text"
                placeholder="Filter lists..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full max-w-sm rounded-lg px-4 py-2.5 text-sm outline-none transition-colors"
                style={{
                  backgroundColor: "var(--cg-bg-tertiary)",
                  border: "1px solid var(--cg-border)",
                  color: "var(--cg-text-primary)",
                }}
              />
            </div>

            {/* Source info bar */}
            {filteredSource && (
              <div
                className="mb-6 rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                style={{
                  backgroundColor: "var(--cg-bg-card)",
                  border: "1px solid var(--cg-border)",
                }}
              >
                <div>
                  <h2
                    className="text-lg font-semibold"
                    style={{ color: "var(--cg-text-primary)" }}
                  >
                    {filteredSource.sourceName}
                  </h2>
                  {filteredSource.methodologyNotes && (
                    <p
                      className="mt-1 text-xs leading-relaxed max-w-2xl"
                      style={{ color: "var(--cg-text-muted)" }}
                    >
                      {filteredSource.methodologyNotes}
                    </p>
                  )}
                </div>
                {filteredSource.sourceUrl && (
                  <a
                    href={filteredSource.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium shrink-0 transition-colors"
                    style={{
                      color: "var(--cg-accent)",
                      border: "1px solid var(--cg-accent-muted)",
                    }}
                  >
                    Visit Source <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            )}

            {/* Lists grouped by prestige tier */}
            {Object.entries(grouped)
              .sort(
                ([a], [b]) =>
                  (PRESTIGE_ORDER[a] ?? 9) - (PRESTIGE_ORDER[b] ?? 9)
              )
              .map(([tier, lists]) => (
                <div key={tier} className="mb-8">
                  <div className="flex items-center gap-2 mb-3">
                    <Star
                      className="h-3.5 w-3.5"
                      style={{
                        color:
                          tier === "flagship"
                            ? "var(--cg-accent)"
                            : "var(--cg-text-muted)",
                      }}
                    />
                    <h3
                      className="text-xs font-semibold uppercase tracking-wider"
                      style={{ color: "var(--cg-text-muted)" }}
                    >
                      {PRESTIGE_LABELS[tier] ?? tier} Lists
                    </h3>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {lists.map((list) => {
                      const sourceColor =
                        SOURCE_COLORS[filteredSource?.sourceName ?? ""] ??
                        "var(--cg-accent)";
                      return (
                        <Link
                          key={list.listId}
                          href={`/rankings/${list.listId}`}
                          className="group rounded-xl p-4 transition-all hover:-translate-y-0.5"
                          style={{
                            backgroundColor: "var(--cg-bg-card)",
                            border: "1px solid var(--cg-border)",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor =
                              "var(--cg-accent)";
                            e.currentTarget.style.backgroundColor =
                              "var(--cg-bg-card-hover)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor =
                              "var(--cg-border)";
                            e.currentTarget.style.backgroundColor =
                              "var(--cg-bg-card)";
                          }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5">
                                <Trophy
                                  className="h-3.5 w-3.5 shrink-0"
                                  style={{ color: sourceColor }}
                                />
                                <h4
                                  className="text-sm font-semibold truncate"
                                  style={{ color: "var(--cg-text-primary)" }}
                                >
                                  {list.listName}
                                </h4>
                              </div>

                              <div
                                className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs"
                                style={{ color: "var(--cg-text-muted)" }}
                              >
                                <span className="flex items-center gap-1">
                                  <ListOrdered className="h-3 w-3" />
                                  {list._count.entries} courses
                                </span>
                                {list.region && (
                                  <span className="flex items-center gap-1">
                                    <Globe className="h-3 w-3" />
                                    {list.region}
                                  </span>
                                )}
                                <span>{list.yearPublished}</span>
                              </div>
                            </div>

                            <ChevronRight
                              className="h-4 w-4 shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              style={{ color: "var(--cg-accent)" }}
                            />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}

            {filteredLists.length === 0 && (
              <div
                className="py-16 text-center"
                style={{ color: "var(--cg-text-muted)" }}
              >
                No lists match your search.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
