"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  SlidersHorizontal,
  Database,
  Users,
  Sparkles,
  ArrowRight,
  Check,
  Share2,
  Copy,
  ChevronRight,
  Mail,
} from "lucide-react";

const TEAL = "#01696F";
const TEAL_HOVER = "#015358";
const TEAL_GLOW = "rgba(1, 105, 111, 0.25)";
const TEAL_BG = "rgba(1, 105, 111, 0.1)";
const TEAL_MUTED = "rgba(1, 105, 111, 0.4)";

const HANDICAP_OPTIONS = [
  { value: "", label: "Select handicap range (optional)" },
  { value: "0-5", label: "0–5 (Scratch to low)" },
  { value: "6-10", label: "6–10" },
  { value: "11-15", label: "11–15" },
  { value: "16-20", label: "16–20" },
  { value: "21+", label: "21+ (Beginner)" },
];

const VALUE_PROPS = [
  {
    icon: SlidersHorizontal,
    title: "Personalized Rankings",
    desc: "Adjust 6 dimensions — Design, Conditions, Challenge, Vibe, Value, Prestige — to get YOUR top courses, not someone else's opinion.",
  },
  {
    icon: Database,
    title: "1,499+ Courses",
    desc: "The most comprehensive golf course database with expert rankings aggregated from 46+ lists across 4 trusted publications.",
  },
  {
    icon: Users,
    title: "Social Circles",
    desc: "Create private groups, share your personalized rankings, and plan golf trips with friends — all in one place.",
  },
  {
    icon: Sparkles,
    title: "Chameleon Score",
    desc: "Our proprietary algorithm combines expert data with your personal preferences into a single, dynamic score.",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Set your priorities",
    desc: "Use interactive sliders to tell us what matters most — walkability, challenge, value, aesthetics, and more.",
  },
  {
    step: "02",
    title: "Discover courses ranked YOUR way",
    desc: "Watch rankings shift in real time as the algorithm adapts to your preferences.",
  },
  {
    step: "03",
    title: "Join Circles",
    desc: "Create private groups with your golf crew to share rankings and compare preferences.",
  },
  {
    step: "04",
    title: "Plan your next golf trip",
    desc: "Use airport proximity data, filters, and group consensus to find the perfect destination.",
  },
];

function ConfettiEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      size: number;
      rotation: number;
      rotationSpeed: number;
      opacity: number;
    }[] = [];

    const colors = [TEAL, "#22c55e", "#eab308", "#f5f5f5", "#01696F", "#38bdf8"];

    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -10 - Math.random() * canvas.height * 0.5,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 3 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 6 + 3,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1,
      });
    }

    let frame = 0;
    const maxFrames = 120;

    function animate() {
      if (frame >= maxFrames) {
        ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
        return;
      }
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1;
        p.rotation += p.rotationSpeed;
        p.opacity = Math.max(0, 1 - frame / maxFrames);

        ctx!.save();
        ctx!.translate(p.x, p.y);
        ctx!.rotate((p.rotation * Math.PI) / 180);
        ctx!.globalAlpha = p.opacity;
        ctx!.fillStyle = p.color;
        ctx!.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx!.restore();
      });

      frame++;
      requestAnimationFrame(animate);
    }

    animate();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 50 }}
    />
  );
}

function WaitlistForm({
  source,
  compact = false,
}: {
  source: string;
  compact?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [handicap, setHandicap] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [position, setPosition] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          handicap: handicap || null,
          source,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setPosition(data.position);
      setSuccess(true);
      if (!data.alreadySignedUp) {
        setShowConfetti(true);
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleCopyLink() {
    navigator.clipboard.writeText("https://golfequalizer.ai/waitlist");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleShareTwitter() {
    const text = encodeURIComponent(
      "I just joined the waitlist for Chameleon Golf — personalized golf course rankings based on what matters to YOU. Check it out!"
    );
    const url = encodeURIComponent("https://golfequalizer.ai/waitlist");
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  if (success) {
    return (
      <>
        {showConfetti && <ConfettiEffect />}
        <div
          className="rounded-2xl p-8 text-center"
          style={{
            backgroundColor: "var(--cg-bg-card)",
            border: `1px solid ${TEAL_MUTED}`,
          }}
        >
          <div
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full mb-4"
            style={{ backgroundColor: TEAL_BG }}
          >
            <Check className="h-8 w-8" style={{ color: TEAL }} />
          </div>
          <h3
            className="text-2xl font-bold mb-2"
            style={{ color: "var(--cg-text-primary)" }}
          >
            You're in!
          </h3>
          {position && (
            <p className="text-lg mb-1" style={{ color: TEAL }}>
              You're <span className="font-bold">#{position}</span> on the waitlist
            </p>
          )}
          <p
            className="text-sm mb-6"
            style={{ color: "var(--cg-text-secondary)" }}
          >
            We'll notify you as soon as Chameleon Golf launches.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all"
              style={{
                border: `1px solid ${TEAL_MUTED}`,
                color: TEAL,
              }}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied!" : "Copy invite link"}
            </button>
            <button
              onClick={handleShareTwitter}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all"
              style={{
                border: `1px solid ${TEAL_MUTED}`,
                color: TEAL,
              }}
            >
              <Share2 className="h-4 w-4" />
              Share on X
            </button>
          </div>
        </div>
      </>
    );
  }

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 rounded-xl px-4 py-3 text-sm outline-none placeholder:opacity-50"
          style={{
            backgroundColor: "var(--cg-bg-tertiary)",
            color: "var(--cg-text-primary)",
            border: `1px solid var(--cg-border)`,
          }}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl px-6 py-3 text-sm font-semibold transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0 whitespace-nowrap"
          style={{
            backgroundColor: TEAL,
            color: "#ffffff",
            boxShadow: `0 8px 30px ${TEAL_GLOW}`,
          }}
        >
          {loading ? "Joining..." : "Get Early Access"}
        </button>
        {error && (
          <p className="text-sm sm:col-span-2" style={{ color: "var(--cg-error)" }}>
            {error}
          </p>
        )}
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <input
          type="email"
          placeholder="Your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl px-4 py-3.5 text-base outline-none placeholder:opacity-50"
          style={{
            backgroundColor: "var(--cg-bg-tertiary)",
            color: "var(--cg-text-primary)",
            border: `1px solid var(--cg-border)`,
          }}
          required
        />
      </div>
      <div>
        <select
          value={handicap}
          onChange={(e) => setHandicap(e.target.value)}
          className="w-full rounded-xl px-4 py-3.5 text-base outline-none appearance-none"
          style={{
            backgroundColor: "var(--cg-bg-tertiary)",
            color: handicap ? "var(--cg-text-primary)" : "var(--cg-text-muted)",
            border: `1px solid var(--cg-border)`,
          }}
        >
          {HANDICAP_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl px-8 py-3.5 text-base font-semibold transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
        style={{
          backgroundColor: TEAL,
          color: "#ffffff",
          boxShadow: `0 8px 30px ${TEAL_GLOW}`,
        }}
      >
        {loading ? "Joining..." : "Join the Waitlist"}
        {!loading && <ArrowRight className="inline-block ml-2 h-4 w-4" />}
      </button>
      {error && (
        <p className="text-sm" style={{ color: "var(--cg-error)" }}>
          {error}
        </p>
      )}
    </form>
  );
}

export default function WaitlistPage() {
  const [waitlistCount, setWaitlistCount] = useState<number>(0);

  useEffect(() => {
    fetch("/api/waitlist")
      .then((r) => r.json())
      .then((data) => setWaitlistCount(data.count || 0))
      .catch(() => {});
  }, []);

  return (
    <div style={{ backgroundColor: "var(--cg-bg-primary)" }}>
      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 80% 50% at 50% -20%, ${TEAL_GLOW}, transparent),
              radial-gradient(ellipse 60% 40% at 80% 80%, ${TEAL_BG}, transparent),
              var(--cg-bg-primary)
            `,
          }}
        />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(var(--cg-text-primary) 1px, transparent 1px),
              linear-gradient(90deg, var(--cg-text-primary) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 pt-20 pb-24 sm:pt-28 sm:pb-32">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            {/* Left: Copy */}
            <div>
              <div
                className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium"
                style={{
                  backgroundColor: TEAL_BG,
                  color: TEAL,
                  border: `1px solid ${TEAL_MUTED}`,
                }}
              >
                <Mail className="h-3.5 w-3.5" />
                Coming Soon
              </div>

              <h1
                className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
                style={{ color: "var(--cg-text-primary)" }}
              >
                Your Golf Rankings.{" "}
                <span style={{ color: TEAL }}>Your Way.</span>
              </h1>

              <p
                className="mt-6 text-lg leading-relaxed sm:text-xl max-w-xl"
                style={{ color: "var(--cg-text-secondary)" }}
              >
                Chameleon Golf creates personalized course rankings based on what
                matters to YOU — not what a magazine thinks.
              </p>

              {waitlistCount > 0 && (
                <p className="mt-4 text-sm font-medium" style={{ color: TEAL }}>
                  Join {waitlistCount.toLocaleString()}+ golfers already on the list
                </p>
              )}
            </div>

            {/* Right: Signup form */}
            <div
              className="rounded-2xl p-8"
              style={{
                backgroundColor: "var(--cg-bg-card)",
                border: "1px solid var(--cg-border)",
              }}
            >
              <h2
                className="text-xl font-bold mb-2"
                style={{ color: "var(--cg-text-primary)" }}
              >
                Get early access
              </h2>
              <p
                className="text-sm mb-6"
                style={{ color: "var(--cg-text-secondary)" }}
              >
                Be the first to experience personalized golf course rankings.
              </p>
              <WaitlistForm source="waitlist-page-hero" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── VALUE PROPS ─── */}
      <section
        className="py-20 sm:py-24"
        style={{
          backgroundColor: "var(--cg-bg-secondary)",
          borderTop: "1px solid var(--cg-border-subtle)",
        }}
      >
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-14">
            <h2
              className="text-2xl font-bold sm:text-3xl lg:text-4xl"
              style={{ color: "var(--cg-text-primary)" }}
            >
              Rankings that adapt to{" "}
              <span style={{ color: TEAL }}>you</span>
            </h2>
            <p
              className="mt-4 mx-auto max-w-2xl text-base"
              style={{ color: "var(--cg-text-secondary)" }}
            >
              Stop relying on one-size-fits-all lists. Chameleon Golf puts you
              in control of how courses are ranked.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUE_PROPS.map((prop) => (
              <div
                key={prop.title}
                className="rounded-2xl p-6 transition-colors group"
                style={{
                  backgroundColor: "var(--cg-bg-card)",
                  border: "1px solid var(--cg-border)",
                }}
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl mb-4"
                  style={{ backgroundColor: TEAL_BG, color: TEAL }}
                >
                  <prop.icon className="h-6 w-6" />
                </div>
                <h3
                  className="text-lg font-semibold mb-2"
                  style={{ color: "var(--cg-text-primary)" }}
                >
                  {prop.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--cg-text-secondary)" }}
                >
                  {prop.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section
        className="py-20 sm:py-24"
        style={{
          backgroundColor: "var(--cg-bg-primary)",
          borderTop: "1px solid var(--cg-border-subtle)",
        }}
      >
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-14">
            <h2
              className="text-2xl font-bold sm:text-3xl lg:text-4xl"
              style={{ color: "var(--cg-text-primary)" }}
            >
              How it works
            </h2>
            <p
              className="mt-4 mx-auto max-w-2xl text-base"
              style={{ color: "var(--cg-text-secondary)" }}
            >
              Four simple steps to golf course rankings that actually match
              what you care about.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((item, i) => (
              <div key={item.step} className="relative">
                {/* Connector line (hidden on last item) */}
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-px" style={{ backgroundColor: "var(--cg-border)" }} />
                )}
                <div
                  className="text-3xl font-bold mb-4"
                  style={{ color: TEAL, opacity: 0.6 }}
                >
                  {item.step}
                </div>
                <h3
                  className="text-lg font-semibold mb-2"
                  style={{ color: "var(--cg-text-primary)" }}
                >
                  {item.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--cg-text-secondary)" }}
                >
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SOCIAL PROOF ─── */}
      <section
        className="py-20 sm:py-24"
        style={{
          backgroundColor: "var(--cg-bg-secondary)",
          borderTop: "1px solid var(--cg-border-subtle)",
        }}
      >
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2
            className="text-2xl font-bold sm:text-3xl"
            style={{ color: "var(--cg-text-primary)" }}
          >
            Built by golfers, for golfers
          </h2>
          <p
            className="mt-6 text-lg leading-relaxed max-w-2xl mx-auto"
            style={{ color: "var(--cg-text-secondary)" }}
          >
            Rankings aggregated from{" "}
            <span className="font-semibold" style={{ color: TEAL }}>
              46+ expert sources
            </span>{" "}
            including Golf Digest, Golfweek, GOLF Magazine, and
            Top100GolfCourses — combined with your personal preferences to
            create rankings that are uniquely yours.
          </p>

          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { value: "1,499+", label: "Courses" },
              { value: "46+", label: "Ranking Lists" },
              { value: "4", label: "Expert Sources" },
              { value: "6", label: "Preference Dimensions" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl p-5"
                style={{
                  backgroundColor: "var(--cg-bg-card)",
                  border: "1px solid var(--cg-border)",
                }}
              >
                <div
                  className="text-2xl font-bold"
                  style={{ color: TEAL }}
                >
                  {stat.value}
                </div>
                <div
                  className="text-xs mt-1"
                  style={{ color: "var(--cg-text-muted)" }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── BOTTOM CTA ─── */}
      <section
        className="py-20 sm:py-24"
        style={{
          backgroundColor: "var(--cg-bg-primary)",
          borderTop: "1px solid var(--cg-border-subtle)",
        }}
      >
        <div className="mx-auto max-w-xl px-4 text-center">
          <h2
            className="text-2xl font-bold sm:text-3xl"
            style={{ color: "var(--cg-text-primary)" }}
          >
            Be the first to know when we launch
          </h2>
          <p
            className="mt-4 text-base mb-8"
            style={{ color: "var(--cg-text-secondary)" }}
          >
            Join the waitlist and get early access to personalized golf course
            rankings.
          </p>
          <WaitlistForm source="waitlist-page-bottom" />
        </div>
      </section>
    </div>
  );
}
