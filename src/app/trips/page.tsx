"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Loader2,
  Plus,
  MapPin,
  Calendar,
  Users,
  Plane,
  Sparkles,
  LayoutTemplate,
  List,
  Search,
  X,
  DollarSign,
  ChevronRight,
  Clock,
  Flag,
  Send,
  Wand2,
} from "lucide-react";
import { TripCard } from "@/components/trips/TripCard";

/* ─── Types ─── */
type Trip = {
  id: string;
  name: string;
  destination: string;
  description?: string;
  startDate: string;
  endDate: string;
  budget?: string;
  groupSize?: number;
  status: string;
  groupMatchScore?: number;
  participants: {
    id: string;
    userId: string;
    role: string;
    rsvpStatus: string;
    user: { id: string; name?: string; email?: string; image?: string };
  }[];
  rounds: any[];
  _count: { expenses: number; itinerary: number };
};

type TripTemplate = {
  id: number;
  slug: string;
  title: string;
  destination: string;
  region: string;
  description: string;
  days: number;
  estimatedCostLow: number;
  estimatedCostHigh: number;
  imageUrl: string | null;
  courses: { name: string; day: number; notes: string }[];
  highlights: string[];
  style: string | null;
};

type AISuggestion = {
  title: string;
  destination: string;
  days: number;
  players: number;
  itinerary: {
    day: number;
    course: {
      courseId: number;
      courseName: string;
      city: string | null;
      state: string | null;
      greenFeeLow: number | null;
      greenFeeHigh: number | null;
      chameleonScore: number | null;
      courseStyle: string | null;
      primaryImageUrl: string | null;
    };
    teeTimePreference: string;
    notes: string;
  }[];
  estimatedCosts: {
    totalGreenFees: number;
    estimatedLodgingTotal: number;
    estimatedPerPerson: number;
  };
  coursesFound: number;
};

/* ─── Tabs ─── */
const TABS = [
  { id: "trips", label: "My Trips", icon: List },
  { id: "ai", label: "AI Generator", icon: Sparkles },
  { id: "templates", label: "Templates", icon: LayoutTemplate },
] as const;

type TabId = (typeof TABS)[number]["id"];

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "planning", label: "Planning" },
  { value: "confirmed", label: "Confirmed" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
] as const;

/* ─── Template Card ─── */
function TemplateCard({
  template,
  onUse,
}: {
  template: TripTemplate;
  onUse: (t: TripTemplate) => void;
}) {
  const STYLE_COLORS: Record<string, string> = {
    links: "#3B82F6",
    desert: "#F59E0B",
    parkland: "#22C55E",
  };

  return (
    <div
      className="rounded-xl overflow-hidden transition-all hover:scale-[1.01]"
      style={{
        backgroundColor: "var(--cg-bg-card)",
        border: "1px solid var(--cg-border)",
      }}
    >
      {/* Gradient header */}
      <div
        className="relative h-36 flex items-end p-4"
        style={{
          background: `linear-gradient(135deg, ${
            STYLE_COLORS[template.style || "links"] || "#3B82F6"
          }44, var(--cg-bg-card))`,
        }}
      >
        {template.style && (
          <span
            className="absolute top-3 right-3 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase"
            style={{
              backgroundColor: `${STYLE_COLORS[template.style] || "#666"}33`,
              color: STYLE_COLORS[template.style] || "#999",
            }}
          >
            {template.style}
          </span>
        )}
        <div>
          <h3
            className="font-display text-lg font-bold leading-tight"
            style={{ color: "var(--cg-text-primary)" }}
          >
            {template.title}
          </h3>
          <div
            className="flex items-center gap-1 mt-1 text-xs"
            style={{ color: "var(--cg-text-muted)" }}
          >
            <MapPin className="h-3 w-3" />
            {template.destination}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "var(--cg-text-secondary)" }}>
          {template.description}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs" style={{ color: "var(--cg-text-muted)" }}>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {template.days} days
          </span>
          <span className="flex items-center gap-1">
            <Flag className="h-3 w-3" />
            {template.courses.length} courses
          </span>
          <span className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            ${template.estimatedCostLow?.toLocaleString()} - ${template.estimatedCostHigh?.toLocaleString()}
          </span>
        </div>

        {/* Course names */}
        <div className="flex flex-wrap gap-1">
          {template.courses.slice(0, 4).map((c, i) => (
            <span
              key={i}
              className="rounded-md px-2 py-0.5 text-[10px] font-medium"
              style={{
                backgroundColor: "var(--cg-bg-tertiary)",
                color: "var(--cg-text-secondary)",
              }}
            >
              {c.name}
            </span>
          ))}
          {template.courses.length > 4 && (
            <span className="text-[10px] py-0.5" style={{ color: "var(--cg-text-muted)" }}>
              +{template.courses.length - 4} more
            </span>
          )}
        </div>

        {/* Highlights */}
        {template.highlights.length > 0 && (
          <ul className="space-y-1">
            {template.highlights.slice(0, 3).map((h, i) => (
              <li
                key={i}
                className="flex items-center gap-1.5 text-[11px]"
                style={{ color: "var(--cg-text-secondary)" }}
              >
                <span style={{ color: "var(--cg-accent)" }}>•</span>
                {h}
              </li>
            ))}
          </ul>
        )}

        <button
          onClick={() => onUse(template)}
          className="w-full rounded-lg py-2 text-sm font-medium transition-all"
          style={{
            backgroundColor: "var(--cg-accent)",
            color: "var(--cg-text-inverse)",
          }}
        >
          Use This Template
        </button>
      </div>
    </div>
  );
}

/* ─── AI Suggestion Card ─── */
function AISuggestionCard({ suggestion }: { suggestion: AISuggestion }) {
  return (
    <div
      className="rounded-xl p-5 space-y-4"
      style={{
        backgroundColor: "var(--cg-bg-card)",
        border: "1px solid var(--cg-accent-muted)",
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4" style={{ color: "var(--cg-accent)" }} />
            <h3
              className="font-display text-lg font-bold"
              style={{ color: "var(--cg-text-primary)" }}
            >
              {suggestion.title}
            </h3>
          </div>
          <p className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
            {suggestion.days} days • {suggestion.players} players •{" "}
            {suggestion.itinerary.length} courses found
          </p>
        </div>
        <div className="text-right">
          <div
            className="text-sm font-bold"
            style={{ color: "var(--cg-accent)" }}
          >
            ~${suggestion.estimatedCosts.estimatedPerPerson.toLocaleString()}/person
          </div>
          <div className="text-[10px]" style={{ color: "var(--cg-text-muted)" }}>
            estimated total
          </div>
        </div>
      </div>

      {/* Itinerary */}
      <div className="space-y-2">
        {suggestion.itinerary.map((item) => (
          <div
            key={item.day}
            className="flex items-center gap-3 rounded-lg p-3"
            style={{ backgroundColor: "var(--cg-bg-tertiary)" }}
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold flex-shrink-0"
              style={{
                backgroundColor: "var(--cg-accent)",
                color: "var(--cg-text-inverse)",
              }}
            >
              D{item.day}
            </div>
            <div className="flex-1 min-w-0">
              <div
                className="text-sm font-medium truncate"
                style={{ color: "var(--cg-text-primary)" }}
              >
                {item.course.courseName}
              </div>
              <div className="flex items-center gap-2 text-[11px]" style={{ color: "var(--cg-text-muted)" }}>
                {item.course.city && (
                  <span>
                    {item.course.city}
                    {item.course.state ? `, ${item.course.state}` : ""}
                  </span>
                )}
                {item.course.courseStyle && (
                  <span
                    className="rounded px-1.5 py-0.5"
                    style={{
                      backgroundColor: "var(--cg-bg-card)",
                      color: "var(--cg-text-secondary)",
                    }}
                  >
                    {item.course.courseStyle}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              {item.course.chameleonScore != null && (
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold"
                  style={{
                    backgroundColor:
                      item.course.chameleonScore >= 80
                        ? "var(--cg-accent)"
                        : item.course.chameleonScore >= 50
                          ? "#eab308"
                          : "var(--cg-bg-tertiary)",
                    color:
                      item.course.chameleonScore >= 50
                        ? "var(--cg-text-inverse)"
                        : "var(--cg-text-secondary)",
                  }}
                >
                  {Math.round(item.course.chameleonScore)}
                </div>
              )}
              {item.course.greenFeeLow != null && (
                <div className="text-[10px] mt-0.5" style={{ color: "var(--cg-text-muted)" }}>
                  ${item.course.greenFeeLow}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Cost summary */}
      <div
        className="rounded-lg p-3 flex items-center justify-between"
        style={{
          backgroundColor: "var(--cg-accent-bg)",
          border: "1px solid var(--cg-accent-muted)",
        }}
      >
        <span className="text-xs font-medium" style={{ color: "var(--cg-text-secondary)" }}>
          Estimated costs
        </span>
        <div className="flex gap-4 text-xs" style={{ color: "var(--cg-text-primary)" }}>
          <span>
            Green fees: <strong>${suggestion.estimatedCosts.totalGreenFees.toLocaleString()}</strong>
          </span>
          <span>
            Lodging: <strong>${suggestion.estimatedCosts.estimatedLodgingTotal.toLocaleString()}</strong>
          </span>
        </div>
      </div>

      <p className="text-[11px]" style={{ color: "var(--cg-text-muted)" }}>
        This is an AI-generated suggestion based on course data. Customize by creating a trip and
        editing the itinerary.
      </p>
    </div>
  );
}

/* ─── Main Page ─── */
export default function TripsPage() {
  const { data: session, status: authStatus } = useSession();
  const [activeTab, setActiveTab] = useState<TabId>("trips");
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  // Templates
  const [templates, setTemplates] = useState<TripTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);

  // AI Generator
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Load trips
  useEffect(() => {
    if (authStatus !== "authenticated") return;
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);

    fetch(`/api/trips?${params}`)
      .then((r) => r.json())
      .then((data) => setTrips(data.trips ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [authStatus, statusFilter]);

  // Load templates when tab switches
  useEffect(() => {
    if (activeTab !== "templates" || templates.length > 0) return;
    setTemplatesLoading(true);
    fetch("/api/trips/templates")
      .then((r) => r.json())
      .then((data) => setTemplates(data.templates ?? []))
      .catch(console.error)
      .finally(() => setTemplatesLoading(false));
  }, [activeTab, templates.length]);

  const handleAiGenerate = useCallback(async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiError(null);
    setAiSuggestion(null);

    try {
      const res = await fetch("/api/trips/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate");
      setAiSuggestion(data.suggestion);
    } catch (err: any) {
      setAiError(err.message);
    } finally {
      setAiLoading(false);
    }
  }, [aiPrompt]);

  const handleUseTemplate = useCallback(
    (template: TripTemplate) => {
      // Navigate to new trip page with template data in URL params
      const params = new URLSearchParams({
        template: template.slug,
        name: template.title,
        destination: template.destination,
        days: String(template.days),
      });
      window.location.href = `/trips/new?${params}`;
    },
    []
  );

  if (authStatus === "loading") {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--cg-accent)" }} />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <Plane className="mx-auto h-16 w-16" style={{ color: "var(--cg-text-muted)" }} />
        <h1
          className="mt-4 font-display text-2xl font-bold"
          style={{ color: "var(--cg-text-primary)" }}
        >
          Sign in to plan trips
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--cg-text-muted)" }}>
          Create and manage golf trips, use AI to generate itineraries, and explore curated templates
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1
              className="font-display text-2xl font-bold"
              style={{ color: "var(--cg-text-primary)" }}
            >
              Trip Intelligence
            </h1>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              style={{ backgroundColor: "var(--cg-accent)", color: "var(--cg-text-inverse)" }}
            >
              NEW
            </span>
          </div>
          <p className="text-sm mt-1" style={{ color: "var(--cg-text-muted)" }}>
            Plan golf trips with AI assistance, explore templates, or build your own
          </p>
        </div>
        <Link
          href="/trips/new"
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all"
          style={{ backgroundColor: "var(--cg-accent)", color: "var(--cg-text-inverse)" }}
        >
          <Plus className="h-4 w-4" /> New Trip
        </Link>
      </div>

      {/* Tab nav */}
      <div
        className="flex gap-1 mb-6 rounded-xl p-1"
        style={{ backgroundColor: "var(--cg-bg-tertiary)" }}
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all flex-1 justify-center"
              style={{
                backgroundColor: isActive ? "var(--cg-bg-card)" : "transparent",
                color: isActive ? "var(--cg-text-primary)" : "var(--cg-text-muted)",
                boxShadow: isActive ? "0 1px 3px rgba(0,0,0,0.2)" : "none",
              }}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ─── My Trips Tab ─── */}
      {activeTab === "trips" && (
        <>
          {/* Status filter pills */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className="rounded-full px-3 py-1 text-xs font-medium transition-all"
                style={{
                  backgroundColor:
                    statusFilter === f.value
                      ? "var(--cg-accent)"
                      : "var(--cg-bg-tertiary)",
                  color:
                    statusFilter === f.value
                      ? "var(--cg-text-inverse)"
                      : "var(--cg-text-secondary)",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2
                className="h-6 w-6 animate-spin"
                style={{ color: "var(--cg-accent)" }}
              />
            </div>
          ) : trips.length === 0 ? (
            <div
              className="rounded-xl p-8 text-center"
              style={{
                backgroundColor: "var(--cg-bg-card)",
                border: "1px solid var(--cg-border)",
              }}
            >
              <MapPin
                className="mx-auto h-10 w-10"
                style={{ color: "var(--cg-text-muted)" }}
              />
              <h3
                className="mt-3 font-display text-lg font-semibold"
                style={{ color: "var(--cg-text-primary)" }}
              >
                No trips yet
              </h3>
              <p className="mt-1 text-sm" style={{ color: "var(--cg-text-muted)" }}>
                Create your first golf trip or try the AI generator
              </p>
              <div className="flex gap-3 justify-center mt-4">
                <Link
                  href="/trips/new"
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
                  style={{
                    backgroundColor: "var(--cg-accent)",
                    color: "var(--cg-text-inverse)",
                  }}
                >
                  <Plus className="h-4 w-4" /> Create Trip
                </Link>
                <button
                  onClick={() => setActiveTab("ai")}
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
                  style={{
                    backgroundColor: "var(--cg-bg-tertiary)",
                    color: "var(--cg-text-secondary)",
                    border: "1px solid var(--cg-border)",
                  }}
                >
                  <Sparkles className="h-4 w-4" /> Try AI Generator
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {trips.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
          )}
        </>
      )}

      {/* ─── AI Generator Tab ─── */}
      {activeTab === "ai" && (
        <div className="space-y-6">
          <div
            className="rounded-xl p-6"
            style={{
              backgroundColor: "var(--cg-bg-card)",
              border: "1px solid var(--cg-border)",
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Wand2 className="h-5 w-5" style={{ color: "var(--cg-accent)" }} />
              <h2
                className="font-display text-lg font-semibold"
                style={{ color: "var(--cg-text-primary)" }}
              >
                AI Trip Generator
              </h2>
            </div>
            <p className="text-sm mb-4" style={{ color: "var(--cg-text-muted)" }}>
              Describe your dream golf trip in natural language and we&apos;ll generate a
              suggested itinerary with courses, estimated costs, and lodging.
            </p>

            {/* Prompt input */}
            <div className="flex gap-2">
              <div
                className="flex-1 flex items-center gap-2 rounded-xl px-4 py-3"
                style={{
                  backgroundColor: "var(--cg-bg-tertiary)",
                  border: "1px solid var(--cg-border)",
                }}
              >
                <Search className="h-4 w-4 shrink-0" style={{ color: "var(--cg-text-muted)" }} />
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAiGenerate()}
                  placeholder="e.g., 4-day golf trip to Pinehurst for 4 players, budget $2000/person"
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: "var(--cg-text-primary)" }}
                />
                {aiPrompt && (
                  <button onClick={() => { setAiPrompt(""); setAiSuggestion(null); }}>
                    <X className="h-4 w-4" style={{ color: "var(--cg-text-muted)" }} />
                  </button>
                )}
              </div>
              <button
                onClick={handleAiGenerate}
                disabled={aiLoading || !aiPrompt.trim()}
                className="rounded-xl px-5 py-3 text-sm font-medium transition-all disabled:opacity-40"
                style={{
                  backgroundColor: "var(--cg-accent)",
                  color: "var(--cg-text-inverse)",
                }}
              >
                {aiLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Quick suggestions */}
            <div className="flex flex-wrap gap-2 mt-3">
              {[
                "3-day trip to Bandon Dunes for 4 players",
                "Weekend desert golf in Scottsdale, budget $1500",
                "5-day Scottish links pilgrimage",
                "Myrtle Beach buddies trip, 4 days, budget $800/person",
              ].map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setAiPrompt(s);
                    setAiSuggestion(null);
                  }}
                  className="rounded-full px-3 py-1 text-[11px] font-medium transition-all"
                  style={{
                    backgroundColor: "var(--cg-bg-tertiary)",
                    color: "var(--cg-text-muted)",
                    border: "1px solid var(--cg-border)",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* AI Error */}
          {aiError && (
            <div
              className="rounded-xl p-4 text-sm"
              style={{
                backgroundColor: "rgba(239,68,68,0.1)",
                color: "#ef4444",
                border: "1px solid rgba(239,68,68,0.2)",
              }}
            >
              {aiError}
            </div>
          )}

          {/* AI Loading */}
          {aiLoading && (
            <div className="flex items-center justify-center py-12 gap-3">
              <Loader2
                className="h-5 w-5 animate-spin"
                style={{ color: "var(--cg-accent)" }}
              />
              <span className="text-sm" style={{ color: "var(--cg-text-muted)" }}>
                Generating your itinerary...
              </span>
            </div>
          )}

          {/* AI Suggestion */}
          {aiSuggestion && !aiLoading && (
            <AISuggestionCard suggestion={aiSuggestion} />
          )}
        </div>
      )}

      {/* ─── Templates Tab ─── */}
      {activeTab === "templates" && (
        <div>
          {templatesLoading ? (
            <div className="flex justify-center py-12">
              <Loader2
                className="h-6 w-6 animate-spin"
                style={{ color: "var(--cg-accent)" }}
              />
            </div>
          ) : templates.length === 0 ? (
            <div
              className="rounded-xl p-8 text-center"
              style={{
                backgroundColor: "var(--cg-bg-card)",
                border: "1px solid var(--cg-border)",
              }}
            >
              <LayoutTemplate
                className="mx-auto h-10 w-10"
                style={{ color: "var(--cg-text-muted)" }}
              />
              <h3
                className="mt-3 font-display text-lg font-semibold"
                style={{ color: "var(--cg-text-primary)" }}
              >
                No templates available yet
              </h3>
              <p className="mt-1 text-sm" style={{ color: "var(--cg-text-muted)" }}>
                Trip templates are being curated. Check back soon!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((t) => (
                <TemplateCard key={t.id} template={t} onUse={handleUseTemplate} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
