"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  User,
  Tags,
  Users,
  CircleDot,
  Star,
  ChevronRight,
  ChevronLeft,
  Check,
  Search,
  Loader2,
  MapPin,
  UserPlus,
  X,
} from "lucide-react";

const STEPS = [
  { key: "profileComplete", label: "Profile", icon: User },
  { key: "tagsSelected", label: "Tags", icon: Tags },
  { key: "friendsAdded", label: "Connect", icon: Users },
  { key: "circleJoined", label: "Circle", icon: CircleDot },
  { key: "coursesRated", label: "Rate", icon: Star },
] as const;

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState<any>(null);

  // Step-specific state
  const [name, setName] = useState("");
  const [handicap, setHandicap] = useState("");
  const [homeClub, setHomeClub] = useState("");
  const [location, setLocation] = useState("");

  const [allTags, setAllTags] = useState<any[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagSearch, setTagSearch] = useState("");

  const [suggestions, setSuggestions] = useState<any>({ circles: [], courses: [], users: [] });
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  const [joinedCircles, setJoinedCircles] = useState<Set<string>>(new Set());

  const [courseSearch, setCourseSearch] = useState("");
  const [courseResults, setCourseResults] = useState<any[]>([]);
  const [ratings, setRatings] = useState<Record<number, number>>({});
  const [searchingCourses, setSearchingCourses] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }
    if (status === "authenticated") {
      fetchStatus();
      fetchSuggestions();
      fetchTags();
    }
  }, [status]);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/onboarding/status");
      const data = await res.json();
      setProgress(data.progress);
      if (data.isComplete) {
        router.push("/feed");
        return;
      }
      // Find first incomplete step
      const steps = STEPS.map((s) => s.key);
      const firstIncomplete = steps.findIndex((k) => !data.progress[k]);
      if (firstIncomplete >= 0) setCurrentStep(firstIncomplete);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestions = async () => {
    try {
      const res = await fetch("/api/onboarding/suggestions");
      const data = await res.json();
      setSuggestions(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTags = async () => {
    try {
      const res = await fetch("/api/tags");
      const data = await res.json();
      setAllTags(data.tags || []);
    } catch (e) {
      console.error(e);
    }
  };

  const markStep = async (step: string) => {
    try {
      const res = await fetch("/api/onboarding/step", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step }),
      });
      const data = await res.json();
      setProgress(data.progress);
      if (data.allComplete) {
        router.push("/feed");
        return;
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleNext = async () => {
    setSaving(true);
    const stepKey = STEPS[currentStep].key;

    try {
      // Step-specific save logic
      if (currentStep === 0) {
        // Save profile
        await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name || undefined,
            handicapIndex: handicap ? parseFloat(handicap) : undefined,
            homeClub: homeClub || undefined,
            location: location || undefined,
          }),
        });
      } else if (currentStep === 1 && selectedTags.length > 0) {
        // Save tags
        await fetch("/api/tags/user", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tagIds: selectedTags }),
        });
      }

      await markStep(stepKey);

      if (currentStep < STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        router.push("/feed");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      router.push("/feed");
    }
  };

  const searchCourses = useCallback(async (q: string) => {
    if (q.length < 2) { setCourseResults([]); return; }
    setSearchingCourses(true);
    try {
      const res = await fetch(`/api/courses/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setCourseResults(data.courses || []);
    } catch (e) {
      console.error(e);
    } finally {
      setSearchingCourses(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchCourses(courseSearch), 300);
    return () => clearTimeout(timer);
  }, [courseSearch, searchCourses]);

  const sendConnectionRequest = async (targetId: string) => {
    try {
      await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: targetId }),
      });
      setSentRequests((prev) => new Set(prev).add(targetId));
    } catch (e) {
      console.error(e);
    }
  };

  const joinCircle = async (circleId: string) => {
    try {
      await fetch(`/api/circles/${circleId}/join`, { method: "POST" });
      setJoinedCircles((prev) => new Set(prev).add(circleId));
    } catch (e) {
      console.error(e);
    }
  };

  const submitRating = async (courseId: number, score: number) => {
    setRatings((prev) => ({ ...prev, [courseId]: score }));
    try {
      await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, overallRating: score }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--cg-bg)" }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--cg-accent)" }} />
      </div>
    );
  }

  const filteredTags = allTags.filter(
    (t: any) => !tagSearch || t.name.toLowerCase().includes(tagSearch.toLowerCase())
  );

  const tagCategories = [...new Set(allTags.map((t: any) => t.category).filter(Boolean))];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--cg-bg)" }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-display font-bold" style={{ color: "var(--cg-text-primary)" }}>
            Welcome to golfEQUALIZER
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--cg-text-muted)" }}>
            Let&apos;s get you set up in a few quick steps
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const isComplete = progress?.[step.key];
            const isCurrent = i === currentStep;
            return (
              <button
                key={step.key}
                onClick={() => setCurrentStep(i)}
                className="flex flex-col items-center gap-1"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                  style={{
                    backgroundColor: isComplete
                      ? "var(--cg-accent)"
                      : isCurrent
                      ? "var(--cg-bg-card)"
                      : "transparent",
                    border: isCurrent ? "2px solid var(--cg-accent)" : "2px solid var(--cg-border)",
                  }}
                >
                  {isComplete ? (
                    <Check className="h-5 w-5 text-white" />
                  ) : (
                    <Icon
                      className="h-5 w-5"
                      style={{ color: isCurrent ? "var(--cg-accent)" : "var(--cg-text-muted)" }}
                    />
                  )}
                </div>
                <span
                  className="text-xs"
                  style={{ color: isCurrent ? "var(--cg-accent)" : "var(--cg-text-muted)" }}
                >
                  {step.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Step content */}
        <div
          className="rounded-xl p-6"
          style={{
            backgroundColor: "var(--cg-bg-card)",
            border: "1px solid var(--cg-border)",
          }}
        >
          {/* Step 1: Profile */}
          {currentStep === 0 && (
            <div>
              <h2 className="text-xl font-display font-semibold mb-1" style={{ color: "var(--cg-text-primary)" }}>
                Complete Your Profile
              </h2>
              <p className="text-sm mb-6" style={{ color: "var(--cg-text-muted)" }}>
                Help other golfers know who you are
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--cg-text-secondary)" }}>
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={session?.user?.name || "Your name"}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{
                      backgroundColor: "var(--cg-bg)",
                      border: "1px solid var(--cg-border)",
                      color: "var(--cg-text-primary)",
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--cg-text-secondary)" }}>
                    Handicap Index
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={handicap}
                    onChange={(e) => setHandicap(e.target.value)}
                    placeholder="e.g. 12.4"
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{
                      backgroundColor: "var(--cg-bg)",
                      border: "1px solid var(--cg-border)",
                      color: "var(--cg-text-primary)",
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--cg-text-secondary)" }}>
                    Home Club
                  </label>
                  <input
                    type="text"
                    value={homeClub}
                    onChange={(e) => setHomeClub(e.target.value)}
                    placeholder="e.g. Pebble Beach Golf Links"
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{
                      backgroundColor: "var(--cg-bg)",
                      border: "1px solid var(--cg-border)",
                      color: "var(--cg-text-primary)",
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--cg-text-secondary)" }}>
                    Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. San Francisco, CA"
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{
                      backgroundColor: "var(--cg-bg)",
                      border: "1px solid var(--cg-border)",
                      color: "var(--cg-text-primary)",
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Tags */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-xl font-display font-semibold mb-1" style={{ color: "var(--cg-text-primary)" }}>
                Select Your Golf Identity Tags
              </h2>
              <p className="text-sm mb-4" style={{ color: "var(--cg-text-muted)" }}>
                Pick 3–5 tags that describe your golf style ({selectedTags.length}/5 selected)
              </p>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--cg-text-muted)" }} />
                <input
                  type="text"
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  placeholder="Search tags..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none"
                  style={{
                    backgroundColor: "var(--cg-bg)",
                    border: "1px solid var(--cg-border)",
                    color: "var(--cg-text-primary)",
                  }}
                />
              </div>
              {tagCategories.map((cat) => {
                const catTags = filteredTags.filter((t: any) => t.category === cat);
                if (catTags.length === 0) return null;
                return (
                  <div key={cat} className="mb-4">
                    <h3 className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "var(--cg-text-muted)" }}>
                      {cat}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {catTags.map((tag: any) => {
                        const selected = selectedTags.includes(tag.id);
                        return (
                          <button
                            key={tag.id}
                            onClick={() => {
                              if (selected) {
                                setSelectedTags(selectedTags.filter((id) => id !== tag.id));
                              } else if (selectedTags.length < 5) {
                                setSelectedTags([...selectedTags, tag.id]);
                              }
                            }}
                            className="px-3 py-1.5 rounded-full text-sm transition-all"
                            style={{
                              backgroundColor: selected ? "var(--cg-accent)" : "var(--cg-bg)",
                              color: selected ? "white" : "var(--cg-text-secondary)",
                              border: `1px solid ${selected ? "var(--cg-accent)" : "var(--cg-border)"}`,
                            }}
                          >
                            {tag.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {filteredTags.filter((t: any) => !t.category).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {filteredTags
                    .filter((t: any) => !t.category)
                    .map((tag: any) => {
                      const selected = selectedTags.includes(tag.id);
                      return (
                        <button
                          key={tag.id}
                          onClick={() => {
                            if (selected) {
                              setSelectedTags(selectedTags.filter((id) => id !== tag.id));
                            } else if (selectedTags.length < 5) {
                              setSelectedTags([...selectedTags, tag.id]);
                            }
                          }}
                          className="px-3 py-1.5 rounded-full text-sm transition-all"
                          style={{
                            backgroundColor: selected ? "var(--cg-accent)" : "var(--cg-bg)",
                            color: selected ? "white" : "var(--cg-text-secondary)",
                            border: `1px solid ${selected ? "var(--cg-accent)" : "var(--cg-border)"}`,
                          }}
                        >
                          {tag.name}
                        </button>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Connect */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-xl font-display font-semibold mb-1" style={{ color: "var(--cg-text-primary)" }}>
                Find Your Golf Friends
              </h2>
              <p className="text-sm mb-6" style={{ color: "var(--cg-text-muted)" }}>
                Golf is better with friends. Connect with people you know.
              </p>
              {suggestions.users?.length > 0 ? (
                <div className="space-y-3">
                  {suggestions.users.map((u: any) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between p-3 rounded-lg"
                      style={{ backgroundColor: "var(--cg-bg)" }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium"
                          style={{
                            backgroundColor: "var(--cg-accent)",
                            color: "white",
                          }}
                        >
                          {u.image ? (
                            <img src={u.image} alt="" className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            (u.name || "?")[0].toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium" style={{ color: "var(--cg-text-primary)" }}>
                            {u.name}
                          </p>
                          {u.handicapIndex && (
                            <p className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
                              HCP {Number(u.handicapIndex).toFixed(1)}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => sendConnectionRequest(u.id)}
                        disabled={sentRequests.has(u.id)}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                        style={{
                          backgroundColor: sentRequests.has(u.id) ? "var(--cg-bg-card)" : "var(--cg-accent)",
                          color: sentRequests.has(u.id) ? "var(--cg-text-muted)" : "white",
                        }}
                      >
                        {sentRequests.has(u.id) ? "Sent" : "Connect"}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto mb-3" style={{ color: "var(--cg-text-muted)" }} />
                  <p className="text-sm" style={{ color: "var(--cg-text-muted)" }}>
                    No suggestions yet. You can search for friends later from your profile.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Circle */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-xl font-display font-semibold mb-1" style={{ color: "var(--cg-text-primary)" }}>
                Join a Circle
              </h2>
              <p className="text-sm mb-6" style={{ color: "var(--cg-text-muted)" }}>
                Circles are communities of golfers. Join one to start sharing and connecting.
              </p>
              {suggestions.circles?.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {suggestions.circles.map((c: any) => (
                    <div
                      key={c.id}
                      className="p-4 rounded-lg"
                      style={{
                        backgroundColor: "var(--cg-bg)",
                        border: joinedCircles.has(c.id) ? "2px solid var(--cg-accent)" : "1px solid var(--cg-border)",
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium" style={{ color: "var(--cg-text-primary)" }}>
                            {c.name}
                          </p>
                          <p className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
                            {c.type} · {c.memberCount} members
                          </p>
                        </div>
                      </div>
                      {c.description && (
                        <p className="text-xs mb-3 line-clamp-2" style={{ color: "var(--cg-text-secondary)" }}>
                          {c.description}
                        </p>
                      )}
                      <button
                        onClick={() => joinCircle(c.id)}
                        disabled={joinedCircles.has(c.id)}
                        className="w-full py-1.5 rounded-lg text-sm font-medium transition-all"
                        style={{
                          backgroundColor: joinedCircles.has(c.id) ? "var(--cg-bg-card)" : "var(--cg-accent)",
                          color: joinedCircles.has(c.id) ? "var(--cg-text-muted)" : "white",
                        }}
                      >
                        {joinedCircles.has(c.id) ? "Joined" : "Join Circle"}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CircleDot className="h-12 w-12 mx-auto mb-3" style={{ color: "var(--cg-text-muted)" }} />
                  <p className="text-sm" style={{ color: "var(--cg-text-muted)" }}>
                    No circles to show yet. You can create or discover circles later.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Rate courses */}
          {currentStep === 4 && (
            <div>
              <h2 className="text-xl font-display font-semibold mb-1" style={{ color: "var(--cg-text-primary)" }}>
                Rate Courses You&apos;ve Played
              </h2>
              <p className="text-sm mb-4" style={{ color: "var(--cg-text-muted)" }}>
                Rate a few courses to power your Chameleon Score and recommendations ({Object.keys(ratings).length} rated)
              </p>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--cg-text-muted)" }} />
                <input
                  type="text"
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                  placeholder="Search courses..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none"
                  style={{
                    backgroundColor: "var(--cg-bg)",
                    border: "1px solid var(--cg-border)",
                    color: "var(--cg-text-primary)",
                  }}
                />
                {searchingCourses && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" style={{ color: "var(--cg-text-muted)" }} />
                )}
              </div>

              {courseResults.length > 0 && (
                <div className="space-y-2 mb-4">
                  {courseResults.map((course: any) => (
                    <div
                      key={course.courseId}
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: "var(--cg-bg)" }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium" style={{ color: "var(--cg-text-primary)" }}>
                            {course.courseName}
                          </p>
                          <p className="text-xs flex items-center gap-1" style={{ color: "var(--cg-text-muted)" }}>
                            <MapPin className="h-3 w-3" />
                            {[course.city, course.state].filter(Boolean).join(", ")}
                          </p>
                        </div>
                        {ratings[course.courseId] && (
                          <span className="text-sm font-bold" style={{ color: "var(--cg-accent)" }}>
                            {ratings[course.courseId]}/10
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {Array.from({ length: 10 }, (_, i) => i + 1).map((score) => (
                          <button
                            key={score}
                            onClick={() => submitRating(course.courseId, score)}
                            className="flex-1 py-1 rounded text-xs font-medium transition-all"
                            style={{
                              backgroundColor:
                                ratings[course.courseId] >= score ? "var(--cg-accent)" : "var(--cg-bg-card)",
                              color: ratings[course.courseId] >= score ? "white" : "var(--cg-text-muted)",
                            }}
                          >
                            {score}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Trending courses to rate */}
              {courseResults.length === 0 && suggestions.courses?.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-3" style={{ color: "var(--cg-text-secondary)" }}>
                    Popular courses to rate
                  </h3>
                  <div className="space-y-2">
                    {suggestions.courses.slice(0, 5).map((course: any) => (
                      <div
                        key={course.courseId}
                        className="p-3 rounded-lg"
                        style={{ backgroundColor: "var(--cg-bg)" }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="text-sm font-medium" style={{ color: "var(--cg-text-primary)" }}>
                              {course.courseName}
                            </p>
                            <p className="text-xs flex items-center gap-1" style={{ color: "var(--cg-text-muted)" }}>
                              <MapPin className="h-3 w-3" />
                              {[course.city, course.state].filter(Boolean).join(", ")}
                            </p>
                          </div>
                          {ratings[course.courseId] && (
                            <span className="text-sm font-bold" style={{ color: "var(--cg-accent)" }}>
                              {ratings[course.courseId]}/10
                            </span>
                          )}
                        </div>
                        <div className="flex gap-1">
                          {Array.from({ length: 10 }, (_, i) => i + 1).map((score) => (
                            <button
                              key={score}
                              onClick={() => submitRating(course.courseId, score)}
                              className="flex-1 py-1 rounded text-xs font-medium transition-all"
                              style={{
                                backgroundColor:
                                  ratings[course.courseId] >= score ? "var(--cg-accent)" : "var(--cg-bg-card)",
                                color: ratings[course.courseId] >= score ? "white" : "var(--cg-text-muted)",
                              }}
                            >
                              {score}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => currentStep > 0 && setCurrentStep(currentStep - 1)}
            className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              visibility: currentStep > 0 ? "visible" : "hidden",
              color: "var(--cg-text-secondary)",
              backgroundColor: "var(--cg-bg-card)",
              border: "1px solid var(--cg-border)",
            }}
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSkip}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ color: "var(--cg-text-muted)" }}
            >
              Skip
            </button>
            <button
              onClick={handleNext}
              disabled={saving}
              className="flex items-center gap-1 px-6 py-2 rounded-lg text-sm font-medium text-white transition-all"
              style={{ backgroundColor: "var(--cg-accent)" }}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : currentStep === STEPS.length - 1 ? (
                "Finish"
              ) : (
                <>
                  Next <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
