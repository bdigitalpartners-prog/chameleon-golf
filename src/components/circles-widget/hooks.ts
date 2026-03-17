"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";

/** Extract courseId and build a display name from the URL path (e.g. /course/123). */
export function useCurrentCourse(): { courseId: number | null; courseName: string | null } {
  const pathname = usePathname();

  return useMemo(() => {
    const match = pathname?.match(/^\/course\/(\d+)/);
    if (!match) return { courseId: null, courseName: null };
    return {
      courseId: parseInt(match[1], 10),
      courseName: null, // Will be fetched by the component if needed
    };
  }, [pathname]);
}

/** Format a date string into a short relative time label. */
export function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Generate a deterministic color from a string (used for avatar backgrounds). */
export function stringToColor(str: string): string {
  const colors = [
    "#22c55e", "#3b82f6", "#a855f7", "#f59e0b",
    "#ef4444", "#06b6d4", "#ec4899", "#14b8a6",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

/** Get initials from a name string. */
export function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
