"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star, Trophy, MapPin, Heart, Loader2, Calendar } from "lucide-react";

interface CourseAggregate {
  id: string;
  courseId: number;
  avgScore: number;
  ratingCount: number;
  rank: number | null;
  course: {
    courseId: number;
    courseName: string;
    city?: string | null;
    state?: string | null;
    media?: { url: string }[];
  };
  topRaters?: { image?: string | null }[];
}

interface WishlistItem {
  courseId: number;
  courseName: string;
  city?: string | null;
  state?: string | null;
  memberCount: number;
  media?: { url: string }[];
}

interface CheckInItem {
  id: string;
  user: { id: string; name: string; image?: string | null };
  course: { courseId: number; courseName: string };
  score?: number | null;
  createdAt: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function CircleCoursesTab({ circleId }: { circleId: string }) {
  const [courses, setCourses] = useState<CourseAggregate[]>([]);
  const [wishlists, setWishlists] = useState<WishlistItem[]>([]);
  const [checkins, setCheckins] = useState<CheckInItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState<"ranked" | "wishlists" | "played">("ranked");

  useEffect(() => {
    Promise.all([
      fetch(`/api/circles/${circleId}/courses`).then((r) => r.ok ? r.json() : { courses: [] }),
      fetch(`/api/circles/${circleId}/wishlists`).then((r) => r.ok ? r.json() : { wishlists: [] }),
      fetch(`/api/circles/${circleId}/checkins`).then((r) => r.ok ? r.json() : { checkins: [] }),
    ])
      .then(([coursesData, wishlistsData, checkinsData]) => {
        setCourses(coursesData.courses ?? []);
        setWishlists(wishlistsData.wishlists ?? []);
        setCheckins(checkinsData.checkins ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [circleId]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--cg-accent)" }} />
      </div>
    );
  }

  const subTabs = [
    { key: "ranked" as const, label: "Rankings", icon: Trophy },
    { key: "wishlists" as const, label: "Wishlists", icon: Heart },
    { key: "played" as const, label: "Just Played", icon: MapPin },
  ];

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-2">
        {subTabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setSubTab(t.key)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
              style={{
                backgroundColor: subTab === t.key ? "var(--cg-accent)" : "var(--cg-bg-secondary)",
                color: subTab === t.key ? "var(--cg-text-inverse)" : "var(--cg-text-muted)",
              }}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Ranked List */}
      {subTab === "ranked" && (
        <div className="space-y-2">
          {courses.length === 0 ? (
            <div
              className="rounded-xl p-8 text-center"
              style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
            >
              <Trophy className="h-8 w-8 mx-auto mb-3" style={{ color: "var(--cg-border)" }} />
              <p className="text-sm" style={{ color: "var(--cg-text-muted)" }}>
                No courses rated yet. Be the first to rate a course!
              </p>
            </div>
          ) : (
            courses.map((c, i) => (
              <Link
                key={c.id}
                href={`/course/${c.course.courseId}`}
                className="flex items-center gap-3 rounded-xl p-3 transition-all hover:opacity-90"
                style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
              >
                {/* Rank */}
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
                  style={{
                    backgroundColor: i < 3 ? "var(--cg-accent)" : "var(--cg-bg-tertiary)",
                    color: i < 3 ? "var(--cg-text-inverse)" : "var(--cg-text-muted)",
                  }}
                >
                  {c.rank ?? i + 1}
                </div>

                {/* Course image */}
                {c.course.media?.[0] && (
                  <div
                    className="h-12 w-16 rounded-md overflow-hidden shrink-0"
                    style={{ backgroundColor: "var(--cg-bg-tertiary)" }}
                  >
                    <img src={c.course.media[0].url} alt="" className="h-full w-full object-cover" />
                  </div>
                )}

                {/* Course info */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate" style={{ color: "var(--cg-text-primary)" }}>
                    {c.course.courseName}
                  </div>
                  <div className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
                    {[c.course.city, c.course.state].filter(Boolean).join(", ")}
                  </div>
                </div>

                {/* Score + count */}
                <div className="text-right shrink-0">
                  <div className="text-lg font-bold" style={{ color: "var(--cg-accent)" }}>
                    {c.avgScore.toFixed(1)}
                  </div>
                  <div className="text-[10px]" style={{ color: "var(--cg-text-muted)" }}>
                    {c.ratingCount} rating{c.ratingCount !== 1 ? "s" : ""}
                  </div>
                </div>

                {/* Top raters */}
                {c.topRaters && c.topRaters.length > 0 && (
                  <div className="flex -space-x-1 shrink-0">
                    {c.topRaters.slice(0, 3).map((r, j) => (
                      <div
                        key={j}
                        className="h-6 w-6 rounded-full border-2 overflow-hidden"
                        style={{ borderColor: "var(--cg-bg-card)", backgroundColor: "var(--cg-bg-tertiary)" }}
                      >
                        {r.image ? (
                          <img src={r.image} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Link>
            ))
          )}
        </div>
      )}

      {/* Wishlists */}
      {subTab === "wishlists" && (
        <div className="space-y-2">
          {wishlists.length === 0 ? (
            <div
              className="rounded-xl p-8 text-center"
              style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
            >
              <Heart className="h-8 w-8 mx-auto mb-3" style={{ color: "var(--cg-border)" }} />
              <p className="text-sm" style={{ color: "var(--cg-text-muted)" }}>
                No wishlisted courses yet
              </p>
            </div>
          ) : (
            wishlists.map((w) => (
              <Link
                key={w.courseId}
                href={`/course/${w.courseId}`}
                className="flex items-center gap-3 rounded-xl p-3 transition-all hover:opacity-90"
                style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
              >
                {w.media?.[0] && (
                  <div
                    className="h-12 w-16 rounded-md overflow-hidden shrink-0"
                    style={{ backgroundColor: "var(--cg-bg-tertiary)" }}
                  >
                    <img src={w.media[0].url} alt="" className="h-full w-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate" style={{ color: "var(--cg-text-primary)" }}>
                    {w.courseName}
                  </div>
                  {w.city && (
                    <div className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
                      {[w.city, w.state].filter(Boolean).join(", ")}
                    </div>
                  )}
                </div>
                <div
                  className="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium"
                  style={{ backgroundColor: "var(--cg-accent-bg)", color: "var(--cg-accent)" }}
                >
                  {w.memberCount} member{w.memberCount !== 1 ? "s" : ""}
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {/* Just Played */}
      {subTab === "played" && (
        <div className="space-y-2">
          {checkins.length === 0 ? (
            <div
              className="rounded-xl p-8 text-center"
              style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
            >
              <MapPin className="h-8 w-8 mx-auto mb-3" style={{ color: "var(--cg-border)" }} />
              <p className="text-sm" style={{ color: "var(--cg-text-muted)" }}>
                No recent check-ins
              </p>
            </div>
          ) : (
            checkins.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3 rounded-xl p-3"
                style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
              >
                <div
                  className="h-10 w-10 rounded-full shrink-0 overflow-hidden flex items-center justify-center"
                  style={{ backgroundColor: "var(--cg-bg-tertiary)" }}
                >
                  {c.user.image ? (
                    <img src={c.user.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-sm" style={{ color: "var(--cg-text-muted)" }}>
                      {c.user.name?.[0] ?? "?"}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm" style={{ color: "var(--cg-text-primary)" }}>
                    <span className="font-semibold">{c.user.name}</span>{" "}
                    <span style={{ color: "var(--cg-text-muted)" }}>played</span>{" "}
                    <Link
                      href={`/course/${c.course.courseId}`}
                      className="font-semibold hover:underline"
                      style={{ color: "var(--cg-accent)" }}
                    >
                      {c.course.courseName}
                    </Link>
                  </div>
                  <div className="flex items-center gap-2 text-xs" style={{ color: "var(--cg-text-muted)" }}>
                    <span>{timeAgo(c.createdAt)}</span>
                    {c.score && (
                      <>
                        <span>·</span>
                        <span>Score: {c.score}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
