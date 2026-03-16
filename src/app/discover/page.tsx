"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Compass,
  Star,
  Users,
  CircleDot,
  TrendingUp,
  Gem,
  MapPin,
  Heart,
  UserPlus,
  RefreshCw,
  X,
  Loader2,
  MessageCircle,
  ThumbsUp,
  ChevronRight,
} from "lucide-react";

export default function DiscoverPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dismissedCourses, setDismissedCourses] = useState<Set<string>>(new Set());
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  const [joinedCircles, setJoinedCircles] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }
    if (status === "authenticated") {
      fetchData();
    }
  }, [status]);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/discover");
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const refreshRecommendations = async () => {
    setRefreshing(true);
    try {
      await fetch("/api/recommendations/refresh", { method: "POST" });
      // Wait a bit then reload
      setTimeout(async () => {
        await fetchData();
        setRefreshing(false);
      }, 2000);
    } catch (e) {
      console.error(e);
      setRefreshing(false);
    }
  };

  const dismissCourse = async (id: string) => {
    setDismissedCourses((prev) => new Set(prev).add(id));
    try {
      await fetch(`/api/recommendations/courses/${id}/dismiss`, { method: "POST" });
    } catch (e) {
      console.error(e);
    }
  };

  const sendConnection = async (userId: string) => {
    try {
      await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: userId }),
      });
      setSentRequests((prev) => new Set(prev).add(userId));
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

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--cg-bg)" }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--cg-accent)" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--cg-bg)" }}>
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2" style={{ color: "var(--cg-text-primary)" }}>
              <Compass className="h-6 w-6" style={{ color: "var(--cg-accent)" }} />
              Discover
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--cg-text-muted)" }}>
              Personalized recommendations based on your circles and ratings
            </p>
          </div>
          <button
            onClick={refreshRecommendations}
            disabled={refreshing}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              backgroundColor: "var(--cg-bg-card)",
              color: "var(--cg-text-secondary)",
              border: "1px solid var(--cg-border)",
            }}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* For You - Course Recommendations */}
        {data?.courseRecommendations?.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-display font-semibold flex items-center gap-2" style={{ color: "var(--cg-text-primary)" }}>
                <Star className="h-5 w-5" style={{ color: "var(--cg-accent)" }} />
                For You
              </h2>
              <Link
                href="/recommendations"
                className="text-sm flex items-center gap-1"
                style={{ color: "var(--cg-accent)" }}
              >
                See all <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.courseRecommendations
                .filter((r: any) => !dismissedCourses.has(r.id))
                .map((rec: any) => (
                  <div
                    key={rec.id}
                    className="rounded-xl overflow-hidden"
                    style={{
                      backgroundColor: "var(--cg-bg-card)",
                      border: "1px solid var(--cg-border)",
                    }}
                  >
                    {rec.course.logoUrl && (
                      <div className="h-32 bg-cover bg-center" style={{ backgroundImage: `url(${rec.course.logoUrl})` }} />
                    )}
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold truncate" style={{ color: "var(--cg-text-primary)" }}>
                            {rec.course.courseName}
                          </h3>
                          <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: "var(--cg-text-muted)" }}>
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            {[rec.course.city, rec.course.state].filter(Boolean).join(", ")}
                          </p>
                        </div>
                        <button onClick={() => dismissCourse(rec.id)} className="ml-2 p-1 rounded" style={{ color: "var(--cg-text-muted)" }}>
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-xs mt-2 line-clamp-2" style={{ color: "var(--cg-accent)" }}>
                        {rec.reason}
                      </p>
                      {rec.sourceCircle && (
                        <p className="text-xs mt-1" style={{ color: "var(--cg-text-muted)" }}>
                          via {rec.sourceCircle.name}
                        </p>
                      )}
                      <div className="flex gap-2 mt-3">
                        <Link
                          href={`/courses/${rec.course.courseId}`}
                          className="flex-1 text-center py-1.5 rounded-lg text-xs font-medium"
                          style={{
                            backgroundColor: "var(--cg-accent)",
                            color: "white",
                          }}
                        >
                          View Course
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* Suggested Circles */}
        {data?.suggestedCircles?.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-display font-semibold flex items-center gap-2 mb-4" style={{ color: "var(--cg-text-primary)" }}>
              <CircleDot className="h-5 w-5" style={{ color: "var(--cg-accent)" }} />
              Suggested Circles
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.suggestedCircles.map((circle: any) => (
                <div
                  key={circle.id}
                  className="rounded-xl p-4"
                  style={{
                    backgroundColor: "var(--cg-bg-card)",
                    border: "1px solid var(--cg-border)",
                  }}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ backgroundColor: "var(--cg-accent)", color: "white" }}
                    >
                      {circle.avatarUrl ? (
                        <img src={circle.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        circle.name[0]
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold truncate" style={{ color: "var(--cg-text-primary)" }}>
                        {circle.name}
                      </h3>
                      <p className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
                        {circle.type} · {circle.memberCount} members
                      </p>
                    </div>
                  </div>
                  <p className="text-xs mb-3" style={{ color: "var(--cg-accent)" }}>
                    {circle.matchReason}
                  </p>
                  <button
                    onClick={() => joinCircle(circle.id)}
                    disabled={joinedCircles.has(circle.id)}
                    className="w-full py-1.5 rounded-lg text-sm font-medium transition-all"
                    style={{
                      backgroundColor: joinedCircles.has(circle.id) ? "var(--cg-bg)" : "var(--cg-accent)",
                      color: joinedCircles.has(circle.id) ? "var(--cg-text-muted)" : "white",
                      border: joinedCircles.has(circle.id) ? "1px solid var(--cg-border)" : "none",
                    }}
                  >
                    {joinedCircles.has(circle.id) ? "Joined" : "Join Circle"}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* People You May Know */}
        {data?.peopleYouMayKnow?.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-display font-semibold flex items-center gap-2 mb-4" style={{ color: "var(--cg-text-primary)" }}>
              <Users className="h-5 w-5" style={{ color: "var(--cg-accent)" }} />
              People You May Know
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {data.peopleYouMayKnow.map((person: any) => (
                <div
                  key={person.id}
                  className="rounded-xl p-4 text-center"
                  style={{
                    backgroundColor: "var(--cg-bg-card)",
                    border: "1px solid var(--cg-border)",
                  }}
                >
                  <div
                    className="w-14 h-14 rounded-full mx-auto mb-2 flex items-center justify-center text-lg font-bold"
                    style={{ backgroundColor: "var(--cg-accent)", color: "white" }}
                  >
                    {person.image ? (
                      <img src={person.image} alt="" className="w-14 h-14 rounded-full object-cover" />
                    ) : (
                      (person.name || "?")[0].toUpperCase()
                    )}
                  </div>
                  <p className="text-sm font-medium truncate" style={{ color: "var(--cg-text-primary)" }}>
                    {person.name}
                  </p>
                  {person.handicapIndex && (
                    <p className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
                      HCP {Number(person.handicapIndex).toFixed(1)}
                    </p>
                  )}
                  {person.mutualFriends > 0 && (
                    <p className="text-xs mt-1" style={{ color: "var(--cg-text-muted)" }}>
                      {person.mutualFriends} mutual friend{person.mutualFriends > 1 ? "s" : ""}
                    </p>
                  )}
                  {person.sharedCircles?.length > 0 && (
                    <p className="text-xs mt-0.5 truncate" style={{ color: "var(--cg-accent)" }}>
                      {person.sharedCircles.slice(0, 2).join(", ")}
                    </p>
                  )}
                  <button
                    onClick={() => sendConnection(person.id)}
                    disabled={sentRequests.has(person.id)}
                    className="w-full mt-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-all"
                    style={{
                      backgroundColor: sentRequests.has(person.id) ? "var(--cg-bg)" : "var(--cg-accent)",
                      color: sentRequests.has(person.id) ? "var(--cg-text-muted)" : "white",
                      border: sentRequests.has(person.id) ? "1px solid var(--cg-border)" : "none",
                    }}
                  >
                    {sentRequests.has(person.id) ? "Sent" : <><UserPlus className="h-3 w-3" /> Connect</>}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Trending in Your Circles */}
        {data?.trending?.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-display font-semibold flex items-center gap-2 mb-4" style={{ color: "var(--cg-text-primary)" }}>
              <TrendingUp className="h-5 w-5" style={{ color: "var(--cg-accent)" }} />
              Trending in Your Circles
            </h2>
            <div className="space-y-3">
              {data.trending.map((post: any) => (
                <div
                  key={post.id}
                  className="rounded-xl p-4"
                  style={{
                    backgroundColor: "var(--cg-bg-card)",
                    border: "1px solid var(--cg-border)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ backgroundColor: "var(--cg-accent)", color: "white" }}
                    >
                      {post.author?.image ? (
                        <img src={post.author.image} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        (post.author?.name || "?")[0].toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--cg-text-primary)" }}>
                        {post.author?.name}
                      </p>
                      <p className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
                        in {post.circle?.name}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm line-clamp-2 mb-2" style={{ color: "var(--cg-text-secondary)" }}>
                    {post.content}
                  </p>
                  <div className="flex items-center gap-4 text-xs" style={{ color: "var(--cg-text-muted)" }}>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" /> {post._count?.fistBumps || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" /> {post._count?.comments || 0}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Hidden Gems */}
        {data?.hiddenGems?.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-display font-semibold flex items-center gap-2 mb-4" style={{ color: "var(--cg-text-primary)" }}>
              <Gem className="h-5 w-5" style={{ color: "var(--cg-accent)" }} />
              Hidden Gems
            </h2>
            <p className="text-sm mb-4" style={{ color: "var(--cg-text-muted)" }}>
              Courses rated highly by your circles but not on national lists
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.hiddenGems.map((course: any) => (
                <div
                  key={course.courseId}
                  className="rounded-xl overflow-hidden"
                  style={{
                    backgroundColor: "var(--cg-bg-card)",
                    border: "1px solid var(--cg-border)",
                  }}
                >
                  <div className="p-4">
                    <h3 className="text-sm font-semibold" style={{ color: "var(--cg-text-primary)" }}>
                      {course.courseName}
                    </h3>
                    <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: "var(--cg-text-muted)" }}>
                      <MapPin className="h-3 w-3" />
                      {[course.city, course.state].filter(Boolean).join(", ")}
                    </p>
                    {course.courseStyle && (
                      <span
                        className="inline-block mt-2 px-2 py-0.5 rounded-full text-xs"
                        style={{
                          backgroundColor: "var(--cg-bg)",
                          color: "var(--cg-text-secondary)",
                        }}
                      >
                        {course.courseStyle}
                      </span>
                    )}
                    <div className="flex items-center gap-1 mt-2">
                      <Star className="h-4 w-4" style={{ color: "var(--cg-accent)" }} />
                      <span className="text-sm font-bold" style={{ color: "var(--cg-accent)" }}>
                        {Number(course.circleAvgScore).toFixed(1)}
                      </span>
                      <span className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
                        from {course.circleRatingCount} circle ratings
                      </span>
                    </div>
                    <Link
                      href={`/courses/${course.courseId}`}
                      className="block w-full text-center mt-3 py-1.5 rounded-lg text-xs font-medium"
                      style={{
                        backgroundColor: "var(--cg-accent)",
                        color: "white",
                      }}
                    >
                      Explore Course
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty state when no data */}
        {!data?.courseRecommendations?.length &&
          !data?.suggestedCircles?.length &&
          !data?.peopleYouMayKnow?.length && (
            <div
              className="rounded-xl p-12 text-center"
              style={{
                backgroundColor: "var(--cg-bg-card)",
                border: "1px solid var(--cg-border)",
              }}
            >
              <Compass className="h-16 w-16 mx-auto mb-4" style={{ color: "var(--cg-text-muted)", opacity: 0.5 }} />
              <h2 className="text-lg font-display font-semibold mb-2" style={{ color: "var(--cg-text-primary)" }}>
                Your Discovery Feed is Building
              </h2>
              <p className="text-sm max-w-md mx-auto mb-6" style={{ color: "var(--cg-text-muted)" }}>
                Rate some courses, join circles, and connect with friends to unlock personalized recommendations.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link
                  href="/circles"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                  style={{ backgroundColor: "var(--cg-accent)" }}
                >
                  Explore Circles
                </Link>
                <Link
                  href="/onboarding"
                  className="px-4 py-2 rounded-lg text-sm font-medium"
                  style={{
                    color: "var(--cg-text-secondary)",
                    backgroundColor: "var(--cg-bg)",
                    border: "1px solid var(--cg-border)",
                  }}
                >
                  Complete Onboarding
                </Link>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
