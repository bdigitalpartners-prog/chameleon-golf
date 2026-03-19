"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  FileText,
  Video,
  Headphones,
  BookOpen,
  Search,
  Loader2,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Play,
  X,
} from "lucide-react";

interface ContentItem {
  id: number;
  contentType: string;
  title: string;
  url: string;
  thumbnailUrl?: string | null;
  summary?: string | null;
  sourceName?: string | null;
  authorName?: string | null;
  publishedAt?: string | null;
  duration?: string | null;
  isFeatured: boolean;
  linkStatus?: string | null;
  lastCheckedAt?: string | null;
  architects: {
    architect: { id: number; name: string; slug: string };
  }[];
  courses: {
    course: { courseId: number; courseName: string };
  }[];
}

interface BookItem {
  id: number;
  title: string;
  authors: string[];
  coverImageUrl?: string | null;
  yearPublished?: number | null;
  description?: string | null;
  amazonUrl?: string | null;
  architects: {
    architect: { id: number; name: string; slug: string };
  }[];
}

const TYPE_ICONS: Record<string, any> = {
  article: FileText,
  video: Video,
  podcast: Headphones,
  interview: FileText,
  course_review: FileText,
};

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  article: { bg: "rgba(59,130,246,0.15)", text: "#60a5fa" },
  video: { bg: "rgba(239,68,68,0.15)", text: "#f87171" },
  podcast: { bg: "rgba(168,85,247,0.15)", text: "#c084fc" },
  interview: { bg: "rgba(14,165,233,0.15)", text: "#38bdf8" },
  course_review: { bg: "rgba(34,197,94,0.15)", text: "#4ade80" },
};

const TABS = [
  { key: "all", label: "All", icon: null },
  { key: "article", label: "Articles", icon: FileText },
  { key: "video", label: "Videos", icon: Video },
  { key: "podcast", label: "Podcasts", icon: Headphones },
  { key: "books", label: "Books", icon: BookOpen },
];

/** Extract YouTube video ID from various URL formats */
function getYouTubeId(url: string): string | null {
  if (!url) return null;
  // Standard watch URL
  const watchMatch = url.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];
  // Short URL
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];
  // Embed URL
  const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];
  return null;
}

/** Get YouTube thumbnail URL */
function getYouTubeThumbnail(url: string): string | null {
  const id = getYouTubeId(url);
  if (!id) return null;
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

function daysAgo(dateStr: string): string {
  const days = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

/** Source brand colors for visual variety */
const SOURCE_COLORS: Record<string, string> = {
  "The Fried Egg": "#e8b931",
  "Golf Digest": "#c62828",
  "No Laying Up": "#2e7d32",
  "Golf Club Atlas": "#1565c0",
  "Random Golf Club": "#6a1b9a",
  "Links Magazine": "#00695c",
  "Golfweek": "#e65100",
  "Golf Magazine / GOLF.com": "#ad1457",
  "Fried Egg Golf": "#e8b931",
  "GOLF Magazine": "#ad1457",
};

function getSourceColor(name: string | null | undefined): string {
  if (!name) return "var(--cg-text-muted)";
  return SOURCE_COLORS[name] || "var(--cg-text-muted)";
}

export default function FairwayPage() {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [books, setBooks] = useState<BookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [videoModal, setVideoModal] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/fairway?hideBroken=true")
      .then((r) => r.json())
      .then((d) => {
        setContent(d.content || []);
        setBooks(d.books || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Close video modal on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setVideoModal(null);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (tab === "books") return [];
    let items = content;
    if (tab !== "all") items = items.filter((c) => c.contentType === tab);
    if (q) {
      items = items.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.summary?.toLowerCase().includes(q) ||
          c.sourceName?.toLowerCase().includes(q) ||
          c.architects.some((a) =>
            a.architect.name.toLowerCase().includes(q)
          ) ||
          c.courses.some((co) =>
            co.course.courseName.toLowerCase().includes(q)
          )
      );
    }
    return items;
  }, [content, tab, search]);

  const filteredBooks = useMemo(() => {
    if (tab !== "all" && tab !== "books") return [];
    const q = search.toLowerCase();
    let items = books;
    if (q) {
      items = items.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.authors.some((a) => a.toLowerCase().includes(q)) ||
          b.architects.some((a) =>
            a.architect.name.toLowerCase().includes(q)
          )
      );
    }
    return items;
  }, [books, tab, search]);

  const featured = content.filter((c) => c.isFeatured).slice(0, 6);

  // Content counts for tab badges
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: content.length };
    for (const item of content) {
      c[item.contentType] = (c[item.contentType] || 0) + 1;
    }
    c.books = books.length;
    return c;
  }, [content, books]);

  const cardStyle: React.CSSProperties = {
    backgroundColor: "var(--cg-bg-card)",
    border: "1px solid var(--cg-border)",
    borderRadius: "0.75rem",
  };

  /** Handle clicking a video item - open in modal or new tab */
  const handleVideoClick = useCallback((url: string, e: React.MouseEvent) => {
    const ytId = getYouTubeId(url);
    if (ytId) {
      e.preventDefault();
      setVideoModal(ytId);
    }
    // For non-YouTube videos, let the link open normally
  }, []);

  /** Get thumbnail for an item - use stored thumbnail or generate from YouTube URL */
  const getThumbnail = useCallback((item: ContentItem): string | null => {
    if (item.thumbnailUrl) return item.thumbnailUrl;
    if (item.contentType === "video") return getYouTubeThumbnail(item.url);
    return null;
  }, []);

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--cg-bg-primary)" }}
    >
      {/* YouTube Video Modal */}
      {videoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
          onClick={() => setVideoModal(null)}
        >
          <div
            className="relative w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setVideoModal(null)}
              className="absolute -top-10 right-0 text-white/70 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
            <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
              <iframe
                className="absolute inset-0 w-full h-full rounded-xl"
                src={`https://www.youtube.com/embed/${videoModal}?autoplay=1&rel=0`}
                title="Video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Hero */}
        <div className="mb-8">
          <h1
            className="text-3xl font-bold sm:text-4xl"
            style={{ color: "var(--cg-text-primary)" }}
          >
            The Fairway
          </h1>
          <p
            className="mt-2 text-sm sm:text-base max-w-2xl"
            style={{ color: "var(--cg-text-secondary)" }}
          >
            Your curated collection of golf architecture articles, videos,
            podcasts, and books — all cross-linked to the courses and architects
            in our database.
          </p>
        </div>

        {/* Featured Section */}
        {featured.length > 0 && tab === "all" && !search && (
          <div className="mb-8">
            <h2
              className="text-lg font-semibold mb-4"
              style={{ color: "var(--cg-text-primary)" }}
            >
              Featured
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((item) => {
                const thumb = getThumbnail(item);
                const ytId = getYouTubeId(item.url);
                return (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      if (ytId) {
                        e.preventDefault();
                        setVideoModal(ytId);
                      }
                    }}
                    className="group rounded-xl overflow-hidden transition-all hover:ring-1 hover:ring-emerald-500"
                    style={cardStyle}
                  >
                    {thumb ? (
                      <div className="aspect-video overflow-hidden relative">
                        <img
                          src={thumb}
                          alt={item.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                        />
                        {ytId && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                            <div className="rounded-full bg-red-600/90 p-3 group-hover:bg-red-600 transition-colors">
                              <Play className="h-6 w-6 text-white fill-white" />
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        className="aspect-video flex items-center justify-center"
                        style={{ backgroundColor: "var(--cg-bg-secondary)" }}
                      >
                        {item.contentType === "video" ? (
                          <Video className="h-8 w-8" style={{ color: "var(--cg-text-muted)" }} />
                        ) : item.contentType === "podcast" ? (
                          <Headphones className="h-8 w-8" style={{ color: "var(--cg-text-muted)" }} />
                        ) : (
                          <FileText className="h-8 w-8" style={{ color: "var(--cg-text-muted)" }} />
                        )}
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="text-xs font-medium rounded-full px-2 py-0.5"
                          style={{
                            backgroundColor:
                              TYPE_COLORS[item.contentType]?.bg ??
                              "var(--cg-bg-secondary)",
                            color:
                              TYPE_COLORS[item.contentType]?.text ??
                              "var(--cg-text-muted)",
                          }}
                        >
                          {item.contentType}
                        </span>
                        {item.sourceName && (
                          <span
                            className="text-xs font-medium"
                            style={{ color: getSourceColor(item.sourceName) }}
                          >
                            {item.sourceName}
                          </span>
                        )}
                        {item.duration && (
                          <span
                            className="text-xs"
                            style={{ color: "var(--cg-text-muted)" }}
                          >
                            {item.duration}
                          </span>
                        )}
                      </div>
                      <h3
                        className="text-sm font-semibold line-clamp-2 group-hover:text-emerald-400 transition-colors"
                        style={{ color: "var(--cg-text-primary)" }}
                      >
                        {item.title}
                      </h3>
                      {item.summary && (
                        <p
                          className="text-xs mt-1 line-clamp-2"
                          style={{ color: "var(--cg-text-muted)" }}
                        >
                          {item.summary}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {item.architects.slice(0, 3).map((a) => (
                          <span
                            key={a.architect.id}
                            className="text-xs rounded-full px-2 py-0.5"
                            style={{
                              backgroundColor: "rgba(46,204,113,0.15)",
                              color: "#2ECC71",
                            }}
                          >
                            {a.architect.name}
                          </span>
                        ))}
                        {item.architects.length > 3 && (
                          <span
                            className="text-xs"
                            style={{ color: "var(--cg-text-muted)" }}
                          >
                            +{item.architects.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Search + Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <div
            className="relative flex-1 max-w-md"
            style={{ color: "var(--cg-text-secondary)" }}
          >
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
              style={{ color: "var(--cg-text-muted)" }}
            />
            <input
              type="text"
              placeholder="Search content, architects, courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg pl-9 pr-3 py-2 text-sm outline-none"
              style={{
                backgroundColor: "var(--cg-bg-card)",
                border: "1px solid var(--cg-border)",
                color: "var(--cg-text-primary)",
              }}
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
                style={{
                  backgroundColor:
                    tab === t.key ? "var(--cg-accent)" : "var(--cg-bg-card)",
                  color: tab === t.key ? "#000" : "var(--cg-text-secondary)",
                  border: "1px solid var(--cg-border)",
                }}
              >
                {t.icon && <t.icon className="h-3 w-3" />}
                {t.label}
                {counts[t.key] !== undefined && (
                  <span
                    className="text-[10px] rounded-full px-1.5 py-0.5 ml-0.5"
                    style={{
                      backgroundColor: tab === t.key ? "rgba(0,0,0,0.2)" : "var(--cg-bg-secondary)",
                      color: tab === t.key ? "#000" : "var(--cg-text-muted)",
                    }}
                  >
                    {counts[t.key]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-16">
            <Loader2
              className="h-8 w-8 animate-spin"
              style={{ color: "var(--cg-accent)" }}
            />
          </div>
        )}

        {!loading && (
          <div className="space-y-8">
            {/* Content list */}
            {(tab === "all" || tab !== "books") && filtered.length > 0 && (
              <div className="space-y-3">
                {tab === "all" && (
                  <h2
                    className="text-lg font-semibold"
                    style={{ color: "var(--cg-text-primary)" }}
                  >
                    All Content
                    <span
                      className="ml-2 text-sm font-normal"
                      style={{ color: "var(--cg-text-muted)" }}
                    >
                      ({filtered.length})
                    </span>
                  </h2>
                )}
                {filtered.map((item) => {
                  const Icon = TYPE_ICONS[item.contentType] || FileText;
                  const colors = TYPE_COLORS[item.contentType] || {
                    bg: "var(--cg-bg-secondary)",
                    text: "var(--cg-text-muted)",
                  };
                  const isBroken =
                    item.linkStatus === "broken" || item.linkStatus === "error";
                  const thumb = getThumbnail(item);
                  const ytId = getYouTubeId(item.url);
                  return (
                    <div
                      key={item.id}
                      className="rounded-xl p-4 flex gap-4 transition-all hover:ring-1 hover:ring-emerald-500/30"
                      style={{
                        ...cardStyle,
                        opacity: isBroken ? 0.5 : 1,
                      }}
                    >
                      {thumb ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 relative group/thumb cursor-pointer"
                          onClick={(e) => handleVideoClick(item.url, e)}
                        >
                          <img
                            src={thumb}
                            alt=""
                            className="h-20 w-32 rounded-lg object-cover"
                          />
                          {ytId && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover/thumb:bg-black/30 transition-colors rounded-lg">
                              <div className="rounded-full bg-red-600/90 p-1.5">
                                <Play className="h-3.5 w-3.5 text-white fill-white" />
                              </div>
                            </div>
                          )}
                        </a>
                      ) : item.contentType === "video" ? (
                        <div
                          className="shrink-0 h-20 w-32 rounded-lg flex items-center justify-center cursor-pointer"
                          style={{ backgroundColor: "var(--cg-bg-secondary)" }}
                          onClick={(e) => handleVideoClick(item.url, e as any)}
                        >
                          <Play className="h-6 w-6" style={{ color: "var(--cg-text-muted)" }} />
                        </div>
                      ) : null}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span
                            className="inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5"
                            style={{
                              backgroundColor: colors.bg,
                              color: colors.text,
                            }}
                          >
                            <Icon className="h-3 w-3" />
                            {item.contentType}
                          </span>
                          {item.sourceName && (
                            <span
                              className="text-xs font-medium"
                              style={{ color: getSourceColor(item.sourceName) }}
                            >
                              {item.sourceName}
                            </span>
                          )}
                          {item.duration && (
                            <span
                              className="text-xs"
                              style={{ color: "var(--cg-text-muted)" }}
                            >
                              {item.duration}
                            </span>
                          )}
                          {isBroken && (
                            <span className="inline-flex items-center gap-1 text-xs text-red-400">
                              <AlertTriangle className="h-3 w-3" />
                              Link may be broken
                            </span>
                          )}
                        </div>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
                          style={{ color: "var(--cg-text-primary)" }}
                          onClick={(e) => handleVideoClick(item.url, e)}
                        >
                          {item.title}
                          {!ytId && <ExternalLink className="h-3 w-3 shrink-0 opacity-50" />}
                          {ytId && <Play className="h-3 w-3 shrink-0 opacity-50" />}
                        </a>
                        {item.summary && (
                          <p
                            className="text-xs mt-1 line-clamp-2"
                            style={{ color: "var(--cg-text-muted)" }}
                          >
                            {item.summary}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          {item.architects.map((a) => (
                            <Link
                              key={a.architect.id}
                              href={`/architects/${a.architect.slug}`}
                              className="text-xs rounded-full px-2 py-0.5 hover:opacity-80 transition-opacity"
                              style={{
                                backgroundColor: "rgba(46,204,113,0.15)",
                                color: "#2ECC71",
                              }}
                            >
                              {a.architect.name}
                            </Link>
                          ))}
                          {item.courses.map((c) => (
                            <Link
                              key={c.course.courseId}
                              href={`/course/${c.course.courseId}`}
                              className="text-xs rounded-full px-2 py-0.5 hover:opacity-80 transition-opacity"
                              style={{
                                backgroundColor: "rgba(59,130,246,0.15)",
                                color: "#60a5fa",
                              }}
                            >
                              {c.course.courseName}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Books */}
            {(tab === "all" || tab === "books") && filteredBooks.length > 0 && (
              <div>
                <h2
                  className="text-lg font-semibold mb-4"
                  style={{ color: "var(--cg-text-primary)" }}
                >
                  Bookshelf
                  <span
                    className="ml-2 text-sm font-normal"
                    style={{ color: "var(--cg-text-muted)" }}
                  >
                    ({filteredBooks.length})
                  </span>
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredBooks.map((book) => (
                    <div
                      key={book.id}
                      className="rounded-xl p-4 flex gap-3"
                      style={cardStyle}
                    >
                      {book.coverImageUrl && (
                        <img
                          src={book.coverImageUrl}
                          alt={book.title}
                          className="h-24 w-16 rounded object-cover shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-sm font-semibold line-clamp-2"
                          style={{ color: "var(--cg-text-primary)" }}
                        >
                          {book.title}
                        </div>
                        <div
                          className="text-xs mt-0.5"
                          style={{ color: "var(--cg-text-muted)" }}
                        >
                          {book.authors.join(", ")}
                          {book.yearPublished
                            ? ` · ${book.yearPublished}`
                            : ""}
                        </div>
                        {book.description && (
                          <p
                            className="text-xs mt-1 line-clamp-2"
                            style={{ color: "var(--cg-text-secondary)" }}
                          >
                            {book.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {book.architects.map((a) => (
                            <Link
                              key={a.architect.id}
                              href={`/architects/${a.architect.slug}`}
                              className="text-xs rounded-full px-2 py-0.5 hover:opacity-80"
                              style={{
                                backgroundColor: "rgba(46,204,113,0.15)",
                                color: "#2ECC71",
                              }}
                            >
                              {a.architect.name}
                            </Link>
                          ))}
                          {book.amazonUrl && (
                            <a
                              href={book.amazonUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs rounded-full px-2 py-0.5 inline-flex items-center gap-1"
                              style={{
                                backgroundColor: "rgba(234,179,8,0.15)",
                                color: "#fbbf24",
                              }}
                            >
                              Amazon
                              <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!loading &&
              filtered.length === 0 &&
              filteredBooks.length === 0 && (
                <div
                  className="py-16 text-center"
                  style={{ color: "var(--cg-text-muted)" }}
                >
                  No content found. Try adjusting your search or filter.
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
}
