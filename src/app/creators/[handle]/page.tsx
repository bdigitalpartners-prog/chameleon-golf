"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Video, MapPin, Layers, ChevronRight } from "lucide-react";
import { CreatorContentCard } from "@/components/creators/CreatorContentCard";
import { CreatorAvatar } from "@/components/creators/CreatorAvatar";
import { PlatformBadge } from "@/components/creators/PlatformBadge";

export default function CreatorProfilePage() {
  const params = useParams();
  const handle = params.handle as string;
  const [creator, setCreator] = useState<any>(null);
  const [content, setContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/creators/${encodeURIComponent(handle)}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => {
        setCreator(data.creator);
        setContent(data.content || []);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [handle]);

  if (loading) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: "#0A0A0A" }}>
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="h-8 w-48 rounded animate-pulse" style={{ backgroundColor: "var(--cg-bg-card)" }} />
          <div className="h-32 rounded-xl animate-pulse" style={{ backgroundColor: "var(--cg-bg-card)" }} />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl animate-pulse" style={{ backgroundColor: "var(--cg-bg-card)" }} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !creator) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#0A0A0A" }}>
        <div className="text-center">
          <Video className="w-16 h-16 mx-auto mb-4" style={{ color: "var(--cg-text-muted)" }} />
          <h2 className="text-xl font-bold mb-2" style={{ color: "var(--cg-text-primary)" }}>Creator Not Found</h2>
          <p className="text-sm mb-4" style={{ color: "var(--cg-text-muted)" }}>No content found for this creator.</p>
          <Link href="/creators" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: "#00FF85", color: "#000" }}>
            <ArrowLeft className="w-4 h-4" /> Back to Creator Hub
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0A0A0A" }}>
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Back link */}
        <Link href="/creators" className="inline-flex items-center gap-1 text-sm hover:underline" style={{ color: "#00FF85" }}>
          <ArrowLeft className="w-4 h-4" /> Creator Hub
        </Link>

        {/* Creator Profile Header */}
        <section
          className="rounded-xl p-6"
          style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
        >
          <div className="flex items-start gap-5">
            <CreatorAvatar name={creator.name} handle={creator.handle} size="lg" />
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--cg-text-primary)" }}>
                {creator.name}
              </h1>
              <div className="flex gap-1.5 mb-4">
                {creator.platforms.map((p: string) => (
                  <PlatformBadge key={p} platform={p} size="md" />
                ))}
              </div>

              {/* Stats row */}
              <div className="flex flex-wrap gap-6">
                <div>
                  <div className="text-2xl font-bold" style={{ color: "#00FF85" }}>{creator.totalContent}</div>
                  <div className="text-xs" style={{ color: "var(--cg-text-muted)" }}>Content Pieces</div>
                </div>
                <div>
                  <div className="text-2xl font-bold" style={{ color: "#00FF85" }}>{creator.coursesCovered}</div>
                  <div className="text-xs" style={{ color: "var(--cg-text-muted)" }}>Courses Covered</div>
                </div>
                <div>
                  <div className="text-2xl font-bold" style={{ color: "#00FF85" }}>{creator.platforms.length}</div>
                  <div className="text-xs" style={{ color: "var(--cg-text-muted)" }}>Platforms</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Most Covered Courses */}
        {creator.topCourses && creator.topCourses.length > 0 && (
          <section>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: "var(--cg-text-primary)" }}>
              <MapPin className="w-5 h-5" style={{ color: "#00FF85" }} />
              Most Covered Courses
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {creator.topCourses.map((course: any) => (
                <Link
                  key={course.course_id}
                  href={`/course/${course.course_id}`}
                  className="group rounded-lg p-3 transition-all"
                  style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(0,255,133,0.3)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--cg-border)"; }}
                >
                  <div className="text-sm font-medium truncate mb-1" style={{ color: "var(--cg-text-primary)" }}>
                    {course.course_name}
                  </div>
                  <div className="text-xs truncate" style={{ color: "var(--cg-text-muted)" }}>
                    {[course.city, course.state].filter(Boolean).join(", ")}
                  </div>
                  <div className="mt-2 text-xs font-semibold" style={{ color: "#00FF85" }}>
                    {course.count} {course.count === 1 ? "piece" : "pieces"}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* All Content */}
        <section>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: "var(--cg-text-primary)" }}>
            <Layers className="w-5 h-5" style={{ color: "#00FF85" }} />
            All Content ({content.length})
          </h2>
          <div className="space-y-3">
            {content.map((item: any, i: number) => (
              <CreatorContentCard key={item.id || i} item={item} showCourse={true} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
