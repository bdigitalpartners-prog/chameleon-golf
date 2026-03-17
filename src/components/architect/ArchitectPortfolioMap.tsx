"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import CourseMap from "@/components/map";
import type { CourseMapItem } from "@/components/map";

interface ArchitectCourse {
  courseId: number;
  courseName: string;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  accessType?: string | null;
}

export function ArchitectPortfolioMap({ courses }: { courses: ArchitectCourse[] }) {
  const router = useRouter();

  const mapCourses = useMemo<CourseMapItem[]>(() => {
    return courses
      .filter((c) => c.latitude && c.longitude)
      .map((c) => ({
        courseId: c.courseId,
        courseName: c.courseName,
        city: c.city || null,
        state: c.state || null,
        latitude: typeof c.latitude === "string" ? parseFloat(c.latitude) : Number(c.latitude),
        longitude: typeof c.longitude === "string" ? parseFloat(c.longitude) : Number(c.longitude),
        accessType: c.accessType || null,
      }));
  }, [courses]);

  if (mapCourses.length === 0) return null;

  return (
    <section
      className="mb-6"
      style={{
        backgroundColor: "var(--cg-bg-card)",
        border: "1px solid var(--cg-border)",
        borderRadius: "0.75rem",
        overflow: "hidden",
      }}
    >
      <div className="px-6 pt-5 pb-3 flex items-center justify-between">
        <h2
          className="text-lg font-semibold"
          style={{ color: "var(--cg-text-primary)" }}
        >
          Course Portfolio Map
        </h2>
        <span
          className="text-sm"
          style={{ color: "var(--cg-text-muted)" }}
        >
          {mapCourses.length} {mapCourses.length === 1 ? "course" : "courses"} mapped
        </span>
      </div>
      <CourseMap
        courses={mapCourses}
        height="400px"
        clusterMarkers={mapCourses.length > 20}
        colorBy="accessType"
        onCourseSelect={(course) => router.push(`/course/${course.courseId}`)}
      />
    </section>
  );
}
