"use client";

export const dynamic = "force-dynamic";

import { CourseRanker } from "@/components/scoring/CourseRanker";

export default function ChameleonRankingsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <CourseRanker />
    </div>
  );
}
