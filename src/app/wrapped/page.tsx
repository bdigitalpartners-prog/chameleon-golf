"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Gift, ChevronRight, ChevronLeft, Share2, Sparkles, MapPin, Palette, User, Trophy, Brain, BarChart3, Star } from "lucide-react";

/* ─── Types ─── */
interface WrappedData {
  year: number;
  user_name: string;
  courses_viewed: number;
  courses_rated: number;
  courses_played: number;
  conditions_reported: number;
  top_region: string;
  favorite_style: string;
  favorite_architect: string;
  eq_score_range_viewed: { min: number; max: number };
  top_courses_viewed: string[];
  total_green_fees_estimated: number;
  rounds_logged: number;
  trips_planned: number;
  concierge_queries: number;
  comparisons_made: number;
  personality_type: string;
  fun_stats: {
    most_viewed_course: string;
    earliest_morning_browse: string;
    total_time_on_platform_hours: number;
  };
}

/* ─── Animated Counter ─── */
function AnimatedCounter({ target, duration = 2000, prefix = "", suffix = "" }: {
  target: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);

  return (
    <span className="tabular-nums">
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}

/* ─── Slide Gradients ─── */
const SLIDE_GRADIENTS = [
  "linear-gradient(135deg, #0A0A0A 0%, #0d2818 50%, #0A0A0A 100%)",
  "linear-gradient(135deg, #0A0A0A 0%, #002b1a 50%, #001a10 100%)",
  "linear-gradient(135deg, #0A0A0A 0%, #1a1a2e 50%, #0A0A0A 100%)",
  "linear-gradient(135deg, #0A0A0A 0%, #2d1b4e 50%, #0A0A0A 100%)",
  "linear-gradient(135deg, #0A0A0A 0%, #1e3a2f 50%, #0A0A0A 100%)",
  "linear-gradient(135deg, #0A0A0A 0%, #0a2a3a 50%, #0A0A0A 100%)",
  "linear-gradient(135deg, #0A0A0A 0%, #2a1a0a 50%, #0A0A0A 100%)",
  "linear-gradient(135deg, #0A0A0A 0%, #1a3a1a 50%, #0A0A0A 100%)",
  "linear-gradient(135deg, #0A0A0A 0%, #003d29 50%, #001f15 100%)",
  "linear-gradient(135deg, #0A0A0A 0%, #00261a 50%, #0A0A0A 100%)",
];

/* ─── Landing Page (no wrapped yet) ─── */
function WrappedLanding({ onGenerate, loading }: { onGenerate: () => void; loading: boolean }) {
  const previewCards = [
    { icon: BarChart3, title: "Courses Explored", desc: "How many courses you viewed, rated, and played" },
    { icon: MapPin, title: "Your Top Region", desc: "Where your golf obsession took you most" },
    { icon: Palette, title: "Favorite Style", desc: "Links, parkland, desert — what's your vibe?" },
    { icon: User, title: "Favorite Architect", desc: "Which designer's work you explored most" },
    { icon: Brain, title: "Personality Type", desc: "Are you an Architecture Nerd or a Value Hunter?" },
    { icon: Star, title: "Fun Stats", desc: "Your earliest morning browse, most-viewed course, and more" },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16"
      style={{ background: "linear-gradient(135deg, #0A0A0A 0%, #0d2818 50%, #0A0A0A 100%)" }}>

      {/* Hero */}
      <div className="text-center mb-12 animate-fade-in">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
          style={{ backgroundColor: "rgba(0,255,133,0.1)", border: "1px solid rgba(0,255,133,0.2)" }}>
          <Sparkles className="w-4 h-4" style={{ color: "#00FF85" }} />
          <span className="text-sm font-medium" style={{ color: "#00FF85" }}>EQ Wrapped 2026</span>
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4" style={{ color: "white" }}>
          Your Year in<br />
          <span style={{ color: "#00FF85" }}>Golf Intelligence</span>
        </h1>
        <p className="text-lg max-w-xl mx-auto" style={{ color: "#9CA3AF" }}>
          Discover your personalized golf journey — courses explored, architects discovered,
          and the personality behind your play.
        </p>
      </div>

      {/* Preview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto mb-12">
        {previewCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i}
              className="rounded-xl p-5 transition-all hover:scale-[1.02]"
              style={{
                backgroundColor: "#111111",
                border: "1px solid #222222",
                animationDelay: `${i * 100}ms`,
              }}>
              <Icon className="w-6 h-6 mb-3" style={{ color: "#00FF85" }} />
              <h3 className="text-sm font-semibold mb-1" style={{ color: "white" }}>{card.title}</h3>
              <p className="text-xs" style={{ color: "#9CA3AF" }}>{card.desc}</p>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <button
        onClick={onGenerate}
        disabled={loading}
        className="px-8 py-4 rounded-xl text-lg font-semibold transition-all hover:scale-105 disabled:opacity-50"
        style={{ backgroundColor: "#00FF85", color: "#0A0A0A" }}>
        {loading ? "Generating..." : "Generate My Wrapped"}
      </button>
      <p className="mt-3 text-xs" style={{ color: "#9CA3AF" }}>
        Preview mode — generates sample data to showcase the experience
      </p>
    </div>
  );
}

/* ─── Story Slides ─── */
function WrappedStory({ data, onBack }: { data: WrappedData; onBack: () => void }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [shareMsg, setShareMsg] = useState("");

  const slides = buildSlides(data);
  const totalSlides = slides.length;

  const goTo = useCallback((idx: number) => {
    if (animating || idx < 0 || idx >= totalSlides) return;
    setAnimating(true);
    setCurrentSlide(idx);
    setTimeout(() => setAnimating(false), 500);
  }, [animating, totalSlides]);

  const next = () => goTo(currentSlide + 1);
  const prev = () => goTo(currentSlide - 1);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  async function handleShare() {
    try {
      const res = await fetch("/api/wrapped/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year: data.year }),
      });
      const json = await res.json();
      if (json.share_url) {
        await navigator.clipboard.writeText(window.location.origin + json.share_url);
        setShareMsg("Link copied!");
        setTimeout(() => setShareMsg(""), 3000);
      }
    } catch {
      setShareMsg("Could not generate share link");
      setTimeout(() => setShareMsg(""), 3000);
    }
  }

  const slide = slides[currentSlide];

  return (
    <div className="min-h-screen relative select-none"
      style={{ background: SLIDE_GRADIENTS[currentSlide % SLIDE_GRADIENTS.length] }}>

      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex gap-1 p-2">
        {slides.map((_, i) => (
          <div key={i} className="flex-1 h-1 rounded-full overflow-hidden cursor-pointer"
            onClick={() => goTo(i)}
            style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
            <div className="h-full rounded-full transition-all duration-300"
              style={{
                width: i < currentSlide ? "100%" : i === currentSlide ? "100%" : "0%",
                backgroundColor: i <= currentSlide ? "#00FF85" : "transparent",
              }} />
          </div>
        ))}
      </div>

      {/* Slide Content */}
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-20"
        style={{ animation: "fadeSlideIn 0.5s ease-out" }}
        key={currentSlide}>
        {slide}
      </div>

      {/* Navigation */}
      <div className="fixed bottom-6 left-0 right-0 flex items-center justify-between px-6 z-50">
        <button onClick={prev}
          className="p-3 rounded-full transition-all"
          style={{
            backgroundColor: currentSlide === 0 ? "transparent" : "rgba(255,255,255,0.1)",
            color: currentSlide === 0 ? "transparent" : "white",
            cursor: currentSlide === 0 ? "default" : "pointer",
          }}>
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs tabular-nums" style={{ color: "rgba(255,255,255,0.5)" }}>
            {currentSlide + 1} / {totalSlides}
          </span>
          {currentSlide === totalSlides - 1 && (
            <button onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all hover:scale-105"
              style={{ backgroundColor: "#00FF85", color: "#0A0A0A" }}>
              <Share2 className="w-4 h-4" />
              Share
            </button>
          )}
          {shareMsg && (
            <span className="text-xs" style={{ color: "#00FF85" }}>{shareMsg}</span>
          )}
        </div>

        <button onClick={next}
          className="p-3 rounded-full transition-all"
          style={{
            backgroundColor: currentSlide === totalSlides - 1 ? "transparent" : "rgba(255,255,255,0.1)",
            color: currentSlide === totalSlides - 1 ? "transparent" : "white",
            cursor: currentSlide === totalSlides - 1 ? "default" : "pointer",
          }}>
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Back button */}
      <button onClick={onBack}
        className="fixed top-6 right-6 z-50 text-xs px-3 py-1.5 rounded-full transition-all"
        style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
        Exit
      </button>

      <style jsx>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

/* ─── Slide Builder ─── */
function buildSlides(d: WrappedData): React.ReactNode[] {
  return [
    // Slide 1: Hero
    <div key="hero" className="text-center">
      <div className="text-sm font-medium mb-4" style={{ color: "#00FF85" }}>golfEQUALIZER Wrapped</div>
      <h1 className="text-5xl sm:text-7xl font-bold mb-4" style={{ color: "white" }}>
        Your {d.year}<br />in Golf
      </h1>
      <p className="text-xl" style={{ color: "#9CA3AF" }}>
        {d.user_name ? `${d.user_name}'s personalized journey` : "Your personalized journey"}
      </p>
      <div className="mt-8 text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
        Tap or swipe to continue →
      </div>
    </div>,

    // Slide 2: Courses Viewed
    <div key="courses" className="text-center">
      <BarChart3 className="w-12 h-12 mx-auto mb-6" style={{ color: "#00FF85" }} />
      <p className="text-lg mb-2" style={{ color: "#9CA3AF" }}>You explored</p>
      <div className="text-7xl sm:text-8xl font-bold mb-4" style={{ color: "#00FF85" }}>
        <AnimatedCounter target={d.courses_viewed} />
      </div>
      <p className="text-xl" style={{ color: "white" }}>courses on golfEQUALIZER</p>
      <div className="mt-8 flex justify-center gap-8">
        <div className="text-center">
          <div className="text-2xl font-bold" style={{ color: "white" }}>
            <AnimatedCounter target={d.courses_rated} />
          </div>
          <div className="text-xs" style={{ color: "#9CA3AF" }}>rated</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold" style={{ color: "white" }}>
            <AnimatedCounter target={d.courses_played} />
          </div>
          <div className="text-xs" style={{ color: "#9CA3AF" }}>played</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold" style={{ color: "white" }}>
            <AnimatedCounter target={d.rounds_logged} />
          </div>
          <div className="text-xs" style={{ color: "#9CA3AF" }}>rounds logged</div>
        </div>
      </div>
    </div>,

    // Slide 3: Top Region
    <div key="region" className="text-center">
      <MapPin className="w-12 h-12 mx-auto mb-6" style={{ color: "#00FF85" }} />
      <p className="text-lg mb-2" style={{ color: "#9CA3AF" }}>Your top region was</p>
      <div className="text-5xl sm:text-6xl font-bold mb-4" style={{ color: "white" }}>
        {d.top_region}
      </div>
      <p className="text-sm" style={{ color: "#9CA3AF" }}>
        You planned {d.trips_planned} trip{d.trips_planned !== 1 ? "s" : ""} this year
      </p>
    </div>,

    // Slide 4: Favorite Style
    <div key="style" className="text-center">
      <Palette className="w-12 h-12 mx-auto mb-6" style={{ color: "#00FF85" }} />
      <p className="text-lg mb-2" style={{ color: "#9CA3AF" }}>Your favorite course style</p>
      <div className="text-5xl sm:text-6xl font-bold mb-4" style={{ color: "white" }}>
        {d.favorite_style}
      </div>
      <p className="text-sm max-w-md mx-auto" style={{ color: "#9CA3AF" }}>
        {d.favorite_style === "Links" && "Wind-swept, sandy terrain, natural contours — you love the game in its purest form."}
        {d.favorite_style === "Parkland" && "Lush fairways, mature trees, manicured conditions — classic American golf at its finest."}
        {d.favorite_style === "Heathland" && "Gorse, heather, and firm turf — you appreciate the subtle beauty of heathland golf."}
        {d.favorite_style === "Desert" && "Dramatic desert landscapes and target golf — you love the visual spectacle."}
        {d.favorite_style === "Mountain" && "Elevation changes and mountain views — you play for the scenery and the challenge."}
        {d.favorite_style === "Coastal" && "Ocean breezes and clifftop views — you're drawn to golf by the sea."}
        {d.favorite_style === "Prairie" && "Wide-open spaces and natural routing — minimalism in its finest form."}
      </p>
    </div>,

    // Slide 5: Favorite Architect
    <div key="architect" className="text-center">
      <User className="w-12 h-12 mx-auto mb-6" style={{ color: "#00FF85" }} />
      <p className="text-lg mb-2" style={{ color: "#9CA3AF" }}>Your most-explored architect</p>
      <div className="text-4xl sm:text-5xl font-bold mb-4" style={{ color: "white" }}>
        {d.favorite_architect}
      </div>
      <p className="text-sm" style={{ color: "#9CA3AF" }}>
        You made {d.comparisons_made} course comparisons this year
      </p>
    </div>,

    // Slide 6: Top Courses Viewed
    <div key="top-courses" className="text-center max-w-lg">
      <Trophy className="w-12 h-12 mx-auto mb-6" style={{ color: "#00FF85" }} />
      <p className="text-lg mb-6" style={{ color: "#9CA3AF" }}>Your Top 5 Most Viewed</p>
      <div className="space-y-3">
        {d.top_courses_viewed.map((course, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3 rounded-xl"
            style={{
              backgroundColor: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              animation: `fadeSlideIn 0.5s ease-out ${i * 0.1}s both`,
            }}>
            <span className="text-2xl font-bold w-8" style={{ color: "#00FF85" }}>
              {i + 1}
            </span>
            <span className="text-sm font-medium text-left" style={{ color: "white" }}>
              {course}
            </span>
          </div>
        ))}
      </div>
    </div>,

    // Slide 7: Personality Type
    <div key="personality" className="text-center">
      <Brain className="w-16 h-16 mx-auto mb-6" style={{ color: "#00FF85" }} />
      <p className="text-lg mb-2" style={{ color: "#9CA3AF" }}>You are...</p>
      <div className="text-4xl sm:text-5xl font-bold mb-6" style={{ color: "#00FF85" }}>
        {d.personality_type}
      </div>
      <p className="text-sm max-w-md mx-auto" style={{ color: "#9CA3AF" }}>
        {d.personality_type === "The Architecture Nerd" && "You geek out over routing, bunker strategy, and green complexes. Design DNA is your love language."}
        {d.personality_type === "The Value Hunter" && "You know where to find the best golf for the best price. Green fee ROI is your superpower."}
        {d.personality_type === "The Bucket Lister" && "You're checking off the world's greatest courses one by one. Life's too short for boring golf."}
        {d.personality_type === "The Local Explorer" && "You find hidden gems in your own backyard. Every muni and daily fee gets a fair shake."}
        {d.personality_type === "The Data Junkie" && "EQ scores, rankings, comparisons — you let the numbers guide your golf decisions."}
      </p>
    </div>,

    // Slide 8: Fun Stats
    <div key="fun" className="text-center">
      <Sparkles className="w-12 h-12 mx-auto mb-6" style={{ color: "#00FF85" }} />
      <p className="text-lg mb-8" style={{ color: "#9CA3AF" }}>Fun Stats</p>
      <div className="space-y-6 max-w-md mx-auto">
        <div className="rounded-xl p-5" style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="text-xs uppercase tracking-wider mb-1" style={{ color: "#9CA3AF" }}>Most Viewed Course</div>
          <div className="text-lg font-bold" style={{ color: "white" }}>{d.fun_stats.most_viewed_course}</div>
        </div>
        <div className="rounded-xl p-5" style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="text-xs uppercase tracking-wider mb-1" style={{ color: "#9CA3AF" }}>Earliest Morning Browse</div>
          <div className="text-lg font-bold" style={{ color: "white" }}>{d.fun_stats.earliest_morning_browse}</div>
        </div>
        <div className="rounded-xl p-5" style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="text-xs uppercase tracking-wider mb-1" style={{ color: "#9CA3AF" }}>Time on Platform</div>
          <div className="text-lg font-bold" style={{ color: "white" }}>{d.fun_stats.total_time_on_platform_hours} hours</div>
        </div>
      </div>
    </div>,

    // Slide 9: Year in Numbers
    <div key="numbers" className="text-center">
      <BarChart3 className="w-12 h-12 mx-auto mb-6" style={{ color: "#00FF85" }} />
      <p className="text-lg mb-8" style={{ color: "#9CA3AF" }}>Your {d.year} in Numbers</p>
      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
        {[
          { label: "Courses Viewed", value: d.courses_viewed },
          { label: "Rounds Logged", value: d.rounds_logged },
          { label: "Trips Planned", value: d.trips_planned },
          { label: "Comparisons", value: d.comparisons_made },
          { label: "Conditions Reported", value: d.conditions_reported },
          { label: "Est. Green Fees", value: d.total_green_fees_estimated, prefix: "$" },
        ].map((stat, i) => (
          <div key={i} className="rounded-xl p-4"
            style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="text-2xl font-bold" style={{ color: "#00FF85" }}>
              <AnimatedCounter target={stat.value} prefix={stat.prefix} />
            </div>
            <div className="text-xs mt-1" style={{ color: "#9CA3AF" }}>{stat.label}</div>
          </div>
        ))}
      </div>
    </div>,

    // Slide 10: Share CTA
    <div key="share" className="text-center">
      <div className="text-sm font-medium mb-4" style={{ color: "#00FF85" }}>golfEQUALIZER Wrapped {d.year}</div>
      <h2 className="text-4xl sm:text-5xl font-bold mb-6" style={{ color: "white" }}>
        That&apos;s a Wrap!
      </h2>
      <p className="text-lg mb-8 max-w-md mx-auto" style={{ color: "#9CA3AF" }}>
        Share your year in golf intelligence with your golf buddies.
      </p>

      {/* Share Card Preview */}
      <div className="mx-auto max-w-sm rounded-2xl overflow-hidden mb-8"
        style={{ backgroundColor: "#111111", border: "1px solid #222222" }}>
        <div className="p-6">
          <div className="text-xs font-medium mb-3" style={{ color: "#00FF85" }}>golfEQUALIZER Wrapped {d.year}</div>
          <div className="text-lg font-bold mb-4" style={{ color: "white" }}>{d.user_name || "Golfer"}</div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <div className="text-xl font-bold" style={{ color: "#00FF85" }}>{d.courses_viewed}</div>
              <div className="text-[10px]" style={{ color: "#9CA3AF" }}>courses</div>
            </div>
            <div>
              <div className="text-xl font-bold" style={{ color: "#00FF85" }}>{d.rounds_logged}</div>
              <div className="text-[10px]" style={{ color: "#9CA3AF" }}>rounds</div>
            </div>
            <div>
              <div className="text-xl font-bold" style={{ color: "#00FF85" }}>{d.trips_planned}</div>
              <div className="text-[10px]" style={{ color: "#9CA3AF" }}>trips</div>
            </div>
          </div>
          <div className="text-sm font-semibold" style={{ color: "#00FF85" }}>{d.personality_type}</div>
        </div>
      </div>
    </div>,
  ];
}

/* ─── Main Page ─── */
export default function WrappedPage() {
  const { data: session } = useSession();
  const [wrappedData, setWrappedData] = useState<WrappedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showStory, setShowStory] = useState(false);

  // Check URL for share token
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const year = params.get("year") || new Date().getFullYear().toString();

    if (token) {
      fetch(`/api/wrapped/${year}?token=${token}`)
        .then((r) => r.json())
        .then((json) => {
          if (json.data) {
            const data = typeof json.data === "string" ? JSON.parse(json.data) : json.data;
            setWrappedData(data);
            setShowStory(true);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
      return;
    }

    // Check if user has existing wrapped
    if (session?.user) {
      const currentYear = new Date().getFullYear();
      fetch(`/api/wrapped/${currentYear}`)
        .then((r) => r.json())
        .then((json) => {
          if (json.data) {
            const data = typeof json.data === "string" ? JSON.parse(json.data) : json.data;
            setWrappedData(data);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [session]);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/wrapped/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year: new Date().getFullYear(), demo: true }),
      });
      const json = await res.json();
      if (json.data) {
        setWrappedData(json.data);
        setShowStory(true);
      }
    } catch {
      // Silently handle
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#0A0A0A" }}>
        <div className="animate-spin h-8 w-8 border-2 border-t-transparent rounded-full" style={{ borderColor: "#00FF85", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (showStory && wrappedData) {
    return <WrappedStory data={wrappedData} onBack={() => setShowStory(false)} />;
  }

  if (wrappedData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16"
        style={{ background: "linear-gradient(135deg, #0A0A0A 0%, #0d2818 50%, #0A0A0A 100%)" }}>
        <Gift className="w-16 h-16 mb-6" style={{ color: "#00FF85" }} />
        <h1 className="text-3xl font-bold mb-2" style={{ color: "white" }}>Your {wrappedData.year} Wrapped is Ready!</h1>
        <p className="mb-8" style={{ color: "#9CA3AF" }}>Tap to relive your year in golf.</p>
        <button onClick={() => setShowStory(true)}
          className="px-8 py-4 rounded-xl text-lg font-semibold transition-all hover:scale-105"
          style={{ backgroundColor: "#00FF85", color: "#0A0A0A" }}>
          View My Wrapped
        </button>
      </div>
    );
  }

  return <WrappedLanding onGenerate={handleGenerate} loading={generating} />;
}
