import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "How It Works — golfEQUALIZER",
  description: "Learn how golfEQUALIZER aggregates rankings from Golf Digest, Golfweek, GOLF Magazine, and Top100GolfCourses to create dynamic, personalized golf course rankings.",
};

export default function AboutPage() {
  return (
    <div
      className="min-h-screen py-16 px-4"
      style={{ backgroundColor: "var(--cg-bg-primary)" }}
    >
      <div className="mx-auto max-w-3xl">
        <h1
          className="text-3xl sm:text-4xl font-bold"
          style={{ color: "var(--cg-text-primary)" }}
        >
          How golfEQUALIZER Works
        </h1>
        <p
          className="mt-4 text-lg leading-relaxed"
          style={{ color: "var(--cg-text-secondary)" }}
        >
          golfEQUALIZER aggregates rankings from the world&apos;s most authoritative golf publications and lets you
          re-weight what matters to you — producing a personalized ranking that factors in your priorities.
        </p>

        <section className="mt-10">
          <h2
            className="text-2xl font-semibold"
            style={{ color: "var(--cg-text-primary)" }}
          >
            The Equalizer Score
          </h2>
          <p
            className="mt-3 leading-relaxed"
            style={{ color: "var(--cg-text-secondary)" }}
          >
            Every course receives a composite 0-100 score blending two signals:
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div
              className="rounded-xl p-5"
              style={{
                backgroundColor: "var(--cg-bg-card)",
                border: "1px solid var(--cg-border)",
              }}
            >
              <div className="text-3xl font-bold" style={{ color: "var(--cg-accent)" }}>60%</div>
              <h3
                className="mt-1 font-semibold"
                style={{ color: "var(--cg-text-primary)" }}
              >
                Expert Prestige
              </h3>
              <p className="mt-1 text-sm" style={{ color: "var(--cg-text-muted)" }}>
                Aggregated from 46 ranking lists across Golf Digest, Golfweek, GOLF.com, and Top100GolfCourses.
                Each source has an authority weight, each list a prestige tier (Flagship, Major, Regional, Specialty).
              </p>
            </div>
            <div
              className="rounded-xl p-5"
              style={{
                backgroundColor: "var(--cg-bg-card)",
                border: "1px solid var(--cg-border)",
              }}
            >
              <div className="text-3xl font-bold" style={{ color: "#eab308" }}>40%</div>
              <h3
                className="mt-1 font-semibold"
                style={{ color: "var(--cg-text-primary)" }}
              >
                Community Ratings
              </h3>
              <p className="mt-1 text-sm" style={{ color: "var(--cg-text-muted)" }}>
                Verified golfers rate courses across multiple dimensions — condition, design, value, ambience, and more.
                Adjust dimension weights to match your priorities.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <h2
            className="text-2xl font-semibold"
            style={{ color: "var(--cg-text-primary)" }}
          >
            Ranking Sources
          </h2>
          <div className="mt-4 space-y-3">
            {[
              { name: "Golf Digest", weight: "1.00", desc: "Gold standard — largest panel, most rigorous methodology, longest history" },
              { name: "Golfweek", weight: "0.95", desc: "2,000+ volunteer raters with granular modern/classic/resort segmentation" },
              { name: "GOLF.com / GOLF Magazine", weight: "0.90", desc: "Prestigious biennial World Top 100 with strong editorial panel" },
              { name: "Top100GolfCourses.com", weight: "0.85", desc: "Unmatched international breadth with 37 regional and specialty lists" },
            ].map((s) => (
              <div
                key={s.name}
                className="rounded-lg px-4 py-3"
                style={{ backgroundColor: "var(--cg-bg-tertiary)" }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold" style={{ color: "var(--cg-text-primary)" }}>{s.name}</span>
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{ backgroundColor: "var(--cg-accent-bg)", color: "var(--cg-accent)" }}
                  >
                    {s.weight}
                  </span>
                </div>
                <p className="mt-1 text-sm" style={{ color: "var(--cg-text-muted)" }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2
            className="text-2xl font-semibold"
            style={{ color: "var(--cg-text-primary)" }}
          >
            Prestige Tiers
          </h2>
          <p
            className="mt-3 leading-relaxed"
            style={{ color: "var(--cg-text-secondary)" }}
          >
            Not all ranking lists carry equal weight. We classify each of the 46 lists into four tiers:
          </p>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { tier: "Flagship", weight: "1.0", count: 6, bg: "rgba(251, 191, 36, 0.15)", color: "#fbbf24" },
              { tier: "Major", weight: "0.7", count: 12, bg: "rgba(59, 130, 246, 0.15)", color: "#3b82f6" },
              { tier: "Regional", weight: "0.4", count: 10, bg: "rgba(163, 163, 163, 0.15)", color: "#a3a3a3" },
              { tier: "Specialty", weight: "0.2", count: 18, bg: "rgba(168, 85, 247, 0.15)", color: "#a855f7" },
            ].map((t) => (
              <div
                key={t.tier}
                className="rounded-lg p-4 text-center"
                style={{
                  backgroundColor: "var(--cg-bg-card)",
                  border: "1px solid var(--cg-border)",
                }}
              >
                <span
                  className="inline-block rounded-full px-3 py-1 text-xs font-semibold"
                  style={{ backgroundColor: t.bg, color: t.color }}
                >
                  {t.tier}
                </span>
                <div className="mt-2 text-2xl font-bold" style={{ color: "var(--cg-text-primary)" }}>{t.weight}</div>
                <div className="text-xs" style={{ color: "var(--cg-text-muted)" }}>{t.count} lists</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2
            className="text-2xl font-semibold"
            style={{ color: "var(--cg-text-primary)" }}
          >
            Score Verification
          </h2>
          <p
            className="mt-3 leading-relaxed"
            style={{ color: "var(--cg-text-secondary)" }}
          >
            To maintain data integrity, posted scores are verified through GHIN screenshot upload.
            An admin reviews each submission before it counts toward community ratings.
            Future versions will integrate directly with the GHIN API for automated verification.
          </p>
        </section>
      </div>
    </div>
  );
}
