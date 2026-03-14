"use client";

import { useQuery } from "@tanstack/react-query";
import type { CourseFilters, CourseCard } from "@/types";

interface CoursesResponse {
  items: CourseCard[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function useCourses(filters: CourseFilters) {
  const params = new URLSearchParams();
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.country) params.set("country", filters.country);
  if (filters.state) params.set("state", filters.state);
  if (filters.courseStyle) params.set("courseStyle", filters.courseStyle);
  if (filters.accessType) params.set("accessType", filters.accessType);
  if (filters.feeMin) params.set("feeMin", String(filters.feeMin));
  if (filters.feeMax) params.set("feeMax", String(filters.feeMax));
  if (filters.sortBy) params.set("sortBy", filters.sortBy);
  if (filters.sortDir) params.set("sortDir", filters.sortDir);

  return useQuery<CoursesResponse>({
    queryKey: ["courses", filters],
    queryFn: async () => {
      const res = await fetch(`/api/courses?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch courses");
      return res.json();
    },
  });
}
