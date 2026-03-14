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
  // New filter params
  if (filters.listId) params.set("listId", String(filters.listId));
  if (filters.walkingPolicy) params.set("walkingPolicy", filters.walkingPolicy);
  if (filters.yearMin) params.set("yearMin", String(filters.yearMin));
  if (filters.yearMax) params.set("yearMax", String(filters.yearMax));
  if (filters.architect) params.set("architect", filters.architect);
  // Weight params
  if (filters.w_expert !== undefined) params.set("w_expert", String(filters.w_expert));
  if (filters.w_conditioning !== undefined) params.set("w_conditioning", String(filters.w_conditioning));
  if (filters.w_layout !== undefined) params.set("w_layout", String(filters.w_layout));
  if (filters.w_aesthetics !== undefined) params.set("w_aesthetics", String(filters.w_aesthetics));
  if (filters.w_challenge !== undefined) params.set("w_challenge", String(filters.w_challenge));
  if (filters.w_value !== undefined) params.set("w_value", String(filters.w_value));
  if (filters.w_walkability !== undefined) params.set("w_walkability", String(filters.w_walkability));
  if (filters.w_pace !== undefined) params.set("w_pace", String(filters.w_pace));
  if (filters.w_amenities !== undefined) params.set("w_amenities", String(filters.w_amenities));
  if (filters.w_service !== undefined) params.set("w_service", String(filters.w_service));

  return useQuery<CoursesResponse>({
    queryKey: ["courses", filters],
    queryFn: async () => {
      const res = await fetch(`/api/courses?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch courses");
      return res.json();
    },
  });
}
