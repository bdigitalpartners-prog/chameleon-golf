"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Heart,
  MapPin,
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
  Target,
  Sliders,
  Footprints,
  DollarSign,
  Star,
  Navigation,
  LogIn,
} from "lucide-react";

interface CourseFitResult {
  courseId: number;
  name: string;
  location: string;
  style: string;
  accessType: string;
  greenFee: string;
  architect: string;
  logoUrl: string | null;
  fit_score: number;
  breakdown: Record<string, number> | null;
}

interface GolfProfile {
  handicap_range: string;
  preferred_style: string[];
  preferred_terrain: string;
  walking_preference: string;
  budget_range: string;
  values_most: string[];
  home_latitude: number | null;
  home_longitude: number | null;
}

const HANDICAP_OPTIONS = [
  { value: "0-5", label: "0–5 (Scratch/Low)" },
  { value: "5-10", label: "5–10 (Low)" },
  { value: "10-15", label: "10–15 (Mid)" },
  { value: "15-20", label: "15–20 (Mid-High)" },
  { value: "20-30", label: "20–30 (High)" },
  { value: "30+", label: "30+ (Beginner)" },
];

const STYLE_OPTIONS = [
  "Links",
  "Parkland",
  "Desert",
  "Mountain",
  "Heathland",
  "Moorland",
  "Clifftop",
  "Woodland",
  "Tropical",
];

const TERRAIN_OPTIONS = [
  { value: "flat", label: "Flat" },
  { value: "moderate", label: "Moderate Hills" },
  { value: "hilly", label: "Hilly" },
];

const WALKING_OPTIONS = [
  { value: "walking_only", label: "Walking Only" },
  { value: "prefer_walking", label: "Prefer Walking" },
  { value: "no_preference", label: "No Preference" },
  { value: "prefer_cart", label: "Prefer Cart" },
];

const BUDGET_OPTIONS = [
  { value: "under_50", label: "Under $50" },
  { value: "50_100", label: "$50–$100" },
  { value: "100_200", label: "$100–$200" },
  { value: "200_500", label: "$200–$500" },
  { value: "500_plus", label: "$500+" },
];

const VALUES_OPTIONS = [
  { value: "conditioning", label: "Conditioning" },
  { value: "challenge", label: "Challenge" },
  { value: "scenery", label: "Scenery & Aesthetics" },
  { value: "value", label: "Value for Money" },
  { value: "walkability", label: "Walkability" },
  { value: "history", label: "History & Heritage" },
  { value: "exclusivity", label: "Exclusivity" },
];

const WIZARD_STEPS = [
  { label: "Handicap", icon: Target },
  { label: "Style", icon: Heart },
  { label: "Walking", icon: Footprints },
  { label: "Budget", icon: DollarSign },
  { label: "Values", icon: Star },
  { label: "Location", icon: Navigation },
];

export default function CourseFitPage() {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<GolfProfile | null>(null);
  const [courses, setCourses] = useState<CourseFitResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [filter, setFilter] = useState({ style: "", region: "" });
  const [sortBy, setSortBy] = useState("fit_score");

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/golf-profile");
      const data = await res.json();
      if (data.profile) {
        setProfile(data.profile);
        setHasProfile(true);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTopCourses = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: "30" });
      if (filter.style) params.set("style", filter.style);
      if (filter.region) params.set("region", filter.region);
      const res = await fetch(`/api/course-fit/top?${params}`);
      const data = await res.json();
      if (data.courses) setCourses(data.courses);
    } catch {
    }
  }, [filter]);

  useEffect(() => {
    if (session) {
      fetchProfile();
    } else if (status !== "loading") {
      setLoading(false);
    }
  }, [session, status, fetchProfile]);

  useEffect(() => {
    if (hasProfile) fetchTopCourses();
  }, [hasProfile, fetchTopCourses]);

  if (status === "loading" || loading) {
    return <LoadingSkeleton />;
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <Target className="w-12 h-12 text-[#00FF85] mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Courses For You</h1>
        <p className="text-[#9CA3AF] mb-6 max-w-md">
          Sign in to create your golf profile and discover courses that match
          your preferences.
        </p>
        <button
          onClick={() => {
            const { signIn } = require("next-auth/react");
            signIn("google");
          }}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#00FF85] text-black font-semibold hover:bg-[#00FF85]/90 transition-colors"
        >
          <LogIn className="w-4 h-4" />
          Sign In to Get Started
        </button>
      </div>
    );
  }

  if (!hasProfile) {
    return (
      <ProfileWizard
        onComplete={() => {
          setHasProfile(true);
          fetchProfile();
        }}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Courses For You</h1>
        <p className="text-[#9CA3AF] text-sm">
          Personalized recommendations based on your golf profile
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          value={filter.style}
          onChange={(e) => setFilter((f) => ({ ...f, style: e.target.value }))}
          className="bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00FF85]/50"
        >
          <option value="">All Styles</option>
          {STYLE_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00FF85]/50"
        >
          <option value="fit_score">Sort by Fit Score</option>
          <option value="name">Sort by Name</option>
        </select>

        <Link
          href="/course-fit"
          onClick={() => setHasProfile(false)}
          className="ml-auto text-xs text-[#00FF85] hover:underline"
        >
          Edit Profile
        </Link>
      </div>

      {/* Course Grid */}
      {courses.length === 0 ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 text-[#333] animate-spin mx-auto mb-4" />
          <p className="text-[#666]">Calculating your matches...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses
            .sort((a, b) =>
              sortBy === "name"
                ? a.name.localeCompare(b.name)
                : b.fit_score - a.fit_score
            )
            .map((course) => (
              <FitCourseCard key={course.courseId} course={course} />
            ))}
        </div>
      )}
    </div>
  );
}

function FitCourseCard({ course }: { course: CourseFitResult }) {
  const scoreColor =
    course.fit_score >= 85
      ? "#00FF85"
      : course.fit_score >= 70
        ? "#FFD700"
        : course.fit_score >= 50
          ? "#FF8C00"
          : "#FF4444";

  return (
    <Link
      href={`/course/${course.courseId}`}
      className="block p-4 rounded-xl bg-[#111] border border-[#222] hover:border-[#00FF85]/30 transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {course.logoUrl ? (
            <img
              src={course.logoUrl}
              alt=""
              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-[#1a1a1a] flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-[#666]" />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white truncate group-hover:text-[#00FF85] transition-colors">
              {course.name}
            </h3>
            <p className="text-[11px] text-[#9CA3AF] truncate">
              {course.location}
            </p>
          </div>
        </div>

        {/* Fit Score Badge */}
        <div
          className="flex-shrink-0 w-14 h-14 rounded-full flex flex-col items-center justify-center border-2"
          style={{ borderColor: scoreColor }}
        >
          <span className="text-lg font-bold" style={{ color: scoreColor }}>
            {course.fit_score}
          </span>
          <span className="text-[8px] text-[#9CA3AF] -mt-0.5">% Match</span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[11px]">
        <span className="text-[#00FF85] font-medium">{course.greenFee}</span>
        <span className="text-[#333]">|</span>
        <span className="text-[#9CA3AF]">{course.style || "—"}</span>
        <span className="text-[#333]">|</span>
        <span className="text-[#9CA3AF]">{course.accessType || "—"}</span>
      </div>

      {/* Mini breakdown bar */}
      {course.breakdown && (
        <div className="flex gap-0.5 mt-3">
          {Object.entries(course.breakdown).map(([key, val]) => (
            <div
              key={key}
              className="flex-1 h-1 rounded-full"
              style={{
                backgroundColor:
                  val >= 80
                    ? "#00FF85"
                    : val >= 60
                      ? "#FFD700"
                      : val >= 40
                        ? "#FF8C00"
                        : "#FF4444",
                opacity: 0.7,
              }}
              title={`${key.replace(/_/g, " ")}: ${val}%`}
            />
          ))}
        </div>
      )}
    </Link>
  );
}

function ProfileWizard({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    handicap_range: "",
    preferred_style: [] as string[],
    preferred_terrain: "moderate",
    walking_preference: "no_preference",
    budget_range: "100_200",
    values_most: [] as string[],
    home_latitude: null as number | null,
    home_longitude: null as number | null,
  });

  const canProceed = () => {
    switch (step) {
      case 0:
        return !!formData.handicap_range;
      case 1:
        return formData.preferred_style.length > 0;
      case 2:
        return !!formData.walking_preference;
      case 3:
        return !!formData.budget_range;
      case 4:
        return formData.values_most.length >= 1 && formData.values_most.length <= 3;
      case 5:
        return true; // Location is optional
      default:
        return false;
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/golf-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        onComplete();
      }
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const toggleStyle = (style: string) => {
    setFormData((prev) => ({
      ...prev,
      preferred_style: prev.preferred_style.includes(style)
        ? prev.preferred_style.filter((s) => s !== style)
        : [...prev.preferred_style, style],
    }));
  };

  const toggleValue = (val: string) => {
    setFormData((prev) => {
      if (prev.values_most.includes(val)) {
        return { ...prev, values_most: prev.values_most.filter((v) => v !== val) };
      }
      if (prev.values_most.length >= 3) return prev;
      return { ...prev, values_most: [...prev.values_most, val] };
    });
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <Target className="w-10 h-10 text-[#00FF85] mx-auto mb-3" />
        <h1 className="text-xl font-bold text-white mb-1">
          Set Up Your Golf Profile
        </h1>
        <p className="text-sm text-[#9CA3AF]">
          Help us find your perfect courses
        </p>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center gap-2 mb-8">
        {WIZARD_STEPS.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  i < step
                    ? "bg-[#00FF85] text-black"
                    : i === step
                      ? "bg-[#00FF85]/20 text-[#00FF85] border border-[#00FF85]"
                      : "bg-[#1a1a1a] text-[#666]"
                }`}
              >
                {i < step ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Icon className="w-3.5 h-3.5" />
                )}
              </div>
              <span
                className={`text-[9px] ${i <= step ? "text-[#9CA3AF]" : "text-[#444]"}`}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="bg-[#111] border border-[#222] rounded-xl p-6 mb-6 min-h-[200px]">
        {step === 0 && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-1">
              What&apos;s your handicap range?
            </h2>
            <p className="text-xs text-[#9CA3AF] mb-4">
              This helps us match course difficulty
            </p>
            <div className="grid grid-cols-2 gap-2">
              {HANDICAP_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() =>
                    setFormData((p) => ({ ...p, handicap_range: opt.value }))
                  }
                  className={`p-3 rounded-lg border text-sm text-left transition-colors ${
                    formData.handicap_range === opt.value
                      ? "border-[#00FF85] bg-[#00FF85]/10 text-[#00FF85]"
                      : "border-[#333] text-[#9CA3AF] hover:border-[#00FF85]/30"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-1">
              Preferred course styles?
            </h2>
            <p className="text-xs text-[#9CA3AF] mb-4">
              Select all that appeal to you
            </p>
            <div className="flex flex-wrap gap-2">
              {STYLE_OPTIONS.map((style) => (
                <button
                  key={style}
                  onClick={() => toggleStyle(style)}
                  className={`px-4 py-2 rounded-full text-sm transition-colors ${
                    formData.preferred_style.includes(style)
                      ? "bg-[#00FF85] text-black font-medium"
                      : "bg-[#1a1a1a] text-[#9CA3AF] border border-[#333] hover:border-[#00FF85]/30"
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-1">
              Walking preference?
            </h2>
            <p className="text-xs text-[#9CA3AF] mb-4">
              How do you like to get around the course?
            </p>
            <div className="space-y-2">
              {WALKING_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() =>
                    setFormData((p) => ({ ...p, walking_preference: opt.value }))
                  }
                  className={`w-full p-3 rounded-lg border text-sm text-left transition-colors ${
                    formData.walking_preference === opt.value
                      ? "border-[#00FF85] bg-[#00FF85]/10 text-[#00FF85]"
                      : "border-[#333] text-[#9CA3AF] hover:border-[#00FF85]/30"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-medium text-white mb-2">
                Terrain preference
              </h3>
              <div className="flex gap-2">
                {TERRAIN_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() =>
                      setFormData((p) => ({
                        ...p,
                        preferred_terrain: opt.value,
                      }))
                    }
                    className={`flex-1 p-2 rounded-lg border text-xs text-center transition-colors ${
                      formData.preferred_terrain === opt.value
                        ? "border-[#00FF85] bg-[#00FF85]/10 text-[#00FF85]"
                        : "border-[#333] text-[#9CA3AF] hover:border-[#00FF85]/30"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-1">
              What&apos;s your green fee budget?
            </h2>
            <p className="text-xs text-[#9CA3AF] mb-4">
              Per round, per person
            </p>
            <div className="space-y-2">
              {BUDGET_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() =>
                    setFormData((p) => ({ ...p, budget_range: opt.value }))
                  }
                  className={`w-full p-3 rounded-lg border text-sm text-left transition-colors ${
                    formData.budget_range === opt.value
                      ? "border-[#00FF85] bg-[#00FF85]/10 text-[#00FF85]"
                      : "border-[#333] text-[#9CA3AF] hover:border-[#00FF85]/30"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-1">
              What do you value most?
            </h2>
            <p className="text-xs text-[#9CA3AF] mb-4">
              Pick your top 3 (
              {formData.values_most.length}/3 selected)
            </p>
            <div className="space-y-2">
              {VALUES_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => toggleValue(opt.value)}
                  className={`w-full p-3 rounded-lg border text-sm text-left transition-colors flex items-center justify-between ${
                    formData.values_most.includes(opt.value)
                      ? "border-[#00FF85] bg-[#00FF85]/10 text-[#00FF85]"
                      : formData.values_most.length >= 3
                        ? "border-[#222] text-[#555] cursor-not-allowed"
                        : "border-[#333] text-[#9CA3AF] hover:border-[#00FF85]/30"
                  }`}
                >
                  {opt.label}
                  {formData.values_most.includes(opt.value) && (
                    <Check className="w-4 h-4" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-1">
              Home location (optional)
            </h2>
            <p className="text-xs text-[#9CA3AF] mb-4">
              Used to calculate distance to courses. You can skip this step.
            </p>
            <button
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      setFormData((p) => ({
                        ...p,
                        home_latitude: pos.coords.latitude,
                        home_longitude: pos.coords.longitude,
                      }));
                    },
                    () => {}
                  );
                }
              }}
              className="w-full p-3 rounded-lg border border-[#333] text-sm text-[#9CA3AF] hover:border-[#00FF85]/30 transition-colors flex items-center justify-center gap-2"
            >
              <Navigation className="w-4 h-4" />
              Use My Current Location
            </button>
            {formData.home_latitude && (
              <p className="text-xs text-[#00FF85] mt-2 text-center">
                Location saved ({formData.home_latitude.toFixed(2)},{" "}
                {formData.home_longitude?.toFixed(2)})
              </p>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="flex items-center gap-1 px-4 py-2 text-sm text-[#9CA3AF] hover:text-white disabled:opacity-30 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        {step < 5 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canProceed()}
            className="flex items-center gap-1 px-6 py-2.5 rounded-xl bg-[#00FF85] text-black font-semibold text-sm hover:bg-[#00FF85]/90 disabled:opacity-40 transition-colors"
          >
            Continue
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#00FF85] text-black font-semibold text-sm hover:bg-[#00FF85]/90 disabled:opacity-60 transition-colors"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            Find My Courses
          </button>
        )}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6">
        <div className="h-7 w-48 bg-[#222] rounded animate-pulse mb-2" />
        <div className="h-4 w-64 bg-[#1a1a1a] rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-40 rounded-xl bg-[#111] border border-[#222] animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
