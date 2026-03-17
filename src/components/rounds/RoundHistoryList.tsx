'use client';

import { useState, useEffect, useCallback } from 'react';
import { Calendar, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import VerifiedPlayBadge from './VerifiedPlayBadge';

interface CourseData {
  courseId: number;
  courseName: string;
  facilityName: string | null;
  city: string | null;
  state: string | null;
  country: string;
}

interface VerifiedPlayData {
  id: string;
  badgeType: string;
  verifiedAt: string;
  verificationSource: string;
}

interface RoundItem {
  id: string;
  courseId: number;
  course: CourseData | null;
  ghinRoundId: string | null;
  score: number;
  adjustedScore: number | null;
  differential: number | null;
  teeBoxName: string | null;
  courseRating: number | null;
  slopeRating: number | null;
  playDate: string;
  numHoles: number;
  isVerified: boolean;
  source: string;
  verifiedPlay: VerifiedPlayData | null;
  createdAt: string;
}

type SortField = 'playDate' | 'score' | 'differential';

export default function RoundHistoryList() {
  const [rounds, setRounds] = useState<RoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState<SortField>('playDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const fetchRounds = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        sortBy,
        sortDir,
      });

      const res = await fetch(`/api/rounds/history?${params}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch rounds');
      }

      const data = await res.json();
      setRounds(data.items);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (err: any) {
      setError(err.message || 'Failed to load round history');
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, sortDir]);

  useEffect(() => {
    fetchRounds();
  }, [fetchRounds]);

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
    setPage(1);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortBy !== field) return null;
    return sortDir === 'desc' ? (
      <ChevronDown className="w-3.5 h-3.5" />
    ) : (
      <ChevronUp className="w-3.5 h-3.5" />
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading && rounds.length === 0) {
    return (
      <div className="rounded-xl border border-gray-800 bg-[#111111] p-8">
        <div className="flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-gray-600 border-t-white rounded-full animate-spin" />
          <span className="ml-3 text-gray-400 text-sm">Loading rounds...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-gray-800 bg-[#111111] p-8">
        <p className="text-red-400 text-sm text-center">{error}</p>
      </div>
    );
  }

  if (rounds.length === 0) {
    return (
      <div className="rounded-xl border border-gray-800 bg-[#111111] p-8">
        <div className="text-center">
          <Calendar className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No rounds recorded yet.</p>
          <p className="text-gray-500 text-xs mt-1">
            Import rounds from GHIN to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-[#111111]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <h3 className="text-lg font-semibold text-white">
          Round History
          <span className="ml-2 text-sm font-normal text-gray-400">
            ({total} round{total !== 1 ? 's' : ''})
          </span>
        </h3>
      </div>

      {/* Sort Controls */}
      <div className="flex items-center gap-4 px-6 py-3 border-b border-gray-800/50 text-xs text-gray-400">
        <span>Sort by:</span>
        <button
          onClick={() => handleSort('playDate')}
          className={`flex items-center gap-1 hover:text-white transition-colors ${sortBy === 'playDate' ? 'text-white' : ''}`}
        >
          Date <SortIcon field="playDate" />
        </button>
        <button
          onClick={() => handleSort('score')}
          className={`flex items-center gap-1 hover:text-white transition-colors ${sortBy === 'score' ? 'text-white' : ''}`}
        >
          Score <SortIcon field="score" />
        </button>
        <button
          onClick={() => handleSort('differential')}
          className={`flex items-center gap-1 hover:text-white transition-colors ${sortBy === 'differential' ? 'text-white' : ''}`}
        >
          Differential <SortIcon field="differential" />
        </button>
      </div>

      {/* Rounds List */}
      <div className="divide-y divide-gray-800/50">
        {rounds.map((round) => (
          <div
            key={round.id}
            className="px-6 py-4 hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-start justify-between">
              {/* Left: Course & Date */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-medium truncate">
                    {round.course?.courseName ?? 'Unknown Course'}
                  </span>
                  {round.isVerified && round.verifiedPlay && (
                    <VerifiedPlayBadge
                      source={round.verifiedPlay.verificationSource.toUpperCase()}
                    />
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(round.playDate)}
                  </span>
                  {round.course?.city && round.course?.state && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {round.course.city}, {round.course.state}
                    </span>
                  )}
                  {round.teeBoxName && (
                    <span className="text-gray-500">{round.teeBoxName} tees</span>
                  )}
                  <span className="text-gray-500">{round.numHoles} holes</span>
                </div>
              </div>

              {/* Right: Score & Differential */}
              <div className="flex items-center gap-6 ml-4">
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">{round.score}</p>
                  {round.adjustedScore && round.adjustedScore !== round.score && (
                    <p className="text-xs text-gray-500">
                      Adj: {round.adjustedScore}
                    </p>
                  )}
                </div>
                {round.differential !== null && (
                  <div className="text-right min-w-[60px]">
                    <p className="text-sm font-semibold text-gray-300">
                      {round.differential.toFixed(1)}
                    </p>
                    <p className="text-xs text-gray-500">Diff</p>
                  </div>
                )}
              </div>
            </div>

            {/* Course Rating / Slope */}
            {(round.courseRating || round.slopeRating) && (
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                {round.courseRating && (
                  <span>CR: {round.courseRating.toFixed(1)}</span>
                )}
                {round.slopeRating && <span>Slope: {round.slopeRating}</span>}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-800">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 text-sm text-gray-400 hover:text-white border border-gray-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-gray-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 text-sm text-gray-400 hover:text-white border border-gray-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
