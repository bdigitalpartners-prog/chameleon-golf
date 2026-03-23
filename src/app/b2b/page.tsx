"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  Building2,
  BarChart3,
  Link2,
  Search,
  Eye,
  MousePointer2,
  Star,
  TrendingUp,
  Check,
  ArrowRight,
  Megaphone,
  Image,
  Calendar,
  Globe,
} from "lucide-react";

/* ─── B2B Tier Data ─────────────────────────────── */
const B2B_TIERS = [
  {
    name: "Basic",
    price: "Free",
    priceSuffix: "",
    color: "#6B7280",
    features: [
      "Standard listing in course database",
      "Basic course information display",
      "Rankings & community ratings visible",
      "Course contact information",
    ],
    cta: "Claim Your Course",
  },
  {
    name: "Enhanced",
    price: "$299",
    priceSuffix: "/month",
    color: "#00FF85",
    badge: "Popular",
    features: [
      "Everything in Basic",
      "Custom course description",
      "Featured images gallery (up to 20)",
      "Booking link integration",
      "Amenities & facilities list",
      "Contact information showcase",
      "Monthly performance reports",
    ],
    cta: "Get Enhanced",
  },
  {
    name: "Premium",
    price: "$599",
    priceSuffix: "/month",
    color: "#F59E0B",
    features: [
      "Everything in Enhanced",
      "Featured placement in search & recommendations",
      "Full analytics dashboard (views, clicks, inquiries)",
      "Special offers & promotions tool",
      "Social media links integration",
      "Priority in AI Concierge recommendations",
      "Dedicated account manager",
      "Custom content sections",
    ],
    cta: "Go Premium",
  },
];

/* ─── Value Props ───────────────────────────────── */
const VALUE_PROPS = [
  {
    icon: Eye,
    title: "Enhanced Visibility",
    desc: "Put your course in front of 20,000+ golf enthusiasts actively researching where to play.",
  },
  {
    icon: Image,
    title: "Custom Profiles",
    desc: "Showcase your course with custom descriptions, photos, amenities, and booking links.",
  },
  {
    icon: Link2,
    title: "Direct Bookings",
    desc: "Drive tee time reservations with integrated booking links and special offers.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    desc: "Track profile views, booking clicks, and user engagement with real-time analytics.",
  },
  {
    icon: Star,
    title: "Featured Placement",
    desc: "Appear first in search results, AI recommendations, and curated course lists.",
  },
  {
    icon: Megaphone,
    title: "Promotions & Offers",
    desc: "Create and manage special offers, seasonal deals, and event promotions.",
  },
];

/* ─── Analytics Preview Data ────────────────────── */
const SAMPLE_ANALYTICS = [
  { month: "Oct", views: 820, clicks: 89 },
  { month: "Nov", views: 1240, clicks: 134 },
  { month: "Dec", views: 680, clicks: 72 },
  { month: "Jan", views: 1580, clicks: 189 },
  { month: "Feb", views: 2100, clicks: 245 },
  { month: "Mar", views: 2840, clicks: 312 },
];

export default function B2BPage() {
  const { data: session } = useSession();
  const [claimForm, setClaimForm] = useState({
    courseSearch: "",
    contactEmail: "",
    businessName: "",
    proofOfOwnership: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder — would search for course and submit claim
    setSubmitted(true);
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
            <Building2 className="w-4 h-4" />
            For Course Operators
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Put Your Course in Front of{" "}
            <span style={{ color: "#00FF85" }}>20,000+ Golf Enthusiasts</span>
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8">
            Claim your course profile, enhance your presence, and drive more tee times
            with golfEQUALIZER&apos;s B2B platform.
          </p>
          <a
            href="#claim"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all hover:scale-105"
            style={{ backgroundColor: "#00FF85", color: "#0A0A0A" }}
          >
            Claim Your Course
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </section>

      {/* Value Propositions */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Why Partner With golfEQUALIZER?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {VALUE_PROPS.map((vp) => {
            const Icon = vp.icon;
            return (
              <div
                key={vp.title}
                className="rounded-xl p-6"
                style={{ backgroundColor: "#111", border: "1px solid #222" }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                  style={{ backgroundColor: "#00FF8515" }}
                >
                  <Icon className="w-5 h-5" style={{ color: "#00FF85" }} />
                </div>
                <h3 className="text-white font-semibold mb-2">{vp.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{vp.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Analytics Preview */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <div
          className="rounded-2xl p-8"
          style={{ backgroundColor: "#111", border: "1px solid #222" }}
        >
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-6 h-6" style={{ color: "#00FF85" }} />
            <h3 className="text-xl font-bold text-white">Analytics Dashboard Preview</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-medium">
              Sample Data
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="rounded-lg p-4" style={{ backgroundColor: "#0A0A0A" }}>
              <p className="text-xs text-gray-500 mb-1">Monthly Views</p>
              <p className="text-2xl font-bold text-white">2,840</p>
              <p className="text-xs" style={{ color: "#00FF85" }}>+35% vs last month</p>
            </div>
            <div className="rounded-lg p-4" style={{ backgroundColor: "#0A0A0A" }}>
              <p className="text-xs text-gray-500 mb-1">Booking Clicks</p>
              <p className="text-2xl font-bold text-white">312</p>
              <p className="text-xs" style={{ color: "#00FF85" }}>+27% vs last month</p>
            </div>
            <div className="rounded-lg p-4" style={{ backgroundColor: "#0A0A0A" }}>
              <p className="text-xs text-gray-500 mb-1">Click-Through Rate</p>
              <p className="text-2xl font-bold text-white">11.0%</p>
              <p className="text-xs" style={{ color: "#00FF85" }}>Above industry avg</p>
            </div>
          </div>
          {/* Simple bar chart */}
          <div className="flex items-end gap-2 h-40">
            {SAMPLE_ANALYTICS.map((d) => (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-md transition-all"
                  style={{
                    height: `${(d.views / 3000) * 100}%`,
                    backgroundColor: "#00FF85",
                    opacity: 0.7,
                  }}
                />
                <span className="text-xs text-gray-500">{d.month}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* B2B Tier Cards */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <h2 className="text-3xl font-bold text-white text-center mb-4">
          Choose Your Profile Tier
        </h2>
        <p className="text-gray-400 text-center mb-10 max-w-lg mx-auto">
          From free listings to premium placement — scale your visibility as you grow.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {B2B_TIERS.map((tier) => (
            <div
              key={tier.name}
              className="relative rounded-2xl p-6 flex flex-col"
              style={{
                backgroundColor: "#111",
                border: `2px solid ${tier.color}30`,
              }}
            >
              {tier.badge && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold"
                  style={{ backgroundColor: tier.color, color: "#0A0A0A" }}
                >
                  {tier.badge}
                </div>
              )}
              <h3 className="text-xl font-bold text-white mb-2 mt-2">{tier.name}</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-bold text-white">{tier.price}</span>
                <span className="text-gray-500">{tier.priceSuffix}</span>
              </div>
              <ul className="space-y-3 mb-6 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                    <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: tier.color }} />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="#claim"
                className="w-full py-3 rounded-xl font-semibold text-sm text-center transition-all hover:scale-[1.02] block"
                style={{
                  backgroundColor: tier.color,
                  color: "#0A0A0A",
                }}
              >
                {tier.cta}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Claim Form */}
      <section id="claim" className="max-w-2xl mx-auto px-4 pb-20">
        <h2 className="text-3xl font-bold text-white text-center mb-4">
          Claim Your Course
        </h2>
        <p className="text-gray-400 text-center mb-8">
          Verify your ownership and unlock your enhanced course profile.
        </p>

        {submitted ? (
          <div
            className="rounded-xl p-8 text-center"
            style={{ backgroundColor: "#111", border: "1px solid #00FF8530" }}
          >
            <Check className="w-12 h-12 mx-auto mb-4" style={{ color: "#00FF85" }} />
            <h3 className="text-xl font-bold text-white mb-2">Claim Submitted!</h3>
            <p className="text-gray-400 text-sm">
              Our team will review your claim and contact you within 48 hours.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmitClaim}
            className="rounded-xl p-8 space-y-5"
            style={{ backgroundColor: "#111", border: "1px solid #222" }}
          >
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Course Name</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={claimForm.courseSearch}
                  onChange={(e) => setClaimForm({ ...claimForm, courseSearch: e.target.value })}
                  placeholder="Search for your course..."
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm text-white placeholder-gray-500"
                  style={{ backgroundColor: "#0A0A0A", border: "1px solid #333" }}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Business Name</label>
              <input
                type="text"
                value={claimForm.businessName}
                onChange={(e) => setClaimForm({ ...claimForm, businessName: e.target.value })}
                placeholder="e.g., Pine Valley Golf Club LLC"
                required
                className="w-full px-4 py-2.5 rounded-lg text-sm text-white placeholder-gray-500"
                style={{ backgroundColor: "#0A0A0A", border: "1px solid #333" }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Contact Email</label>
              <input
                type="email"
                value={claimForm.contactEmail}
                onChange={(e) => setClaimForm({ ...claimForm, contactEmail: e.target.value })}
                placeholder="you@golfcourse.com"
                required
                className="w-full px-4 py-2.5 rounded-lg text-sm text-white placeholder-gray-500"
                style={{ backgroundColor: "#0A0A0A", border: "1px solid #333" }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Proof of Ownership <span className="text-gray-500">(optional)</span>
              </label>
              <textarea
                value={claimForm.proofOfOwnership}
                onChange={(e) => setClaimForm({ ...claimForm, proofOfOwnership: e.target.value })}
                placeholder="Describe your role and how we can verify your connection to this course..."
                rows={3}
                className="w-full px-4 py-2.5 rounded-lg text-sm text-white placeholder-gray-500 resize-none"
                style={{ backgroundColor: "#0A0A0A", border: "1px solid #333" }}
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:scale-[1.02]"
              style={{ backgroundColor: "#00FF85", color: "#0A0A0A" }}
            >
              Submit Claim Request
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
