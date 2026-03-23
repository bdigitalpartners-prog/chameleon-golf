"use client";

import Link from "next/link";
import {
  Dna,
  CloudSun,
  Trophy,
  Footprints,
  MessageSquareMore,
  SlidersHorizontal,
  Plane,
  TrendingUp,
  Satellite,
  Video,
  GitCompare,
  DollarSign,
  Sparkles,
  Scroll,
  BarChart3,
} from "lucide-react";

const FEATURE_CATEGORIES = [
  {
    category: "Data Depth",
    color: "#00FF85",
    features: [
      { icon: Dna, name: "Course DNA", desc: "Character fingerprinting for 1,499+ courses", href: "/explore" },
      { icon: CloudSun, name: "Live Conditions", desc: "Real-time course conditions & aeration tracking", href: "/explore" },
      { icon: Trophy, name: "Tournaments", desc: "Pro & amateur tournament history at every course", href: "/explore" },
      { icon: Footprints, name: "Walking Guide", desc: "Walkability ratings & accessibility database", href: "/explore" },
      { icon: DollarSign, name: "Green Fee Index", desc: "Price intelligence with value scoring", href: "/explore" },
    ],
  },
  {
    category: "AI Intelligence",
    color: "#3B82F6",
    features: [
      { icon: MessageSquareMore, name: "AI Concierge", desc: "Ask anything about any course, powered by AI", href: "/explore" },
      { icon: SlidersHorizontal, name: "Course-Fit", desc: "Personalized course matching scores", href: "/settings/chameleon-score" },
      { icon: Plane, name: "Trip Planner", desc: "AI-generated golf trip itineraries", href: "/trips" },
      { icon: TrendingUp, name: "Betting & DFS", desc: "Advanced analytics for DFS & sports betting", href: "/explore" },
      { icon: Satellite, name: "Satellite Analysis", desc: "Aerial feature analysis of course layouts", href: "/explore" },
    ],
  },
  {
    category: "Community Network",
    color: "#F59E0B",
    features: [
      { icon: Video, name: "Creators", desc: "Golf content from top creators on every course", href: "/fairway" },
      { icon: GitCompare, name: "Course Compare", desc: "Side-by-side course comparison tool", href: "/explore" },
      { icon: Sparkles, name: "EQ Wrapped", desc: "Your personalized annual golf intelligence report", href: "/explore" },
      { icon: Scroll, name: "Readability", desc: "AI hole-by-hole playing advice per handicap", href: "/explore" },
      { icon: BarChart3, name: "Performance", desc: "Track and analyze your game improvements", href: "/performance" },
    ],
  },
];

export function HomepageFeatureShowcase() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-14">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 text-sm font-medium"
            style={{
              backgroundColor: "#00FF8515",
              color: "#00FF85",
              border: "1px solid #00FF8530",
            }}
          >
            <Sparkles className="w-4 h-4" />
            New Intelligence Layers
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            15 Ways to Play Smarter
          </h2>
          <p className="text-gray-400 max-w-lg mx-auto">
            From AI-powered course matching to satellite analysis — the deepest golf
            intelligence platform ever built.
          </p>
        </div>

        {/* Feature Categories */}
        <div className="space-y-12">
          {FEATURE_CATEGORIES.map((cat) => (
            <div key={cat.category}>
              <h3
                className="text-lg font-bold mb-5 flex items-center gap-2"
                style={{ color: cat.color }}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
                {cat.category}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {cat.features.map((f) => {
                  const Icon = f.icon;
                  return (
                    <Link
                      key={f.name}
                      href={f.href}
                      className="group rounded-xl p-4 transition-all hover:scale-[1.02]"
                      style={{
                        backgroundColor: "#111",
                        border: "1px solid #222",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = `${cat.color}40`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "#222";
                      }}
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                        style={{ backgroundColor: `${cat.color}15` }}
                      >
                        <Icon className="w-4 h-4" style={{ color: cat.color }} />
                      </div>
                      <p className="text-sm font-semibold text-white mb-1">{f.name}</p>
                      <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-14">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all hover:scale-105"
            style={{ backgroundColor: "#00FF85", color: "#0A0A0A" }}
          >
            <Sparkles className="w-5 h-5" />
            Unlock All Features
          </Link>
          <p className="text-xs text-gray-500 mt-3">Starting at $99/year with a 7-day free trial</p>
        </div>
      </div>
    </section>
  );
}
