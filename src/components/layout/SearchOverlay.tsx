"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { trackCourseSearch } from "@/lib/analytics";

interface SearchResult {
  courseId: number;
  courseName: string;
  facilityName: string | null;
  city: string | null;
  state: string | null;
  country: string;
  originalArchitect: string | null;
  logoUrl: string | null;
  score: number;
}

export function SearchOverlay({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (query.length < 2) { setResults([]); setSelectedIndex(-1); return; }
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/courses/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        const hits = data.results ?? [];
        setResults(hits);
        setSelectedIndex(-1);
        trackCourseSearch(query, hits.length);
      } catch { setResults([]); }
      setLoading(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  function navigateToResult(result: SearchResult) {
    router.push(`/course/${result.courseId}`);
    onClose();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && results[selectedIndex]) {
        navigateToResult(results[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      onClose();
    }
  }

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
            onKeyDown={handleKeyDown}
            placeholder="Search courses, cities, states, architects..."
            className="flex-1 text-lg outline-none bg-transparent"
            style={{ color: "var(--cg-text-primary)" }}
          />
          {loading && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" style={{ color: "var(--cg-text-muted)" }} />
          )}
          <button onClick={onClose}><X className="h-5 w-5" style={{ color: "var(--cg-text-muted)" }} /></button>
        </div>
        {results.length > 0 && (
          <ul className="max-h-96 overflow-y-auto py-2">
            {results.map((r, i) => (
              <li key={r.courseId}>
                <button
                  onClick={() => navigateToResult(r)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors"
                  style={{
                    backgroundColor: i === selectedIndex ? "var(--cg-bg-tertiary)" : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--cg-bg-tertiary)";
                    setSelectedIndex(i);
                  }}
                  onMouseLeave={(e) => {
                    if (i !== selectedIndex) e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate" style={{ color: "var(--cg-text-primary)" }}>{r.courseName}</div>
                    <div className="text-sm truncate" style={{ color: "var(--cg-text-muted)" }}>
                      {[r.city, r.state, r.country].filter(Boolean).join(", ")}
                      {r.originalArchitect && (
                        <span> &middot; {r.originalArchitect}</span>
                      )}
                    </div>
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
