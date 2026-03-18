"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Star, Search, UserPlus, ArrowRight } from "lucide-react";

export default function LooperGuildPage() {
  const [caddies, setCaddies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/looper-guild/caddies")
      .then((r) => r.json())
      .then((data) => {
        setCaddies(Array.isArray(data) ? data : []);
      })
      .catch(() => setCaddies([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div
      className="min-h-screen py-12 px-4 sm:px-6"
      style={{ backgroundColor: "var(--cg-bg-primary)" }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <img
              src="/looper-guild-lambda.png"
              alt="Looper Guild"
              className="h-20 w-20 object-contain"
            />
          </div>
          <h1
            className="text-4xl sm:text-5xl font-bold mb-4"
            style={{ color: "var(--cg-text-primary)" }}
          >
            Looper Guild
          </h1>
          <p
            className="text-base sm:text-lg leading-relaxed max-w-2xl mx-auto"
            style={{ color: "var(--cg-text-secondary)" }}
          >
            The caddy network inside golfEQUALIZER. Connect with local caddies
            who know every break, every yardage, every secret of the course.
          </p>
        </div>

        {/* How It Works */}
        <section className="mb-16">
          <h2
            className="text-2xl font-semibold text-center mb-8"
            style={{ color: "var(--cg-text-primary)" }}
          >
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Search className="h-6 w-6" />,
                title: "Find a Caddy",
                desc: "Browse rated caddies at courses you're playing",
              },
              {
                icon: <UserPlus className="h-6 w-6" />,
                title: "Request a Loop",
                desc: "Pick from available caddies or let our concierge match you",
              },
              {
                icon: <Star className="h-6 w-6" />,
                title: "Rate Your Experience",
                desc: "Help the community by rating your caddy after your round",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-xl p-6 text-center"
                style={{
                  backgroundColor: "var(--cg-bg-card)",
                  border: "1px solid var(--cg-border)",
                }}
              >
                <div
                  className="inline-flex items-center justify-center h-12 w-12 rounded-full mb-4"
                  style={{
                    backgroundColor: "var(--cg-accent-bg)",
                    color: "var(--cg-accent)",
                  }}
                >
                  {card.icon}
                </div>
                <h3
                  className="text-lg font-semibold mb-2"
                  style={{ color: "var(--cg-text-primary)" }}
                >
                  {card.title}
                </h3>
                <p
                  className="text-sm"
                  style={{ color: "var(--cg-text-secondary)" }}
                >
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Featured Caddies */}
        {!loading && caddies.length > 0 && (
          <section className="mb-16">
            <h2
              className="text-2xl font-semibold text-center mb-8"
              style={{ color: "var(--cg-text-primary)" }}
            >
              Featured Caddies
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {caddies.slice(0, 6).map((caddy) => (
                <div
                  key={caddy.id}
                  className="rounded-xl p-5"
                  style={{
                    backgroundColor: "var(--cg-bg-card)",
                    border: "1px solid var(--cg-border)",
                  }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    {caddy.photoUrl ? (
                      <img
                        src={caddy.photoUrl}
                        alt={`${caddy.firstName} ${caddy.lastName}`}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="h-12 w-12 rounded-full flex items-center justify-center text-sm font-semibold"
                        style={{
                          backgroundColor: "var(--cg-accent)",
                          color: "var(--cg-text-inverse)",
                        }}
                      >
                        {caddy.firstName?.[0]}
                        {caddy.lastName?.[0]}
                      </div>
                    )}
                    <div>
                      <div
                        className="font-semibold text-sm"
                        style={{ color: "var(--cg-text-primary)" }}
                      >
                        {caddy.firstName} {caddy.lastName}
                      </div>
                      {caddy.yearsExperience && (
                        <div
                          className="text-xs"
                          style={{ color: "var(--cg-text-muted)" }}
                        >
                          {caddy.yearsExperience} years exp
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rating */}
                  {caddy.avgRating !== null && (
                    <div className="flex items-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className="h-3.5 w-3.5"
                          style={{
                            color:
                              s <= Math.round(caddy.avgRating)
                                ? "#f59e0b"
                                : "var(--cg-border)",
                            fill:
                              s <= Math.round(caddy.avgRating)
                                ? "#f59e0b"
                                : "none",
                          }}
                        />
                      ))}
                      <span
                        className="text-xs ml-1"
                        style={{ color: "var(--cg-text-muted)" }}
                      >
                        ({caddy.totalRatings})
                      </span>
                    </div>
                  )}

                  {/* Courses */}
                  {caddy.courses?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {caddy.courses.slice(0, 3).map((cc: any) => (
                        <span
                          key={cc.id}
                          className="rounded-full px-2 py-0.5 text-[10px]"
                          style={{
                            backgroundColor: "var(--cg-bg-tertiary)",
                            color: "var(--cg-text-muted)",
                          }}
                        >
                          {cc.course.courseName}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* For Caddies CTA */}
        <section
          className="rounded-xl p-8 sm:p-10 text-center"
          style={{
            backgroundColor: "var(--cg-bg-card)",
            border: "1px solid var(--cg-border)",
          }}
        >
          <div className="flex justify-center mb-4">
            <img
              src="/looper-guild-lambda.png"
              alt=""
              className="h-10 w-10 object-contain opacity-60"
            />
          </div>
          <h2
            className="text-2xl font-bold mb-2"
            style={{ color: "var(--cg-text-primary)" }}
          >
            Join the Guild
          </h2>
          <p
            className="text-sm mb-6 max-w-md mx-auto"
            style={{ color: "var(--cg-text-secondary)" }}
          >
            Build your profile, get rated, get booked. Apply to become a
            registered Looper Guild caddy.
          </p>
          <Link
            href="/looper-guild/apply"
            className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-colors"
            style={{
              backgroundColor: "var(--cg-accent)",
              color: "var(--cg-text-inverse)",
            }}
          >
            Apply as Caddy
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </div>
    </div>
  );
}
