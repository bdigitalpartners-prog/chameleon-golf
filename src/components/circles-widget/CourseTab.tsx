"use client";

import { useEffect, useState } from "react";
import { MapPin, Loader2, MessageSquare, Star, CheckCircle2 } from "lucide-react";
import { useCurrentCourse, formatRelativeTime, stringToColor, getInitials } from "./hooks";

interface CourseActivity {
  id: string;
  type: "post" | "rating" | "checkin";
  userName: string;
  userImage: string | null;
  content: string;
  createdAt: string;
}

export function CourseTab() {
  const { courseId } = useCurrentCourse();
  const [courseName, setCourseName] = useState<string | null>(null);
  const [activities, setActivities] = useState<CourseActivity[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!courseId) return;
    setLoading(true);

    async function load() {
      try {
        // Fetch course name
        const courseRes = await fetch(`/api/courses/${courseId}`);
        if (courseRes.ok) {
          const data = await courseRes.json();
          setCourseName(data.name || data.courseName || `Course #${courseId}`);
        }

        // Fetch recent activity for this course from feed
        const feedRes = await fetch(`/api/feed?courseId=${courseId}&limit=20`);
        if (feedRes.ok) {
          const data = await feedRes.json();
          const items = (data.posts || data.items || []).slice(0, 20).map((item: any) => ({
            id: item.id,
            type: item.type || "post",
            userName: item.author?.name || item.userName || "Member",
            userImage: item.author?.image || item.userImage || null,
            content: item.content || item.text || item.title || "",
            createdAt: item.createdAt,
          }));
          setActivities(items);
        }
      } catch (err) {
        console.error("Failed to load course activity:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [courseId]);

  if (!courseId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 px-6 text-center">
        <MapPin style={{ width: 40, height: 40, color: "var(--cg-text-muted)" }} />
        <span className="text-sm font-medium" style={{ color: "var(--cg-text-secondary)" }}>
          Visit a course page to see activity here
        </span>
        <span className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
          Circle members&apos; posts, ratings, and check-ins for any course will appear in this tab.
        </span>
      </div>
    );
  }

  const typeIcon = (type: string) => {
    switch (type) {
      case "rating": return <Star style={{ width: 14, height: 14, color: "#f59e0b" }} />;
      case "checkin": return <CheckCircle2 style={{ width: 14, height: 14, color: "var(--cg-accent)" }} />;
      default: return <MessageSquare style={{ width: 14, height: 14, color: "var(--cg-text-muted)" }} />;
    }
  };

  return (
    <div className="flex flex-col">
      {/* Course header */}
      <div
        className="px-4 py-3 flex items-center gap-2"
        style={{ borderBottom: "1px solid var(--cg-border-subtle)" }}
      >
        <MapPin style={{ width: 16, height: 16, color: "var(--cg-accent)" }} />
        <span className="text-sm font-semibold truncate" style={{ color: "var(--cg-text-primary)" }}>
          {courseName || `Course #${courseId}`}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin" style={{ width: 24, height: 24, color: "var(--cg-accent)" }} />
        </div>
      ) : activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2 text-center px-6">
          <MessageSquare style={{ width: 32, height: 32, color: "var(--cg-text-muted)" }} />
          <span className="text-sm" style={{ color: "var(--cg-text-muted)" }}>
            No circle activity for this course yet
          </span>
        </div>
      ) : (
        <div>
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 px-4 py-3"
              style={{ borderBottom: "1px solid var(--cg-border-subtle)" }}
            >
              {activity.userImage ? (
                <img
                  src={activity.userImage}
                  alt=""
                  className="rounded-full shrink-0"
                  style={{ width: 32, height: 32, objectFit: "cover" }}
                />
              ) : (
                <div
                  className="rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
                  style={{ width: 32, height: 32, backgroundColor: stringToColor(activity.userName) }}
                >
                  {getInitials(activity.userName)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium" style={{ color: "var(--cg-text-primary)" }}>
                    {activity.userName}
                  </span>
                  {typeIcon(activity.type)}
                  <span className="text-[10px]" style={{ color: "var(--cg-text-muted)" }}>
                    {formatRelativeTime(activity.createdAt)}
                  </span>
                </div>
                <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "var(--cg-text-secondary)" }}>
                  {activity.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
