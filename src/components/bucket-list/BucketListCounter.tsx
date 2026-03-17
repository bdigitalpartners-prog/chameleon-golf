"use client";

import { useState, useEffect } from "react";
import { Heart, CheckCircle } from "lucide-react";

interface BucketListCounterProps {
  courseId: number;
}

export function BucketListCounter({ courseId }: BucketListCounterProps) {
  const [counts, setCounts] = useState<{ bucketList: number; played: number } | null>(null);

  useEffect(() => {
    async function fetchCounts() {
      try {
        const res = await fetch(`/api/bucket-list/course-counts?courseId=${courseId}`);
        if (res.ok) {
          const data = await res.json();
          setCounts(data);
        }
      } catch {}
    }
    fetchCounts();
  }, [courseId]);

  if (!counts || (counts.bucketList === 0 && counts.played === 0)) return null;

  return (
    <div className="flex items-center gap-4 text-sm">
      {counts.bucketList > 0 && (
        <div className="flex items-center gap-1.5" style={{ color: "var(--cg-text-muted)" }}>
          <Heart className="h-4 w-4" style={{ color: "var(--cg-accent)", fill: "var(--cg-accent)" }} />
          <span>
            <strong style={{ color: "var(--cg-text-secondary)" }}>{counts.bucketList}</strong> golfer{counts.bucketList !== 1 ? "s" : ""} bucket listed this
          </span>
        </div>
      )}
      {counts.played > 0 && (
        <div className="flex items-center gap-1.5" style={{ color: "var(--cg-text-muted)" }}>
          <CheckCircle className="h-4 w-4" style={{ color: "var(--cg-accent)" }} />
          <span>
            <strong style={{ color: "var(--cg-text-secondary)" }}>{counts.played}</strong> played it
          </span>
        </div>
      )}
    </div>
  );
}
