"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, Filter, Play, ExternalLink, Eye, Calendar, Users, Video, Podcast, BookOpen, ChevronRight, TrendingUp } from "lucide-react";
import { CreatorContentCard } from "@/components/creators/CreatorContentCard";
import { CreatorAvatar } from "@/components/creators/CreatorAvatar";
import { PlatformBadge } from "@/components/creators/PlatformBadge";

/* ─── Featured Creators ─── */
const FEATURED_CREATORS = [
  { name: "No Laying Up", handle: "no-laying-up", platforms: ["youtube", "instagram"], description: "Strapped series, Tourist Sauce, and the best golf travel content on YouTube" },
  { name: "The Fried Egg", handle: "the-fried-egg", platforms: ["podcast", "blog"], description: "Deep-dive architecture analysis, course reviews, and golf design history" },
  { name: "Random Golf Club", handle: "random-golf-club", platforms: ["youtube", "tiktok"], description: "Public course hidden gems, honest reviews, and everyman golf content" },
  { name: "Erik Anders Lang", handle: "erik-anders-lang", platforms: ["youtube"], description: "Adventures in Golf — exploring the world's most iconic and unexpected courses" },
  { name: "Rick Shiels", handle: "rick-shiels", platforms: ["youtube"], description: "Course reviews across UK, Ireland, and the world's bucket-list courses" },
  { name: "Golf Digest", handle: "golf-digest", platforms: ["blog", "youtube"], description: "Rankings methodology, course profiles, and every-hole flyovers" },
  { name: "Links Magazine", handle: "links-magazine", platforms: ["blog"], description: "Architecture features, course profiles, and golf travel deep dives" },
];

const PLATFORM_FILTERS = [
  { value: "", label: "All Platforms" },
  { value: "youtube", label: "YouTube" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "podcast", label: "Podcast" },
  { value: "blog", label: "Blog" },
];

const CONTENT_TYPE_FILTERS = [
  { value: "", label: "All Types" },
  { value: "review", label: "Review" },
  { value: "flyover", label: "Flyover" },
  { value: "vlog", label: "Vlog" },
  { value: "course_guide", label: "Course Guide" },
];

export default function CreatorsPage() {
  const [trending, setTrending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [platformFilter, setPlatformFilter] = useState("");
  const [contentTypeFilter, setContentTypeFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [searching, setSearching] = useState(false);

  // Fetch trending content
  useEffect(() => {
    const params = new URLSearchParams();
    params.set("limit", "30");
    if (platformFilter) params.set("platform", platformFilter);
    if (contentTypeFilter) params.set("contentType", contentTypeFilter);

    fetch(`/api/creators/trending?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setTrending(data.content || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [platformFilter, contentTypeFilter]);

  // Search creator content
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    try {
      const params = new URLSearchParams();
      params.set("creator", searchQuery);
      if (platformFilter) params.set("platform", platformFilter);
      const res = await fetch(`/api/creators/search?${params}`);
      const data = await res.json();
      setSearchResults(data.content || []);
    } catch {
      setSearchResults([]);
    }
    setSearching(false);
  }, [searchQuery, platformFilter]);

  const displayContent = searchResults !== null ? searchResults : trending;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0A0A0A" }}>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-[#00FF85]/5 to-transparent" />
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-6" style={{ backgroundColor: "rgba(0,255,133,0.1)", border: "1px solid rgba(0,255,133,0.2)" }}>
            <Video className="w-4 h-4" style={{ color: "#00FF85" }} />
            <span className="text-xs font-semibold" style={{ color: "#00FF85" }}>CREATOR HUB</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: "var(--cg-text-primary)" }}>
            Golf Content Creator Hub
          </h1>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: "var(--cg-text-secondary)" }}>
            Every video, podcast, and review — linked to the courses in our database
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 pb-16 space-y-12">
        {/* Featured Creators */}
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: "var(--cg-text-primary)" }}>
            <Users className="w-5 h-5" style={{ color: "#00FF85" }} />
            Featured Creators
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {FEATURED_CREATORS.map((creator) => (
              <Link
                key={creator.handle}
                href={`/creators/${creator.handle}`}
                className="group rounded-xl p-4 transition-all duration-200"
                style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(0,255,133,0.3)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--cg-border)"; }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <CreatorAvatar name={creator.name} handle={creator.handle} size="md" />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate" style={{ color: "var(--cg-text-primary)" }}>
                      {creator.name}
                    </div>
                    <div className="flex gap-1 mt-1">
                      {creator.platforms.map((p) => (
                        <PlatformBadge key={p} platform={p} />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "var(--cg-text-muted)" }}>
                  {creator.description}
                </p>
                <div className="mt-3 flex items-center gap-1 text-xs font-medium" style={{ color: "#00FF85" }}>
                  View Profile <ChevronRight className="w-3 h-3" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Search & Filters */}
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: "var(--cg-text-primary)" }}>
            <TrendingUp className="w-5 h-5" style={{ color: "#00FF85" }} />
            {searchResults !== null ? "Search Results" : "Trending Content"}
          </h2>

          <div className="flex flex-wrap items-center gap-3 mb-6">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--cg-text-muted)" }} />
              <input
                type="text"
                placeholder="Search creators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-full pl-9 pr-4 py-2 rounded-lg text-sm outline-none"
                style={{
                  backgroundColor: "var(--cg-bg-card)",
                  border: "1px solid var(--cg-border)",
                  color: "var(--cg-text-primary)",
                }}
              />
            </div>

            {/* Platform filter */}
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm outline-none cursor-pointer"
              style={{
                backgroundColor: "var(--cg-bg-card)",
                border: "1px solid var(--cg-border)",
                color: "var(--cg-text-primary)",
              }}
            >
              {PLATFORM_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>

            {/* Content type filter */}
            <select
              value={contentTypeFilter}
              onChange={(e) => setContentTypeFilter(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm outline-none cursor-pointer"
              style={{
                backgroundColor: "var(--cg-bg-card)",
                border: "1px solid var(--cg-border)",
                color: "var(--cg-text-primary)",
              }}
            >
              {CONTENT_TYPE_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>

            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(""); setSearchResults(null); }}
                className="px-3 py-2 rounded-lg text-xs font-medium"
                style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "var(--cg-text-secondary)" }}
              >
                Clear Search
              </button>
            )}
          </div>

          {/* Content Feed */}
          {loading || searching ? (
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-24 rounded-xl animate-pulse" style={{ backgroundColor: "var(--cg-bg-card)" }} />
              ))}
            </div>
          ) : displayContent.length === 0 ? (
            <div className="text-center py-16 rounded-xl" style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}>
              <Video className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--cg-text-muted)" }} />
              <p className="text-sm" style={{ color: "var(--cg-text-muted)" }}>
                {searchResults !== null ? "No content found matching your search." : "No creator content yet. Check back soon!"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayContent.map((item: any, i: number) => (
                <CreatorContentCard key={item.id || i} item={item} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
