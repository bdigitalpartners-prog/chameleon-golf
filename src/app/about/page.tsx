export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-3xl font-bold text-stone-900 md:text-4xl">How CourseFACTOR Works</h1>
      <p className="mt-4 text-lg text-stone-600 leading-relaxed">
        CourseFACTOR aggregates rankings from the world&apos;s most authoritative golf publications and lets you
        re-weight what matters to you — producing a personalized ranking that factors in what matters to you.
      </p>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold text-stone-900">The CF Score</h2>
        <p className="mt-3 text-stone-600 leading-relaxed">
          Every course receives a composite 0-100 score blending two signals:
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-stone-200 bg-white p-5">
            <div className="text-3xl font-bold text-brand-600">60%</div>
            <h3 className="mt-1 font-semibold text-stone-900">Expert Prestige</h3>
            <p className="mt-1 text-sm text-stone-500">
              Aggregated from 46 ranking lists across Golf Digest, Golfweek, GOLF.com, and Top100GolfCourses.
              Each source has an authority weight, each list a prestige tier (Flagship, Major, Regional, Specialty).
            </p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-5">
            <div className="text-3xl font-bold text-amber-500">40%</div>
            <h3 className="mt-1 font-semibold text-stone-900">Community Ratings</h3>
            <p className="mt-1 text-sm text-stone-500">
              Verified golfers rate courses across multiple dimensions — condition, design, value, ambience, and more.
              Adjust dimension weights to match your priorities.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold text-stone-900">Ranking Sources</h2>
        <div className="mt-4 space-y-3">
          {[
            { name: "Golf Digest", weight: "1.00", desc: "Gold standard — largest panel, most rigorous methodology, longest history" },
            { name: "Golfweek", weight: "0.95", desc: "2,000+ volunteer raters with granular modern/classic/resort segmentation" },
            { name: "GOLF.com / GOLF Magazine", weight: "0.90", desc: "Prestigious biennial World Top 100 with strong editorial panel" },
            { name: "Top100GolfCourses.com", weight: "0.85", desc: "Unmatched international breadth with 37 regional and specialty lists" },
          ].map((s) => (
            <div key={s.name} className="rounded-lg bg-stone-50 px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-stone-900">{s.name}</span>
                <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-800">{s.weight}</span>
              </div>
              <p className="mt-1 text-sm text-stone-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold text-stone-900">Prestige Tiers</h2>
        <p className="mt-3 text-stone-600 leading-relaxed">
          Not all ranking lists carry equal weight. We classify each of the 46 lists into four tiers:
        </p>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { tier: "Flagship", weight: "1.0", count: 6, color: "bg-amber-100 text-amber-800" },
            { tier: "Major", weight: "0.7", count: 12, color: "bg-blue-100 text-blue-800" },
            { tier: "Regional", weight: "0.4", count: 10, color: "bg-stone-100 text-stone-700" },
            { tier: "Specialty", weight: "0.2", count: 18, color: "bg-purple-100 text-purple-800" },
          ].map((t) => (
            <div key={t.tier} className="rounded-lg border border-stone-200 bg-white p-4 text-center">
              <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${t.color}`}>{t.tier}</span>
              <div className="mt-2 text-2xl font-bold text-stone-900">{t.weight}</div>
              <div className="text-xs text-stone-500">{t.count} lists</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold text-stone-900">Score Verification</h2>
        <p className="mt-3 text-stone-600 leading-relaxed">
          To maintain data integrity, posted scores are verified through GHIN screenshot upload.
          An admin reviews each submission before it counts toward community ratings.
          Future versions will integrate directly with the GHIN API for automated verification.
        </p>
      </section>
    </div>
  );
}
