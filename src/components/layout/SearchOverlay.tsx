"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface SearchResult {
  courseId: number;
  courseName: string;
  city: string | null;
  state: string | null;
  country: string;
}

export function SearchOverlay({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/courses/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results ?? []);
      } catch { setResults([]); }
      setLoading(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="mx-auto mt-20 max-w-xl rounded-xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-stone-200 px-4 py-3">
          <Search className="h-5 w-5 text-stone-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search courses, cities, states..."
            className="flex-1 text-lg outline-none placeholder:text-stone-400"
          />
          <button onClick={onClose}><X className="h-5 w-5 text-stone-400" /></button>
        </div>
        {results.length > 0 && (
          <ul className="max-h-80 overflow-y-auto py-2">
            {results.map((r) => (
              <li key={r.courseId}>
                <button
                  onClick={() => { router.push(`/course/${r.courseId}`); onClose(); }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-stone-50 transition-colors"
                >
                  <div>
                    <div className="font-medium text-stone-900">{r.courseName}</div>
                    <div className="text-sm text-stone-500">{[r.city, r.state, r.country].filter(Boolean).join(", ")}</div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
        {query.length >= 2 && results.length === 0 && !loading && (
          <div className="px-4 py-6 text-center text-sm text-stone-500">No courses found</div>
        )}
      </div>
    </div>
  );
}
