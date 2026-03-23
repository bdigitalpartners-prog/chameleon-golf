"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Trophy,
  Search,
  Calendar,
  ChevronRight,
  Filter,
  ArrowUpRight,
  Loader2,
} from "lucide-react";

/* ─── Types ────────────────────────────────────────── */
interface Tournament {
  id: number;
  course_id: number;
  tournament_name: string;
  tour: string | null;
  year: number;
  winner_name: string | null;
  winner_score: string | null;
  runner_up: string | null;
  winning_purse: number | null;
  total_purse: number | null;
  notable_moments: string | null;
  course_name: string | null;
  city: string | null;
  state: string | null;
  cid: number | null;
}

interface Stats {
  total: number;
  tours: number;
  years: number;
}

/* ─── Constants ────────────────────────────────────── */
const TOURS = [
  "All Tours",
  "PGA Tour",
  "LPGA",
  "DP World Tour",
  "Champions Tour",
  "LIV Golf",
  "Major",
  "Ryder Cup",
  "Presidents Cup",
  "US Amateur",
];

const TOUR_COLORS: Record<string, string> = {
  "PGA Tour": "bg-blue-600/20 text-blue-400 border-blue-500/30",
  LPGA: "bg-pink-600/20 text-pink-400 border-pink-500/30",
  "DP World Tour": "bg-purple-600/20 text-purple-400 border-purple-500/30",
  "Champions Tour": "bg-amber-600/20 text-amber-400 border-amber-500/30",
  "LIV Golf": "bg-red-600/20 text-red-400 border-red-500/30",
  Major: "bg-[#00FF85]/20 text-[#00FF85] border-[#00FF85]/30",
  "Ryder Cup": "bg-yellow-600/20 text-yellow-400 border-yellow-500/30",
  "Presidents Cup": "bg-cyan-600/20 text-cyan-400 border-cyan-500/30",
  "US Amateur": "bg-orange-600/20 text-orange-400 border-orange-500/30",
};

/* ─── Helpers ──────────────────────────────────────── */
function isUnderPar(score: string | null): boolean {
  if (!score) return false;
  return score.startsWith("-");
}

function TourBadge({ tour }: { tour: string }) {
  const cls = TOUR_COLORS[tour] || "bg-[#222] text-[#9CA3AF] border-[#333]";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide border ${cls}`}
    >
      {tour}
    </span>
  );
}

/* ─── Skeleton ─────────────────────────────────────── */
function TournamentCardSkeleton() {
  return (
    <div className="bg-[#111111] border border-[#222222] rounded-xl p-5 animate-pulse">
      <div className="h-4 bg-[#222] rounded w-3/4 mb-3" />
      <div className="h-3 bg-[#222] rounded w-1/2 mb-2" />
      <div className="h-3 bg-[#222] rounded w-2/3 mb-2" />
      <div className="h-3 bg-[#222] rounded w-1/3" />
    </div>
  );
}

/* ─── Main Component ───────────────────────────────── */
export function TournamentsHub() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [upcoming, setUpcoming] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [upcomingLoading, setUpcomingLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({ total: 0, tours: 0, years: 0 });

  // Filters
  const [tourFilter, setTourFilter] = useState("All Tours");
  const [yearFilter, setYearFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTournaments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "24" });
      if (tourFilter !== "All Tours") params.set("tour", tourFilter);
      if (yearFilter) params.set("year", yearFilter);
      if (searchQuery) params.set("name", searchQuery);

      const endpoint = tourFilter !== "All Tours" || yearFilter || searchQuery
        ? "/api/tournaments/search"
        : "/api/tournaments";

      const res = await fetch(`${endpoint}?${params}`);
      const data = await res.json();
      setTournaments(data.tournaments ?? []);
      setTotalPages(data.pagination?.totalPages ?? 1);

      if (!tourFilter && !yearFilter && !searchQuery && page === 1) {
        const total = data.pagination?.total ?? data.tournaments?.length ?? 0;
        const tours = new Set(data.tournaments?.map((t: Tournament) => t.tour).filter(Boolean));
        const years = new Set(data.tournaments?.map((t: Tournament) => t.year));
        setStats({
          total,
          tours: tours.size || TOURS.length - 1,
          years: years.size || 0,
        });
      }
    } catch (err) {
      console.error("Failed to fetch tournaments:", err);
    } finally {
      setLoading(false);
    }
  }, [page, tourFilter, yearFilter, searchQuery]);

  const fetchUpcoming = useCallback(async () => {
    setUpcomingLoading(true);
    try {
      const res = await fetch("/api/tournaments/upcoming?limit=5");
      const data = await res.json();
      setUpcoming(data.tournaments ?? []);
    } catch (err) {
      console.error("Failed to fetch upcoming:", err);
    } finally {
      setUpcomingLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTournaments();
  }, [fetchTournaments]);

  useEffect(() => {
    fetchUpcoming();
  }, [fetchUpcoming]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [tourFilter, yearFilter, searchQuery]);

  // Generate year options
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 100 }, (_, i) => String(currentYear - i));

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0A0A0A" }}>
      {/* ─── Hero Section ─── */}
      <div className="relative overflow-hidden border-b border-[#222]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#00FF85]/5 via-transparent to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:py-20">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="w-8 h-8 text-[#00FF85]" />
            <h1 className="text-3xl sm:text-4xl font-bold text-white">Tournament Heritage</h1>
          </div>
          <p className="text-[#9CA3AF] text-lg max-w-2xl mb-8">
            Explore the rich history of professional golf tournaments. Every course tells a story through the champions who conquered it.
          </p>

          {/* Stat bar */}
          <div className="flex flex-wrap gap-6">
            <div className="bg-[#111111] border border-[#222222] rounded-lg px-5 py-3">
              <div className="text-2xl font-bold text-[#00FF85]">{stats.total.toLocaleString()}</div>
              <div className="text-xs text-[#9CA3AF] uppercase tracking-wide">Tournaments</div>
            </div>
            <div className="bg-[#111111] border border-[#222222] rounded-lg px-5 py-3">
              <div className="text-2xl font-bold text-white">{stats.tours}</div>
              <div className="text-xs text-[#9CA3AF] uppercase tracking-wide">Tours Covered</div>
            </div>
            <div className="bg-[#111111] border border-[#222222] rounded-lg px-5 py-3">
              <div className="text-2xl font-bold text-white">{stats.years}+</div>
              <div className="text-xs text-[#9CA3AF] uppercase tracking-wide">Years of History</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* ─── This Week / Upcoming ─── */}
        {upcoming.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-[#00FF85]" />
              <h2 className="text-xl font-bold text-white">This Week &amp; Upcoming</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingLoading
                ? Array.from({ length: 3 }).map((_, i) => <TournamentCardSkeleton key={i} />)
                : upcoming.map((t) => (
                    <div
                      key={t.id}
                      className="bg-[#111111] border border-[#00FF85]/20 rounded-xl p-5 hover:border-[#00FF85]/50 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[#00FF85] font-bold">{t.year}</span>
                        {t.tour && <TourBadge tour={t.tour} />}
                      </div>
                      <h3 className="text-white font-semibold mb-1">{t.tournament_name}</h3>
                      {t.course_name && (
                        <Link
                          href={`/course/${t.cid || t.course_id}`}
                          className="flex items-center gap-1 text-sm text-[#00FF85] hover:underline"
                        >
                          {t.course_name}
                          <ArrowUpRight className="w-3 h-3" />
                        </Link>
                      )}
                      {t.city && t.state && (
                        <p className="text-xs text-[#9CA3AF] mt-1">{t.city}, {t.state}</p>
                      )}
                    </div>
                  ))}
            </div>
          </section>
        )}

        {/* ─── Filters ─── */}
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-[#9CA3AF]" />
            <h2 className="text-lg font-semibold text-white">Search &amp; Filter</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Search tournaments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#111111] border border-[#222222] rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-[#666] focus:outline-none focus:border-[#00FF85]/50 transition-colors"
              />
            </div>

            {/* Tour filter */}
            <select
              value={tourFilter}
              onChange={(e) => setTourFilter(e.target.value)}
              className="bg-[#111111] border border-[#222222] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00FF85]/50 transition-colors"
            >
              {TOURS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            {/* Year filter */}
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="bg-[#111111] border border-[#222222] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00FF85]/50 transition-colors"
            >
              <option value="">All Years</option>
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* ─── Tournament Grid ─── */}
        <section>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <TournamentCardSkeleton key={i} />
              ))}
            </div>
          ) : tournaments.length === 0 ? (
            <div className="text-center py-20">
              <Trophy className="w-12 h-12 text-[#333] mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Tournaments Found</h3>
              <p className="text-[#9CA3AF]">
                {searchQuery || tourFilter !== "All Tours" || yearFilter
                  ? "Try adjusting your filters to see more results."
                  : "Tournament data will appear here once it's imported."}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tournaments.map((t) => (
                  <div
                    key={t.id}
                    className="bg-[#111111] border border-[#222222] rounded-xl p-5 hover:border-[#00FF85]/30 transition-colors group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[#00FF85] font-bold">{t.year}</span>
                        {t.tour && <TourBadge tour={t.tour} />}
                      </div>
                    </div>
                    <h3 className="text-white font-semibold mb-1 group-hover:text-[#00FF85] transition-colors">
                      {t.tournament_name}
                    </h3>
                    {t.course_name && (
                      <Link
                        href={`/course/${t.cid || t.course_id}`}
                        className="flex items-center gap-1 text-sm text-[#9CA3AF] hover:text-[#00FF85] transition-colors"
                      >
                        {t.course_name}
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    )}
                    {t.city && t.state && (
                      <p className="text-xs text-[#666] mt-0.5">{t.city}, {t.state}</p>
                    )}
                    {t.winner_name && (
                      <div className="mt-3 pt-3 border-t border-[#222]">
                        <div className="flex items-center gap-2">
                          <Trophy className="w-3.5 h-3.5 text-[#F59E0B]" />
                          <span className="text-white text-sm font-medium">{t.winner_name}</span>
                          {t.winner_score && (
                            <span
                              className={`text-sm font-mono font-bold ${
                                isUnderPar(t.winner_score) ? "text-[#00FF85]" : "text-white"
                              }`}
                            >
                              {t.winner_score}
                            </span>
                          )}
                        </div>
                        {t.runner_up && (
                          <p className="text-xs text-[#666] mt-1">Runner-up: {t.runner_up}</p>
                        )}
                      </div>
                    )}
                    {t.notable_moments && (
                      <p className="text-xs text-[#9CA3AF] mt-2 italic line-clamp-2">
                        {t.notable_moments}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 rounded-lg text-sm bg-[#111111] border border-[#222222] text-white disabled:opacity-30 hover:border-[#00FF85]/30 transition-colors"
                  >
                    Previous
                  </button>
                  <span className="flex items-center px-4 text-sm text-[#9CA3AF]">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 rounded-lg text-sm bg-[#111111] border border-[#222222] text-white disabled:opacity-30 hover:border-[#00FF85]/30 transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
