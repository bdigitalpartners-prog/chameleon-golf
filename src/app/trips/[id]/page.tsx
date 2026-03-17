"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  MapPin,
  Calendar,
  Users,
  ArrowLeft,
  Star,
  Clock,
  Utensils,
  Plane,
  Activity,
  Flag,
  DollarSign,
  UserPlus,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { ExpenseTracker } from "@/components/trips/ExpenseTracker";

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
  groupMatchScore?: string | number;
  createdById: string;
  createdBy: { id: string; name?: string; email?: string; image?: string };
  participants: {
    id: string;
    userId: string;
    role: string;
    rsvpStatus: string;
    user: {
      id: string;
      name?: string;
      email?: string;
      image?: string;
      handicapIndex?: string | number;
    };
  }[];
  rounds: {
    id: string;
    courseId: number;
    playDate?: string;
    teeTime?: string;
    matchScore?: string | number;
    notes?: string;
    course: {
      courseId: number;
      courseName: string;
      facilityName?: string;
      city?: string;
      state?: string;
      country?: string;
      greenFeeLow?: string | number;
      greenFeeHigh?: string | number;
    };
  }[];
  expenses: {
    id: string;
    description: string;
    amount: string | number;
    category?: string;
    paidById: string;
    splitType: string;
    splitData?: any;
    paidBy: { id: string; name?: string; image?: string };
    createdAt: string;
  }[];
  itinerary: {
    id: string;
    dayNumber: number;
    itemType: string;
    title: string;
    description?: string;
    location?: string;
    startTime?: string;
    endTime?: string;
    sortOrder: number;
  }[];
};

type GroupMatchData = {
  overallGroupMatchScore: number | null;
  courseResults: any[];
  participantCount: number;
  roundCount: number;
};

const TABS = ["Overview", "Rounds", "Itinerary", "Expenses"] as const;
type Tab = (typeof TABS)[number];

const TAB_ICONS = {
  Overview: Activity,
  Rounds: Flag,
  Itinerary: Calendar,
  Expenses: DollarSign,
};

const ITEM_TYPE_ICONS: Record<string, any> = {
  golf: Flag,
  dining: Utensils,
  travel: Plane,
  activity: Star,
};

const STATUS_COLORS: Record<string, string> = {
  planning: "#f59e0b",
  confirmed: "#22c55e",
  active: "#3b82f6",
  completed: "#6b7280",
};

export default function TripDetailPage() {
  const { data: session, status: authStatus } = useSession();
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("Overview");
  const [groupMatch, setGroupMatch] = useState<GroupMatchData | null>(null);
  const [loadingGroupMatch, setLoadingGroupMatch] = useState(false);
  const [generatingItinerary, setGeneratingItinerary] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  const fetchTrip = useCallback(async () => {
    try {
      const res = await fetch(`/api/trips/${tripId}`);
      if (!res.ok) throw new Error("Failed to fetch trip");
      const data = await res.json();
      setTrip(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    if (authStatus === "authenticated") {
      fetchTrip();
    }
  }, [authStatus, fetchTrip]);

  const fetchGroupMatch = async () => {
    setLoadingGroupMatch(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/group-match`);
      if (res.ok) {
        const data = await res.json();
        setGroupMatch(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingGroupMatch(false);
    }
  };

  const generateItinerary = async () => {
    setGeneratingItinerary(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/ai-itinerary`, {
        method: "POST",
      });
      if (res.ok) {
        await fetchTrip();
        setTab("Itinerary");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingItinerary(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });
      if (res.ok) {
        setInviteEmail("");
        await fetchTrip();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setInviting(false);
    }
  };

  if (authStatus === "loading" || loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--cg-accent)" }} />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-xl font-bold" style={{ color: "var(--cg-text-primary)" }}>
          Trip not found
        </h1>
        <Link href="/trips" className="text-sm mt-2 inline-block" style={{ color: "var(--cg-accent)" }}>
          Back to trips
        </Link>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const dayCount =
    Math.ceil(
      (new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) /
        (1000 * 60 * 60 * 24)
    ) + 1;

  const isOrganizer =
    trip.createdById === (session?.user as any)?.id ||
    trip.participants.some(
      (p) => p.userId === (session?.user as any)?.id && p.role === "organizer"
    );

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Back link */}
      <Link
        href="/trips"
        className="inline-flex items-center gap-1 text-sm mb-4 transition-colors"
        style={{ color: "var(--cg-text-muted)" }}
      >
        <ArrowLeft className="h-4 w-4" /> All Trips
      </Link>

      {/* Trip header */}
      <div
        className="rounded-xl p-6 mb-6"
        style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <h1 className="font-display text-2xl font-bold" style={{ color: "var(--cg-text-primary)" }}>
              {trip.name}
            </h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="inline-flex items-center gap-1 text-sm" style={{ color: "var(--cg-text-muted)" }}>
                <MapPin className="h-3.5 w-3.5" /> {trip.destination}
              </span>
              <span className="inline-flex items-center gap-1 text-sm" style={{ color: "var(--cg-text-muted)" }}>
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(trip.startDate)} - {formatDate(trip.endDate)} ({dayCount} days)
              </span>
              <span className="inline-flex items-center gap-1 text-sm" style={{ color: "var(--cg-text-muted)" }}>
                <Users className="h-3.5 w-3.5" /> {trip.participants.length} participants
              </span>
            </div>
          </div>
          <span
            className="rounded-full px-3 py-1 text-xs font-medium capitalize"
            style={{
              backgroundColor: `${STATUS_COLORS[trip.status] ?? "#6b7280"}20`,
              color: STATUS_COLORS[trip.status] ?? "#6b7280",
            }}
          >
            {trip.status}
          </span>
        </div>

        {trip.description && (
          <p className="text-sm mt-2" style={{ color: "var(--cg-text-secondary)" }}>
            {trip.description}
          </p>
        )}

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="rounded-lg p-3" style={{ backgroundColor: "var(--cg-bg-tertiary)" }}>
            <div className="text-xs" style={{ color: "var(--cg-text-muted)" }}>Rounds</div>
            <div className="text-lg font-bold" style={{ color: "var(--cg-text-primary)" }}>
              {trip.rounds.length}
            </div>
          </div>
          <div className="rounded-lg p-3" style={{ backgroundColor: "var(--cg-bg-tertiary)" }}>
            <div className="text-xs" style={{ color: "var(--cg-text-muted)" }}>Expenses</div>
            <div className="text-lg font-bold" style={{ color: "var(--cg-text-primary)" }}>
              {trip.expenses.length}
            </div>
          </div>
          <div className="rounded-lg p-3" style={{ backgroundColor: "var(--cg-bg-tertiary)" }}>
            <div className="text-xs" style={{ color: "var(--cg-text-muted)" }}>Budget</div>
            <div className="text-lg font-bold" style={{ color: "var(--cg-text-primary)" }}>
              {trip.budget ?? "N/A"}
            </div>
          </div>
          <div className="rounded-lg p-3" style={{ backgroundColor: "var(--cg-bg-tertiary)" }}>
            <div className="text-xs" style={{ color: "var(--cg-text-muted)" }}>Group Match</div>
            <div className="text-lg font-bold" style={{ color: "var(--cg-accent)" }}>
              {trip.groupMatchScore ? `${Number(trip.groupMatchScore).toFixed(1)}` : "--"}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 rounded-lg p-1" style={{ backgroundColor: "var(--cg-bg-secondary)" }}>
        {TABS.map((t) => {
          const Icon = TAB_ICONS[t];
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all"
              style={{
                backgroundColor: tab === t ? "var(--cg-bg-card)" : "transparent",
                color: tab === t ? "var(--cg-text-primary)" : "var(--cg-text-muted)",
              }}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{t}</span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {tab === "Overview" && (
        <div className="space-y-6">
          {/* Participants */}
          <div
            className="rounded-xl p-5"
            style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
          >
            <h2 className="font-display text-lg font-semibold mb-4" style={{ color: "var(--cg-text-primary)" }}>
              Participants
            </h2>
            <div className="space-y-3">
              {trip.participants.map((p) => (
                <div key={p.id} className="flex items-center gap-3">
                  <div
                    className="h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
                    style={{ backgroundColor: "var(--cg-bg-tertiary)" }}
                  >
                    {p.user.image ? (
                      <img src={p.user.image} alt="" className="h-9 w-9 rounded-full object-cover" />
                    ) : (
                      <Users className="h-4 w-4" style={{ color: "var(--cg-text-muted)" }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate" style={{ color: "var(--cg-text-primary)" }}>
                        {p.user.name ?? p.user.email ?? "Unknown"}
                      </span>
                      {p.role === "organizer" && (
                        <span
                          className="text-[10px] rounded-full px-2 py-0.5 font-medium"
                          style={{ backgroundColor: "var(--cg-accent)", color: "var(--cg-text-inverse)" }}
                        >
                          Organizer
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs" style={{ color: "var(--cg-text-muted)" }}>
                      {p.user.handicapIndex != null && (
                        <span>HI: {Number(p.user.handicapIndex).toFixed(1)}</span>
                      )}
                      <span className="capitalize">{p.rsvpStatus}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Invite form */}
            {isOrganizer && (
              <div className="flex gap-2 mt-4 pt-4" style={{ borderTop: "1px solid var(--cg-border)" }}>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Invite by email..."
                  className="flex-1 rounded-lg px-3 py-2 text-sm"
                  style={{
                    backgroundColor: "var(--cg-bg-tertiary)",
                    color: "var(--cg-text-primary)",
                    border: "1px solid var(--cg-border)",
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                />
                <button
                  onClick={handleInvite}
                  disabled={inviting || !inviteEmail.trim()}
                  className="rounded-lg px-3 py-2 text-sm font-medium transition-all disabled:opacity-30"
                  style={{ backgroundColor: "var(--cg-accent)", color: "var(--cg-text-inverse)" }}
                >
                  {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                </button>
              </div>
            )}
          </div>

          {/* Group Match Score */}
          <div
            className="rounded-xl p-5"
            style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold" style={{ color: "var(--cg-text-primary)" }}>
                Group Match Score
              </h2>
              <button
                onClick={fetchGroupMatch}
                disabled={loadingGroupMatch || trip.rounds.length === 0}
                className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-30"
                style={{ backgroundColor: "var(--cg-accent)", color: "var(--cg-text-inverse)" }}
              >
                {loadingGroupMatch ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  "Calculate"
                )}
              </button>
            </div>

            {trip.rounds.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--cg-text-muted)" }}>
                Add planned rounds to calculate the group match score.
              </p>
            ) : groupMatch ? (
              <div>
                <div className="text-center mb-4">
                  <div className="text-4xl font-bold" style={{ color: "var(--cg-accent)" }}>
                    {groupMatch.overallGroupMatchScore?.toFixed(1) ?? "--"}
                  </div>
                  <div className="text-xs mt-1" style={{ color: "var(--cg-text-muted)" }}>
                    Overall Group Match
                  </div>
                </div>
                {groupMatch.courseResults.length > 0 && (
                  <div className="space-y-2">
                    {groupMatch.courseResults.map((cr, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-lg p-2"
                        style={{ backgroundColor: "var(--cg-bg-tertiary)" }}
                      >
                        <span className="text-sm" style={{ color: "var(--cg-text-primary)" }}>
                          {cr.courseName}
                        </span>
                        <span className="text-sm font-bold" style={{ color: "var(--cg-accent)" }}>
                          {cr.groupMatchScore.toFixed(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm" style={{ color: "var(--cg-text-muted)" }}>
                Click Calculate to compute the group match score based on participants' EQ profiles.
              </p>
            )}
          </div>

          {/* AI Itinerary shortcut */}
          {isOrganizer && (
            <div
              className="rounded-xl p-5"
              style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-lg font-semibold" style={{ color: "var(--cg-text-primary)" }}>
                    AI Itinerary
                  </h2>
                  <p className="text-sm mt-1" style={{ color: "var(--cg-text-muted)" }}>
                    Generate a day-by-day itinerary based on your planned rounds
                  </p>
                </div>
                <button
                  onClick={generateItinerary}
                  disabled={generatingItinerary}
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all disabled:opacity-50"
                  style={{ backgroundColor: "var(--cg-accent)", color: "var(--cg-text-inverse)" }}
                >
                  {generatingItinerary ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" /> Generate
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "Rounds" && (
        <div className="space-y-4">
          {trip.rounds.length === 0 ? (
            <div
              className="rounded-xl p-8 text-center"
              style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
            >
              <Flag className="mx-auto h-10 w-10" style={{ color: "var(--cg-text-muted)" }} />
              <h3 className="mt-3 font-display text-lg font-semibold" style={{ color: "var(--cg-text-primary)" }}>
                No rounds planned yet
              </h3>
              <p className="mt-1 text-sm" style={{ color: "var(--cg-text-muted)" }}>
                Search for courses and add them to your trip from the course detail page.
              </p>
            </div>
          ) : (
            trip.rounds.map((round) => (
              <div
                key={round.id}
                className="rounded-xl p-4"
                style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <Link
                      href={`/course/${round.courseId}`}
                      className="font-semibold text-sm hover:underline"
                      style={{ color: "var(--cg-text-primary)" }}
                    >
                      {round.course.courseName}
                    </Link>
                    {round.course.city && (
                      <div className="flex items-center gap-1 text-xs mt-0.5" style={{ color: "var(--cg-text-muted)" }}>
                        <MapPin className="h-3 w-3" />
                        {round.course.city}
                        {round.course.state ? `, ${round.course.state}` : ""}
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: "var(--cg-text-secondary)" }}>
                      {round.playDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(round.playDate)}
                        </span>
                      )}
                      {round.teeTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {round.teeTime}
                        </span>
                      )}
                      {(round.course.greenFeeLow || round.course.greenFeeHigh) && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {round.course.greenFeeLow
                            ? `$${Number(round.course.greenFeeLow).toFixed(0)}`
                            : ""}
                          {round.course.greenFeeHigh
                            ? ` - $${Number(round.course.greenFeeHigh).toFixed(0)}`
                            : ""}
                        </span>
                      )}
                    </div>
                  </div>
                  {round.matchScore != null && (
                    <div className="text-right">
                      <div className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
                        Match
                      </div>
                      <div className="text-lg font-bold" style={{ color: "var(--cg-accent)" }}>
                        {Number(round.matchScore).toFixed(1)}
                      </div>
                    </div>
                  )}
                </div>
                {round.notes && (
                  <p className="mt-2 text-xs" style={{ color: "var(--cg-text-muted)" }}>
                    {round.notes}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {tab === "Itinerary" && (
        <div className="space-y-4">
          {trip.itinerary.length === 0 ? (
            <div
              className="rounded-xl p-8 text-center"
              style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
            >
              <Calendar className="mx-auto h-10 w-10" style={{ color: "var(--cg-text-muted)" }} />
              <h3 className="mt-3 font-display text-lg font-semibold" style={{ color: "var(--cg-text-primary)" }}>
                No itinerary yet
              </h3>
              <p className="mt-1 text-sm" style={{ color: "var(--cg-text-muted)" }}>
                Generate an AI itinerary from the Overview tab.
              </p>
            </div>
          ) : (
            (() => {
              const dayGroups = new Map<number, typeof trip.itinerary>();
              for (const item of trip.itinerary) {
                if (!dayGroups.has(item.dayNumber)) dayGroups.set(item.dayNumber, []);
                dayGroups.get(item.dayNumber)!.push(item);
              }

              return Array.from(dayGroups.entries()).map(([dayNum, items]) => {
                const dayDate = new Date(trip.startDate);
                dayDate.setDate(dayDate.getDate() + dayNum - 1);

                return (
                  <div key={dayNum}>
                    <h3 className="font-display text-sm font-semibold mb-2" style={{ color: "var(--cg-text-primary)" }}>
                      Day {dayNum} -{" "}
                      {dayDate.toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "short",
                        day: "numeric",
                      })}
                    </h3>
                    <div className="space-y-2">
                      {items.map((item) => {
                        const Icon = ITEM_TYPE_ICONS[item.itemType] ?? Activity;
                        return (
                          <div
                            key={item.id}
                            className="rounded-lg p-3 flex items-start gap-3"
                            style={{
                              backgroundColor: "var(--cg-bg-card)",
                              border: "1px solid var(--cg-border)",
                            }}
                          >
                            <div
                              className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: "var(--cg-bg-tertiary)" }}
                            >
                              <Icon className="h-4 w-4" style={{ color: "var(--cg-accent)" }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium" style={{ color: "var(--cg-text-primary)" }}>
                                  {item.title}
                                </span>
                                {item.startTime && (
                                  <span className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
                                    {item.startTime}
                                    {item.endTime ? ` - ${item.endTime}` : ""}
                                  </span>
                                )}
                              </div>
                              {item.description && (
                                <p className="text-xs mt-0.5" style={{ color: "var(--cg-text-secondary)" }}>
                                  {item.description}
                                </p>
                              )}
                              {item.location && (
                                <div className="flex items-center gap-1 text-xs mt-1" style={{ color: "var(--cg-text-muted)" }}>
                                  <MapPin className="h-3 w-3" /> {item.location}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              });
            })()
          )}
        </div>
      )}

      {tab === "Expenses" && (
        <ExpenseTracker
          tripId={tripId}
          expenses={trip.expenses}
          participants={trip.participants}
          onUpdate={fetchTrip}
        />
      )}
    </div>
  );
}
