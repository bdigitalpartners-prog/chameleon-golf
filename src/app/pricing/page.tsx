"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  Check,
  Sparkles,
  Star,
  Crown,
  Zap,
  ChevronDown,
  ChevronUp,
  Shield,
  Clock,
  Users,
  HelpCircle,
} from "lucide-react";

/* ─── Tier Data ─────────────────────────────────── */
const TIERS = [
  {
    name: "EQUALIZER PRO",
    slug: "pro",
    price: 99,
    monthly: "$8.25/mo",
    color: "#00FF85",
    borderClass: "border-[#00FF85]",
    badge: "Most Popular",
    badgeColor: "#00FF85",
    icon: Zap,
    maxFeature: "Full Course Intelligence",
    features: [
      "Full course intelligence on every course page",
      "Trip Planner with AI generation",
      "AI Concierge 2.0 unlimited queries",
      "Course-Fit personalized scores",
      "Live conditions layer access",
      "Course DNA fingerprint access",
      "EQ Wrapped annual report",
      "Walking & accessibility database",
      "Creator content on course pages",
      "50 course comparisons/month",
    ],
    cta: "Start Free Trial",
    ctaSecondary: "7-day free trial, cancel anytime",
  },
  {
    name: "EQUALIZER ELITE",
    slug: "elite",
    price: 199,
    monthly: "$16.58/mo",
    color: "#3B82F6",
    borderClass: "border-blue-500",
    badge: null,
    badgeColor: null,
    icon: Star,
    maxFeature: "Betting & DFS Intelligence",
    features: [
      "Everything in Pro",
      "API access (future)",
      "Data exports",
      "Betting/DFS intelligence layer",
      "Early access to new features",
      "Green Fee Intelligence with price alerts",
      "Satellite Feature Analysis data",
      "Unlimited comparisons",
      "Priority support",
    ],
    cta: "Get Elite",
    ctaSecondary: "Best for serious golfers",
  },
  {
    name: "FOUNDERS FLIGHT",
    slug: "founders",
    price: 499,
    monthly: "$41.58/mo",
    color: "#F59E0B",
    borderClass: "border-amber-500",
    badge: "Limited Availability",
    badgeColor: "#F59E0B",
    icon: Crown,
    maxFeature: "Lifetime Locked-In Pricing",
    features: [
      "Everything in Elite",
      "Exclusive community access",
      "Private events and tee times access",
      "The Vault (proprietary data room) — future",
      "Direct line to product team",
      "Founding member recognition badge",
      "Lifetime locked-in pricing",
    ],
    cta: "Join Founders",
    ctaSecondary: "Only 100 spots available",
  },
];

/* ─── Feature Comparison ────────────────────────── */
const COMPARISON_FEATURES = [
  { name: "Course Intelligence Pages", free: "Basic", pro: "Full", elite: "Full", founders: "Full" },
  { name: "AI Concierge Queries", free: "5/day", pro: "Unlimited", elite: "Unlimited", founders: "Unlimited" },
  { name: "Course Comparisons", free: "3/month", pro: "50/month", elite: "Unlimited", founders: "Unlimited" },
  { name: "Trip AI Generation", free: false, pro: true, elite: true, founders: true },
  { name: "Course-Fit Scores", free: false, pro: true, elite: true, founders: true },
  { name: "Course DNA Access", free: false, pro: true, elite: true, founders: true },
  { name: "Live Conditions Layer", free: false, pro: true, elite: true, founders: true },
  { name: "EQ Wrapped Report", free: false, pro: true, elite: true, founders: true },
  { name: "Walking Database", free: false, pro: true, elite: true, founders: true },
  { name: "Betting/DFS Intelligence", free: false, pro: false, elite: true, founders: true },
  { name: "Satellite Analysis", free: false, pro: false, elite: true, founders: true },
  { name: "Green Fee Alerts", free: false, pro: false, elite: true, founders: true },
  { name: "Data Exports", free: false, pro: false, elite: true, founders: true },
  { name: "API Access", free: false, pro: false, elite: true, founders: true },
  { name: "Priority Support", free: false, pro: false, elite: true, founders: true },
  { name: "Exclusive Community", free: false, pro: false, elite: false, founders: true },
  { name: "Private Events", free: false, pro: false, elite: false, founders: true },
  { name: "The Vault Data Room", free: false, pro: false, elite: false, founders: true },
  { name: "Product Team Access", free: false, pro: false, elite: false, founders: true },
  { name: "Founding Member Badge", free: false, pro: false, elite: false, founders: true },
];

/* ─── FAQ ───────────────────────────────────────── */
const FAQS = [
  {
    q: "What's included in the free tier?",
    a: "Free users can explore all 1,499+ courses, view basic rankings, use the map, and make 5 AI Concierge queries per day. Upgrade to unlock full course intelligence, Course-Fit scores, and more.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes, all plans are cancel-anytime. Your access continues through the end of your billing period. No questions asked.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes! Pro comes with a 7-day free trial. Try the full power of course intelligence before committing.",
  },
  {
    q: "Do you offer team or group pricing?",
    a: "We're working on group plans for golf circles and clubs. Contact us at team@golfequalizer.ai for early access to group pricing.",
  },
  {
    q: "What is Founders Flight?",
    a: "Founders Flight is our exclusive founding member tier, limited to 100 spots. Members lock in their pricing for life and get direct access to the product team plus exclusive events.",
  },
  {
    q: "How does the Betting/DFS intelligence work?",
    a: "Our Elite tier provides advanced analytics specifically designed for DFS and sports betting research, including course-player fit analysis, historical performance patterns, and weather-adjusted projections.",
  },
];

/* ─── Testimonials ──────────────────────────────── */
const TESTIMONIALS = [
  {
    text: "Course-Fit scores changed how I plan my golf trips. Saved me from booking a course that would've been a terrible match.",
    name: "Mike R.",
    title: "PRO Member, 12 HCP",
  },
  {
    text: "The DFS intelligence layer alone pays for the Elite membership. It's like having a research team in my pocket.",
    name: "Sarah K.",
    title: "ELITE Member, DFS Player",
  },
  {
    text: "As a Founders member, the direct line to the product team is incredible. My feature requests actually get built.",
    name: "James T.",
    title: "FOUNDERS FLIGHT, 4 HCP",
  },
];

function CellValue({ value }: { value: boolean | string }) {
  if (typeof value === "string") {
    return <span className="text-sm text-white font-medium">{value}</span>;
  }
  return value ? (
    <Check className="w-5 h-5 text-[#00FF85] mx-auto" />
  ) : (
    <span className="text-gray-600">—</span>
  );
}

export default function PricingPage() {
  const { data: session } = useSession();
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSubscribe = async (slug: string) => {
    setSubscribing(slug);
    try {
      const res = await fetch("/api/membership/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tierSlug: slug }),
      });
      const data = await res.json();
      if (data.success) {
        window.location.reload();
      }
    } catch {
      // noop
    }
    setSubscribing(null);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0A0A0A" }}>
      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-16 px-4">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            background: "radial-gradient(ellipse at top center, #00FF85, transparent 60%)",
          }}
        />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-sm font-medium"
            style={{ backgroundColor: "#00FF8515", color: "#00FF85", border: "1px solid #00FF8530" }}>
            <Sparkles className="w-4 h-4" />
            Premium Golf Intelligence
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Unlock the Full Power of{" "}
            <span style={{ color: "#00FF85" }}>Golf Intelligence</span>
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            15 intelligence layers. AI-powered insights. Personalized course matching.
            Choose the plan that fits your game.
          </p>
        </div>
      </section>

      {/* Tier Cards */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TIERS.map((tier) => {
            const Icon = tier.icon;
            return (
              <div
                key={tier.slug}
                className="relative rounded-2xl p-6 flex flex-col"
                style={{
                  backgroundColor: "#111111",
                  border: `2px solid ${tier.color}30`,
                }}
              >
                {tier.badge && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold"
                    style={{
                      backgroundColor: tier.badgeColor || tier.color,
                      color: "#0A0A0A",
                    }}
                  >
                    {tier.badge}
                  </div>
                )}
                <div className="flex items-center gap-3 mb-4 mt-2">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${tier.color}15` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: tier.color }} />
                  </div>
                  <h3 className="text-lg font-bold text-white">{tier.name}</h3>
                </div>

                <div className="mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">${tier.price}</span>
                    <span className="text-gray-500">/year</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{tier.monthly} billed annually</p>
                </div>

                <div
                  className="text-sm font-semibold mb-4 px-3 py-1.5 rounded-lg inline-block"
                  style={{ backgroundColor: `${tier.color}10`, color: tier.color }}
                >
                  {tier.maxFeature}
                </div>

                <ul className="space-y-3 mb-6 flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                      <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: tier.color }} />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => session ? handleSubscribe(tier.slug) : undefined}
                  disabled={subscribing === tier.slug}
                  className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:scale-[1.02] disabled:opacity-50"
                  style={{
                    backgroundColor: tier.color,
                    color: "#0A0A0A",
                  }}
                >
                  {subscribing === tier.slug ? "Processing..." : tier.cta}
                </button>
                <p className="text-xs text-gray-500 text-center mt-2">{tier.ctaSecondary}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <h2 className="text-3xl font-bold text-white text-center mb-10">
          Compare Plans
        </h2>
        <div className="overflow-x-auto rounded-xl" style={{ border: "1px solid #222" }}>
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: "#111" }}>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400 w-1/3">Feature</th>
                <th className="text-center px-4 py-4 text-sm font-semibold text-gray-400">Free</th>
                <th className="text-center px-4 py-4 text-sm font-semibold" style={{ color: "#00FF85" }}>Pro</th>
                <th className="text-center px-4 py-4 text-sm font-semibold" style={{ color: "#3B82F6" }}>Elite</th>
                <th className="text-center px-4 py-4 text-sm font-semibold" style={{ color: "#F59E0B" }}>Founders</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_FEATURES.map((f, i) => (
                <tr
                  key={f.name}
                  style={{
                    backgroundColor: i % 2 === 0 ? "#0A0A0A" : "#0F0F0F",
                    borderTop: "1px solid #1a1a1a",
                  }}
                >
                  <td className="px-6 py-3 text-sm text-gray-300">{f.name}</td>
                  <td className="text-center px-4 py-3"><CellValue value={f.free} /></td>
                  <td className="text-center px-4 py-3"><CellValue value={f.pro} /></td>
                  <td className="text-center px-4 py-3"><CellValue value={f.elite} /></td>
                  <td className="text-center px-4 py-3"><CellValue value={f.founders} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <h2 className="text-3xl font-bold text-white text-center mb-10">
          What Our Members Say
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="rounded-xl p-6"
              style={{ backgroundColor: "#111", border: "1px solid #222" }}
            >
              <p className="text-gray-300 text-sm mb-4 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
              <div>
                <p className="text-white font-semibold text-sm">{t.name}</p>
                <p className="text-gray-500 text-xs">{t.title}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 pb-20">
        <h2 className="text-3xl font-bold text-white text-center mb-10">
          Frequently Asked Questions
        </h2>
        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div
              key={i}
              className="rounded-xl overflow-hidden"
              style={{ backgroundColor: "#111", border: "1px solid #222" }}
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-4 text-left"
              >
                <span className="text-sm font-medium text-white">{faq.q}</span>
                {openFaq === i ? (
                  <ChevronUp className="w-4 h-4 text-gray-500 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
                )}
              </button>
              {openFaq === i && (
                <div className="px-6 pb-4">
                  <p className="text-sm text-gray-400 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="max-w-4xl mx-auto px-4 pb-20 text-center">
        <div
          className="rounded-2xl p-10"
          style={{
            backgroundColor: "#111",
            border: "1px solid #00FF8530",
            background: "linear-gradient(135deg, #111 0%, #0a1a0f 100%)",
          }}
        >
          <Shield className="w-10 h-10 mx-auto mb-4" style={{ color: "#00FF85" }} />
          <h2 className="text-2xl font-bold text-white mb-3">
            Ready to Play Smarter?
          </h2>
          <p className="text-gray-400 mb-6 max-w-lg mx-auto">
            Join thousands of golfers who use golfEQUALIZER to discover, plan,
            and experience better golf.
          </p>
          <button
            onClick={() => session ? handleSubscribe("pro") : undefined}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all hover:scale-105"
            style={{ backgroundColor: "#00FF85", color: "#0A0A0A" }}
          >
            <Sparkles className="w-5 h-5" />
            Start Your Free Trial
          </button>
          <p className="text-xs text-gray-500 mt-3">No credit card required for trial</p>
        </div>
      </section>
    </div>
  );
}
