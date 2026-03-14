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
    <div
      className="fixed inset-0 z-[60] backdrop-blur-sm"
      style={{ backgroundColor: "var(--cg-bg-overlay)" }}
      onClick={onClose}
    >
      <div
        className="mx-auto mt-20 max-w-xl rounded-xl shadow-2xl"
        style={{ backgroundColor: "var(--cg-bg-secondary)", border: "1px solid var(--cg-border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center gap-3 px-4 py-3"
          style={{ borderBottom: "1px solid var(--cg-border)" }}
        >
          <Search className="h-5 w-5" style={{ color: "var(--cg-text-muted)" }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search courses, cities, states..."
            className="flex-1 text-lg outline-none bg-transparent"
            style={{ color: "var(--cg-text-primary)" }}
          />
          <button onClick={onClose}><X className="h-5 w-5" style={{ color: "var(--cg-text-muted)" }} /></button>
        </div>
        {results.length > 0 && (
          <ul className="max-h-80 overflow-y-auto py-2">
            {results.map((r) => (
              <li key={r.courseId}>
                <button
                  onClick={() => { router.push(`/course/${r.courseId}`); onClose(); }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors"
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--cg-bg-tertiary)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <div>
                    <div className="font-medium" style={{ color: "var(--cg-text-primary)" }}>{r.courseName}</div>
                    <div className="text-sm" style={{ color: "var(--cg-text-muted)" }}>{[r.city, r.state, r.country].filter(Boolean).join(", ")}</div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
        {query.length >= 2 && results.length === 0 && !loading && (
          <div className="px-4 py-6 text-center text-sm" style={{ color: "var(--cg-text-muted)" }}>No courses found</div>
        )}
      </div>
    </div>
  );
}
