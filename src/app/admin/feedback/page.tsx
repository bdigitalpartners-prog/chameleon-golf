"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import {
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Users,
  MessageSquare,
  Lightbulb,
  CheckCircle,
} from "lucide-react";

/* ── Types ── */

interface Submission {
  id: number;
  fullName: string;
  email: string;
  handicapIndex: string | null;
  homeCourse: string | null;
  howFound: string | null;
  contentIdeas: string | null;
  contentChecklist: string | null;
  toolIdeas: string | null;
  toolChecklist: string | null;
  courseIntelligence: string | null;
  courseIntelChecklist: string | null;
  generalFeedback: string | null;
  interestLevel: string | null;
  submittedAt: string;
}

interface Suggestion {
  text: string;
  category: string;
  sources: string[];
  count: number;
}

/* ── Helpers ── */

const ADMIN_KEY = () =>
  typeof window !== "undefined"
    ? sessionStorage.getItem("golfEQ_admin_key") || ""
    : "";

function fetchAdmin(url: string) {
  return fetch(url, {
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": ADMIN_KEY(),
    },
  });
}

function safeParseJson(val: string | null): string[] {
  if (!val) return [];
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function extractSuggestions(submissions: Submission[]): Suggestion[] {
  const map = new Map<string, { category: string; sources: Set<string> }>();

  for (const sub of submissions) {
    const name = sub.fullName || sub.email;

    // Content ideas
    for (const item of safeParseJson(sub.contentChecklist)) {
      if (item === "Other") continue;
      const key = `Content Ideas::${item}`;
      const existing = map.get(key);
      if (existing) {
        existing.sources.add(name);
      } else {
        map.set(key, { category: "Content Ideas", sources: new Set([name]) });
      }
    }
    if (sub.contentIdeas?.trim()) {
      const key = `Content Ideas::${sub.contentIdeas.trim()}`;
      const existing = map.get(key);
      if (existing) {
        existing.sources.add(name);
      } else {
        map.set(key, { category: "Content Ideas", sources: new Set([name]) });
      }
    }

    // Tool/feature ideas
    for (const item of safeParseJson(sub.toolChecklist)) {
      if (item === "Other") continue;
      const key = `Tool/Feature Ideas::${item}`;
      const existing = map.get(key);
      if (existing) {
        existing.sources.add(name);
      } else {
        map.set(key, {
          category: "Tool/Feature Ideas",
          sources: new Set([name]),
        });
      }
    }
    if (sub.toolIdeas?.trim()) {
      const key = `Tool/Feature Ideas::${sub.toolIdeas.trim()}`;
      const existing = map.get(key);
      if (existing) {
        existing.sources.add(name);
      } else {
        map.set(key, {
          category: "Tool/Feature Ideas",
          sources: new Set([name]),
        });
      }
    }

    // Course intelligence
    for (const item of safeParseJson(sub.courseIntelChecklist)) {
      if (item === "Other") continue;
      const key = `Course Intelligence::${item}`;
      const existing = map.get(key);
      if (existing) {
        existing.sources.add(name);
      } else {
        map.set(key, {
          category: "Course Intelligence",
          sources: new Set([name]),
        });
      }
    }
    if (sub.courseIntelligence?.trim()) {
      const key = `Course Intelligence::${sub.courseIntelligence.trim()}`;
      const existing = map.get(key);
      if (existing) {
        existing.sources.add(name);
      } else {
        map.set(key, {
          category: "Course Intelligence",
          sources: new Set([name]),
        });
      }
    }

    // General feedback
    if (sub.generalFeedback?.trim()) {
      const key = `General::${sub.generalFeedback.trim()}`;
      const existing = map.get(key);
      if (existing) {
        existing.sources.add(name);
      } else {
        map.set(key, { category: "General", sources: new Set([name]) });
      }
    }
  }

  return Array.from(map.entries())
    .map(([key, val]) => ({
      text: key.split("::")[1],
      category: val.category,
      sources: Array.from(val.sources),
      count: val.sources.size,
    }))
    .sort((a, b) => b.count - a.count);
}

const CATEGORY_COLORS: Record<string, string> = {
  "Content Ideas": "bg-blue-500/10 text-blue-500",
  "Tool/Feature Ideas": "bg-purple-500/10 text-purple-500",
  "Course Intelligence": "bg-amber-500/10 text-amber-500",
  General: "bg-gray-500/10 text-gray-400",
};

/* ── Page Component ── */

export default function FeedbackPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"submissions" | "suggestions">(
    "submissions"
  );
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [backlogItems, setBacklogItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Load backlog state from localStorage
    try {
      const stored = localStorage.getItem("golfEQ_feedback_backlog");
      if (stored) setBacklogItems(new Set(JSON.parse(stored)));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchAdmin("/api/admin/feedback")
      .then((r) => r.json())
      .then((data) => setSubmissions(data.submissions || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggleBacklog = (key: string) => {
    setBacklogItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      localStorage.setItem(
        "golfEQ_feedback_backlog",
        JSON.stringify(Array.from(next))
      );
      return next;
    });
  };

  const suggestions = extractSuggestions(submissions);

  const tabs = [
    { key: "submissions" as const, label: "Submissions" },
    { key: "suggestions" as const, label: "Suggestions" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-gray-500">
          Loading feedback submissions...
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Advisory Feedback</h1>
        <p className="mt-1 text-sm text-gray-400">
          Founding Advisory questionnaire submissions &amp; extracted
          suggestions
        </p>
      </div>

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Submissions"
          value={submissions.length.toString()}
        />
        <StatCard
          icon={<Lightbulb className="h-5 w-5" />}
          label="Unique Suggestions"
          value={suggestions.length.toString()}
        />
        <StatCard
          icon={<MessageSquare className="h-5 w-5" />}
          label="With General Feedback"
          value={submissions
            .filter((s) => s.generalFeedback?.trim())
            .length.toString()}
        />
        <StatCard
          icon={<CheckCircle className="h-5 w-5" />}
          label="Added to Backlog"
          value={backlogItems.size.toString()}
        />
      </div>

      {/* Tab bar */}
      <div className="mb-6 flex gap-1 rounded-lg bg-[#111111] p-1 w-fit border border-gray-800">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === t.key
                ? "bg-green-500 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Submissions Tab ── */}
      {activeTab === "submissions" && (
        <div className="rounded-xl border border-gray-800 bg-[#111111] overflow-hidden">
          <div className="border-b border-gray-800 px-5 py-3">
            <h3 className="text-sm font-semibold text-gray-400">
              All Submissions ({submissions.length})
            </h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Name
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Email
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Handicap
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Home Course
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Submitted
                </th>
                <th className="px-5 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub) => (
                <SubmissionRow
                  key={sub.id}
                  submission={sub}
                  expanded={expandedId === sub.id}
                  onToggle={() =>
                    setExpandedId(expandedId === sub.id ? null : sub.id)
                  }
                />
              ))}
              {submissions.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-8 text-center text-gray-500"
                  >
                    No feedback submissions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Suggestions Tab ── */}
      {activeTab === "suggestions" && (
        <div className="space-y-6">
          {["Content Ideas", "Tool/Feature Ideas", "Course Intelligence", "General"].map(
            (category) => {
              const items = suggestions.filter(
                (s) => s.category === category
              );
              if (items.length === 0) return null;
              return (
                <div
                  key={category}
                  className="rounded-xl border border-gray-800 bg-[#111111] overflow-hidden"
                >
                  <div className="border-b border-gray-800 px-5 py-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-400">
                      {category}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {items.length} suggestion
                      {items.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="divide-y divide-gray-800/50">
                    {items.map((item) => {
                      const key = `${item.category}::${item.text}`;
                      const inBacklog = backlogItems.has(key);
                      return (
                        <div
                          key={key}
                          className="flex items-start gap-4 px-5 py-3"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">
                              {item.text}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              {item.count}{" "}
                              {item.count === 1 ? "person" : "people"}
                              {" — "}
                              {item.sources.join(", ")}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs ${
                                CATEGORY_COLORS[item.category] ||
                                "bg-gray-500/10 text-gray-400"
                              }`}
                            >
                              {item.count}x
                            </span>
                            <button
                              onClick={() => toggleBacklog(key)}
                              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                                inBacklog
                                  ? "bg-green-500/10 text-green-500"
                                  : "bg-gray-800 text-gray-400 hover:text-white"
                              }`}
                            >
                              {inBacklog ? "Added" : "Add to Backlog"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }
          )}
          {suggestions.length === 0 && (
            <div className="rounded-xl border border-gray-800 bg-[#111111] px-5 py-8 text-center text-gray-500">
              No suggestions extracted yet. Submissions will appear here once
              feedback is received.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Submission Row ── */

function SubmissionRow({
  submission: sub,
  expanded,
  onToggle,
}: {
  submission: Submission;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        className="border-b border-gray-800/50 cursor-pointer hover:bg-gray-900/30"
        onClick={onToggle}
      >
        <td className="px-5 py-3 font-medium text-white">
          {sub.fullName || "—"}
        </td>
        <td className="px-5 py-3 text-gray-400">{sub.email || "—"}</td>
        <td className="px-5 py-3 text-gray-400">
          {sub.handicapIndex || "—"}
        </td>
        <td className="px-5 py-3 text-gray-400">{sub.homeCourse || "—"}</td>
        <td className="px-5 py-3 text-gray-400 whitespace-nowrap">
          {new Date(sub.submittedAt).toLocaleDateString()}
        </td>
        <td className="px-5 py-3">
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-gray-800/50">
          <td colSpan={6} className="px-5 py-4 bg-gray-900/20">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Contact info */}
              <DetailSection title="Contact Info">
                <DetailRow label="Name" value={sub.fullName} />
                <DetailRow label="Email" value={sub.email} />
                <DetailRow label="Handicap" value={sub.handicapIndex} />
                <DetailRow label="Home Course" value={sub.homeCourse} />
                <DetailRow label="How Found" value={sub.howFound} />
              </DetailSection>

              {/* Interest level */}
              <DetailSection title="Interest Level">
                <DetailRow label="Level" value={sub.interestLevel} />
              </DetailSection>

              {/* Content ideas */}
              <DetailSection title="Content Ideas">
                <ChecklistDisplay items={sub.contentChecklist} />
                {sub.contentIdeas && (
                  <p className="mt-2 text-sm text-gray-300 italic">
                    &ldquo;{sub.contentIdeas}&rdquo;
                  </p>
                )}
              </DetailSection>

              {/* Tool/feature ideas */}
              <DetailSection title="Tool/Feature Ideas">
                <ChecklistDisplay items={sub.toolChecklist} />
                {sub.toolIdeas && (
                  <p className="mt-2 text-sm text-gray-300 italic">
                    &ldquo;{sub.toolIdeas}&rdquo;
                  </p>
                )}
              </DetailSection>

              {/* Course intelligence */}
              <DetailSection title="Course Intelligence">
                <ChecklistDisplay items={sub.courseIntelChecklist} />
                {sub.courseIntelligence && (
                  <p className="mt-2 text-sm text-gray-300 italic">
                    &ldquo;{sub.courseIntelligence}&rdquo;
                  </p>
                )}
              </DetailSection>

              {/* General feedback */}
              <DetailSection title="General Feedback">
                {sub.generalFeedback ? (
                  <p className="text-sm text-gray-300">
                    {sub.generalFeedback}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">None provided</p>
                )}
              </DetailSection>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/* ── Small Components ── */

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">
        {title}
      </h4>
      {children}
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-gray-500 shrink-0">{label}:</span>
      <span className="text-gray-300">{value || "—"}</span>
    </div>
  );
}

function ChecklistDisplay({ items }: { items: string | null }) {
  const parsed = safeParseJson(items);
  if (parsed.length === 0) {
    return <p className="text-sm text-gray-500">None selected</p>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {parsed.map((item) => (
        <span
          key={item}
          className="rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs text-green-500"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-gray-800 bg-[#111111] p-4">
      <div className="mb-2 flex items-center gap-2">
        <div className="text-green-500">{icon}</div>
        <span className="text-xs font-medium text-gray-500">{label}</span>
      </div>
      <div className="text-lg font-bold text-white truncate">{value}</div>
    </div>
  );
}
