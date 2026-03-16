"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { Loader2, TrendingUp, Gem, Scale, ArrowUp, ArrowDown } from "lucide-react";

type Tab = "consensus" | "hidden-gems" | "vs-experts";

interface ConsensusItem {
  courseId: number;
  course: { courseId: number; courseName: string; city: string; state: string };
  consensusScore: number;
  agreementLevel: number;
  comparedToNational: number | null;
  outlierCount: number;
}

interface HiddenGem {
  courseId: number;
  course: { courseId: number; courseName: string; city: string; state: string };
  circleAvgScore: number;
  ratingCount: number;
}

interface Comparison {
  courseId: number;
  course: { courseId: number; courseName: string; city: string; state: string };
  circleRating: number;
  ratingCount: number;
  nationalScore: number | null;
  golfDigestRank: number | null;
  golfweekRank: number | null;
  golfMagRank: number | null;
  divergence: number | null;
}

export default function CircleAnalysisPage() {
  const { data: session, status: authStatus } = useSession();
  const params = useParams();
  const circleId = params.id as string;

  const [tab, setTab] = useState<Tab>("consensus");
  const [loading, setLoading] = useState(true);
  const [consensus, setConsensus] = useState<ConsensusItem[]>([]);
  const [hiddenGems, setHiddenGems] = useState<HiddenGem[]>([]);
  const [comparisons, setComparisons] = useState<Comparison[]>([]);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    setLoading(true);

    let url = "";
    if (tab === "consensus") url = `/api/circles/${circleId}/consensus?sort=agreement&limit=50`;
    else if (tab === "hidden-gems") url = `/api/circles/${circleId}/consensus/hidden-gems?limit=50`;
    else url = `/api/circles/${circleId}/consensus/vs-experts?limit=50`;

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (tab === "consensus") setConsensus(data.consensus || []);
        else if (tab === "hidden-gems") setHiddenGems(data.hiddenGems || []);
        else setComparisons(data.comparisons || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [authStatus, circleId, tab]);

  if (authStatus === "loading") {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--cg-accent)" }} />
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: "consensus", label: "Consensus", icon: TrendingUp },
    { key: "hidden-gems", label: "Hidden Gems", icon: Gem },
    { key: "vs-experts", label: "vs. Experts", icon: Scale },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-display text-2xl font-bold mb-2" style={{ color: "var(--cg-text-primary)" }}>
        Circle Analysis
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--cg-text-muted)" }}>
        See where your circle agrees, discover hidden gems, and compare with expert rankings
      </p>

      {/* Tabs */}
      <div
        className="flex gap-1 rounded-lg p-1 mb-6"
        style={{ backgroundColor: "var(--cg-bg-secondary)" }}
      >
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors"
            style={{
              backgroundColor: tab === key ? "var(--cg-bg-card)" : "transparent",
              color: tab === key ? "var(--cg-text-primary)" : "var(--cg-text-muted)",
              boxShadow: tab === key ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            }}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--cg-accent)" }} />
        </div>
      ) : tab === "consensus" ? (
        <ConsensusTab items={consensus} />
      ) : tab === "hidden-gems" ? (
        <HiddenGemsTab items={hiddenGems} />
      ) : (
        <VsExpertsTab items={comparisons} />
      )}
    </div>
  );
}

function ConsensusTab({ items }: { items: ConsensusItem[] }) {
  if (items.length === 0) {
    return <EmptyState message="No consensus data yet. Rate more courses as a circle to see analysis." />;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.courseId}
          className="rounded-xl p-4"
          style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: "var(--cg-text-primary)" }}>
                {item.course.courseName}
              </h3>
              <p className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
                {item.course.city}, {item.course.state}
              </p>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold" style={{ color: "var(--cg-accent)" }}>
                {item.consensusScore.toFixed(1)}
              </span>
              <p className="text-xs" style={{ color: "var(--cg-text-muted)" }}>circle avg</p>
            </div>
          </div>

          {/* Agreement bar */}
          <div className="mb-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs" style={{ color: "var(--cg-text-secondary)" }}>Agreement</span>
              <span className="text-xs font-medium" style={{ color: "var(--cg-text-primary)" }}>
                {Math.round(item.agreementLevel * 100)}%
              </span>
            </div>
            <div className="h-2 rounded-full" style={{ backgroundColor: "var(--cg-bg-tertiary)" }}>
              <div
                className="h-2 rounded-full transition-all"
                style={{
                  width: `${item.agreementLevel * 100}%`,
                  backgroundColor: item.agreementLevel > 0.7 ? "#22c55e" : item.agreementLevel > 0.4 ? "#f59e0b" : "#ef4444",
                }}
              />
            </div>
          </div>

          {/* Compared to national */}
          {item.comparedToNational !== null && (
            <div className="flex items-center gap-1 text-xs" style={{ color: "var(--cg-text-secondary)" }}>
              {item.comparedToNational > 0 ? (
                <ArrowUp className="h-3 w-3" style={{ color: "#22c55e" }} />
              ) : item.comparedToNational < 0 ? (
                <ArrowDown className="h-3 w-3" style={{ color: "#ef4444" }} />
              ) : null}
              <span>
                {item.comparedToNational > 0 ? "+" : ""}
                {item.comparedToNational.toFixed(1)} vs national avg
              </span>
              {item.outlierCount > 0 && (
                <span className="ml-2" style={{ color: "var(--cg-text-muted)" }}>
                  &middot; {item.outlierCount} outlier{item.outlierCount > 1 ? "s" : ""}
                </span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function HiddenGemsTab({ items }: { items: HiddenGem[] }) {
  if (items.length === 0) {
    return <EmptyState message="No hidden gems found yet. Keep rating courses that aren't on national lists!" />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {items.map((gem) => (
        <div
          key={gem.courseId}
          className="rounded-xl p-4"
          style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: "var(--cg-text-primary)" }}>
                {gem.course.courseName}
              </h3>
              <p className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
                {gem.course.city}, {gem.course.state}
              </p>
            </div>
            <div
              className="rounded-full px-2 py-0.5 text-xs font-medium"
              style={{ backgroundColor: "var(--cg-accent-muted)", color: "var(--cg-accent)" }}
            >
              <Gem className="h-3 w-3 inline mr-1" />
              Gem
            </div>
          </div>
          <div className="flex items-center gap-4 mt-3">
            <div>
              <span className="text-xl font-bold" style={{ color: "var(--cg-accent)" }}>
                {gem.circleAvgScore.toFixed(1)}
              </span>
              <p className="text-xs" style={{ color: "var(--cg-text-muted)" }}>circle rating</p>
            </div>
            <div>
              <span className="text-sm font-medium" style={{ color: "var(--cg-text-primary)" }}>
                {gem.ratingCount}
              </span>
              <p className="text-xs" style={{ color: "var(--cg-text-muted)" }}>ratings</p>
            </div>
            <div
              className="text-xs px-2 py-1 rounded"
              style={{ backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-text-muted)" }}
            >
              Not nationally ranked
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function VsExpertsTab({ items }: { items: Comparison[] }) {
  if (items.length === 0) {
    return <EmptyState message="No comparison data available. Rate courses that appear on national lists to see how your circle compares." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--cg-border)" }}>
            <th className="text-left py-3 px-2 font-medium" style={{ color: "var(--cg-text-secondary)" }}>Course</th>
            <th className="text-center py-3 px-2 font-medium" style={{ color: "var(--cg-text-secondary)" }}>Circle</th>
            <th className="text-center py-3 px-2 font-medium" style={{ color: "var(--cg-text-secondary)" }}>National</th>
            <th className="text-center py-3 px-2 font-medium" style={{ color: "var(--cg-text-secondary)" }}>GD Rank</th>
            <th className="text-center py-3 px-2 font-medium" style={{ color: "var(--cg-text-secondary)" }}>GW Rank</th>
            <th className="text-center py-3 px-2 font-medium" style={{ color: "var(--cg-text-secondary)" }}>GM Rank</th>
            <th className="text-center py-3 px-2 font-medium" style={{ color: "var(--cg-text-secondary)" }}>Delta</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const bigDivergence = item.divergence !== null && Math.abs(item.divergence) > 2;
            return (
              <tr
                key={item.courseId}
                style={{
                  borderBottom: "1px solid var(--cg-border)",
                  backgroundColor: bigDivergence ? "var(--cg-accent-muted)" : "transparent",
                }}
              >
                <td className="py-3 px-2">
                  <span className="font-medium" style={{ color: "var(--cg-text-primary)" }}>
                    {item.course.courseName}
                  </span>
                  <br />
                  <span className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
                    {item.course.city}, {item.course.state}
                  </span>
                </td>
                <td className="text-center py-3 px-2 font-bold" style={{ color: "var(--cg-accent)" }}>
                  {item.circleRating.toFixed(1)}
                </td>
                <td className="text-center py-3 px-2" style={{ color: "var(--cg-text-primary)" }}>
                  {item.nationalScore?.toFixed(1) ?? "—"}
                </td>
                <td className="text-center py-3 px-2" style={{ color: "var(--cg-text-secondary)" }}>
                  {item.golfDigestRank ?? "—"}
                </td>
                <td className="text-center py-3 px-2" style={{ color: "var(--cg-text-secondary)" }}>
                  {item.golfweekRank ?? "—"}
                </td>
                <td className="text-center py-3 px-2" style={{ color: "var(--cg-text-secondary)" }}>
                  {item.golfMagRank ?? "—"}
                </td>
                <td className="text-center py-3 px-2">
                  {item.divergence !== null ? (
                    <span
                      className="font-medium"
                      style={{ color: item.divergence > 0 ? "#22c55e" : item.divergence < 0 ? "#ef4444" : "var(--cg-text-primary)" }}
                    >
                      {item.divergence > 0 ? "+" : ""}
                      {item.divergence.toFixed(1)}
                    </span>
                  ) : (
                    <span style={{ color: "var(--cg-text-muted)" }}>—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div
      className="rounded-xl p-8 text-center"
      style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
    >
      <p style={{ color: "var(--cg-text-muted)" }}>{message}</p>
    </div>
  );
}
