"use client";

import { useEffect, useState } from "react";
import { Users, Star, MapPin, Loader2 } from "lucide-react";
import { RateForCircleModal } from "./RateForCircleModal";

interface CircleRating {
  circle: { id: string; name: string; imageUrl?: string | null };
  aggregate: {
    avgScore: number;
    ratingCount: number;
    dimensionAvgs: any;
  } | null;
  userRating: number | null;
}

interface CheckIn {
  id: string;
  user: { id: string; name: string; image?: string | null };
  circle?: { id: string; name: string } | null;
  score?: number | null;
  createdAt: string;
}

export function CircleRatingsSection({ courseId, courseName }: { courseId: number; courseName: string }) {
  const [circleRatings, setCircleRatings] = useState<CircleRating[]>([]);
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);

  const fetchData = () => {
    Promise.all([
      fetch(`/api/courses/${courseId}/circle-ratings`).then((r) => r.ok ? r.json() : { circleRatings: [] }),
      fetch(`/api/courses/${courseId}/checkins`).then((r) => r.ok ? r.json() : { checkins: [] }),
    ])
      .then(([ratingsData, checkinsData]) => {
        setCircleRatings(ratingsData.circleRatings ?? []);
        setCheckins(checkinsData.checkins ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [courseId]);

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--cg-accent)" }} />
      </div>
    );
  }

  if (circleRatings.length === 0) return null;

  return (
    <>
      <section
        className="rounded-xl p-6"
        style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
      >
        <h2
          className="font-display text-xl font-semibold mb-4 flex items-center gap-2"
          style={{ color: "var(--cg-text-primary)" }}
        >
          <Users className="h-5 w-5" style={{ color: "var(--cg-accent)" }} />
          Your Circles
        </h2>

        <div className="space-y-3">
          {circleRatings.map((cr) => (
            <div
              key={cr.circle.id}
              className="flex items-center gap-3 rounded-lg p-3"
              style={{ backgroundColor: "var(--cg-bg-secondary)" }}
            >
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
                style={{ backgroundColor: "var(--cg-bg-tertiary)" }}
              >
                {cr.circle.imageUrl ? (
                  <img src={cr.circle.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Users className="h-4 w-4" style={{ color: "var(--cg-text-muted)" }} />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate" style={{ color: "var(--cg-text-primary)" }}>
                  {cr.circle.name}
                </div>
                {cr.aggregate ? (
                  <div className="flex items-center gap-2 text-xs" style={{ color: "var(--cg-text-muted)" }}>
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3" style={{ color: "#f59e0b" }} />
                      {cr.aggregate.avgScore.toFixed(1)}/10
                    </span>
                    <span>·</span>
                    <span>{cr.aggregate.ratingCount} rating{cr.aggregate.ratingCount !== 1 ? "s" : ""}</span>
                  </div>
                ) : (
                  <div className="text-xs" style={{ color: "var(--cg-text-muted)" }}>No ratings yet</div>
                )}
              </div>

              {cr.userRating !== null ? (
                <div className="text-right shrink-0">
                  <div className="text-xs" style={{ color: "var(--cg-text-muted)" }}>Your rating</div>
                  <div className="text-sm font-bold" style={{ color: "var(--cg-accent)" }}>
                    {cr.userRating.toFixed(1)}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setRatingModalOpen(true)}
                  className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
                  style={{ backgroundColor: "var(--cg-accent)", color: "var(--cg-text-inverse)" }}
                >
                  Rate
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Who's Played */}
        {checkins.length > 0 && (
          <div className="mt-5 pt-4" style={{ borderTop: "1px solid var(--cg-border)" }}>
            <h3
              className="text-sm font-semibold mb-3 flex items-center gap-2"
              style={{ color: "var(--cg-text-primary)" }}
            >
              <MapPin className="h-4 w-4" style={{ color: "var(--cg-accent)" }} />
              Who&apos;s Played
            </h3>
            <div className="flex flex-wrap gap-2">
              {checkins.slice(0, 10).map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-2 rounded-full px-3 py-1.5"
                  style={{ backgroundColor: "var(--cg-bg-secondary)" }}
                >
                  <div
                    className="h-6 w-6 rounded-full shrink-0 overflow-hidden flex items-center justify-center"
                    style={{ backgroundColor: "var(--cg-bg-tertiary)" }}
                  >
                    {c.user.image ? (
                      <img src={c.user.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-[10px]" style={{ color: "var(--cg-text-muted)" }}>
                        {c.user.name?.[0] ?? "?"}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-medium" style={{ color: "var(--cg-text-primary)" }}>
                    {c.user.name}
                  </span>
                  {c.score && (
                    <span className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
                      {c.score}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {ratingModalOpen && (
        <RateForCircleModal
          courseId={courseId}
          courseName={courseName}
          circles={circleRatings.map((cr) => cr.circle)}
          onClose={() => setRatingModalOpen(false)}
          onRated={() => {
            setRatingModalOpen(false);
            fetchData();
          }}
        />
      )}
    </>
  );
}
