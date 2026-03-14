"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Trophy, Loader2 } from "lucide-react";
import Link from "next/link";

export default function JournalPage() {
  const { data: session, status } = useSession();

  const { data: scores, isLoading } = useQuery({
    queryKey: ["my-scores"],
    queryFn: async () => {
      const res = await fetch("/api/scores");
      if (!res.ok) throw new Error("Failed to fetch scores");
      return res.json();
    },
    enabled: !!session,
  });

  if (status === "loading") return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-brand-600" /></div>;

  if (!session) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <Trophy className="mx-auto h-16 w-16 text-stone-300" />
        <h1 className="mt-4 font-display text-2xl font-bold text-stone-900">Score Journal</h1>
        <p className="mt-2 text-stone-500">Sign in to track your rounds and build your golf resume.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-stone-900">Score Journal</h1>
          <p className="mt-1 text-stone-500">Track your rounds across the world&apos;s best courses.</p>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-brand-600" /></div>
      )}

      {scores && scores.length === 0 && (
        <div className="rounded-xl border border-stone-200 bg-white p-12 text-center">
          <CalendarDays className="mx-auto h-12 w-12 text-stone-300" />
          <h2 className="mt-4 font-display text-xl font-semibold text-stone-900">No scores yet</h2>
          <p className="mt-2 text-stone-500">Visit a course page to post your first score.</p>
        </div>
      )}

      {scores && scores.length > 0 && (
        <div className="space-y-3">
          {scores.map((s: any) => (
            <Link
              key={s.scoreId}
              href={`/course/${s.courseId}`}
              className="flex items-center justify-between rounded-xl border border-stone-200 bg-white p-5 hover:border-stone-300 transition-colors"
            >
              <div>
                <div className="font-semibold text-stone-900">{s.course.courseName}</div>
                <div className="text-sm text-stone-500">
                  {s.course.city}, {s.course.state} &middot; {new Date(s.datePlayed).toLocaleDateString()}
                </div>
                {s.teeBoxPlayed && <div className="text-xs text-stone-400 mt-0.5">{s.teeBoxPlayed} tees</div>}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-stone-900">{s.grossScore}</div>
                {s.netScore && <div className="text-sm text-stone-500">Net {s.netScore}</div>}
                <div className={`mt-1 text-xs font-medium ${s.ghinVerified ? "text-brand-600" : "text-amber-500"}`}>
                  {s.ghinVerified ? "Verified" : "Pending"}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
