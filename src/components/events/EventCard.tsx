'use client';

import Link from 'next/link';
import {
  Calendar,
  MapPin,
  DollarSign,
  Trophy,
  CheckCircle2,
  XCircle,
  Users,
} from 'lucide-react';

export interface EventCardProps {
  id: string;
  name: string;
  eventDate: string;
  endDate?: string | null;
  courseName?: string | null;
  format?: string | null;
  price?: number | null;
  city?: string | null;
  state?: string | null;
  maxHandicap?: number | null;
  minHandicap?: number | null;
  imageUrl?: string | null;
  matchScore?: number | null;
  eligible?: boolean;
  eligibilityReasons?: string[];
}

export default function EventCard({
  id,
  name,
  eventDate,
  endDate,
  courseName,
  format,
  price,
  city,
  state,
  maxHandicap,
  minHandicap,
  imageUrl,
  matchScore,
  eligible,
}: EventCardProps) {
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const dateDisplay = endDate
    ? `${formatDate(eventDate)} - ${formatDate(endDate)}`
    : formatDate(eventDate);

  const hasHandicapRestriction = maxHandicap !== null || minHandicap !== null;

  const handicapLabel = hasHandicapRestriction
    ? minHandicap !== null && maxHandicap !== null
      ? `${minHandicap} - ${maxHandicap} HCP`
      : maxHandicap !== null
        ? `${maxHandicap} HCP max`
        : `${minHandicap}+ HCP`
    : 'Open to all';

  return (
    <Link href={`/events/${id}`}>
      <div
        className="rounded-xl overflow-hidden transition-all hover:scale-[1.02] hover:shadow-lg cursor-pointer h-full flex flex-col"
        style={{
          backgroundColor: 'var(--cg-bg-card)',
          border: '1px solid var(--cg-border)',
        }}
      >
        {/* Image or gradient header */}
        {imageUrl ? (
          <div
            className="h-36 bg-cover bg-center"
            style={{ backgroundImage: `url(${imageUrl})` }}
          />
        ) : (
          <div
            className="h-24 flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(34,197,94,0.05) 100%)',
            }}
          >
            <Trophy className="h-8 w-8" style={{ color: 'var(--cg-accent)', opacity: 0.6 }} />
          </div>
        )}

        <div className="p-4 flex-1 flex flex-col">
          {/* Format & Eligibility badges */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {format && (
              <span
                className="px-2 py-0.5 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: 'var(--cg-bg)',
                  color: 'var(--cg-text-secondary)',
                  border: '1px solid var(--cg-border)',
                }}
              >
                {format}
              </span>
            )}
            {eligible !== undefined && (
              <span
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: eligible
                    ? 'rgba(34,197,94,0.15)'
                    : 'rgba(239,68,68,0.15)',
                  color: eligible ? '#22c55e' : '#ef4444',
                }}
              >
                {eligible ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <XCircle className="h-3 w-3" />
                )}
                {eligible ? 'Eligible' : 'Ineligible'}
              </span>
            )}
          </div>

          {/* Event name */}
          <h3
            className="text-sm font-semibold line-clamp-2 mb-1"
            style={{ color: 'var(--cg-text-primary)' }}
          >
            {name}
          </h3>

          {/* Course name */}
          {courseName && (
            <p className="text-xs mb-2" style={{ color: 'var(--cg-accent)' }}>
              {courseName}
            </p>
          )}

          {/* Details */}
          <div className="space-y-1.5 mt-auto">
            <p
              className="text-xs flex items-center gap-1.5"
              style={{ color: 'var(--cg-text-muted)' }}
            >
              <Calendar className="h-3 w-3 flex-shrink-0" />
              {dateDisplay}
            </p>

            {(city || state) && (
              <p
                className="text-xs flex items-center gap-1.5"
                style={{ color: 'var(--cg-text-muted)' }}
              >
                <MapPin className="h-3 w-3 flex-shrink-0" />
                {[city, state].filter(Boolean).join(', ')}
              </p>
            )}

            <div className="flex items-center justify-between">
              <p
                className="text-xs flex items-center gap-1.5"
                style={{ color: 'var(--cg-text-muted)' }}
              >
                <DollarSign className="h-3 w-3 flex-shrink-0" />
                {price !== null && price !== undefined
                  ? price === 0
                    ? 'Free'
                    : `$${price}`
                  : 'TBD'}
              </p>

              <p
                className="text-xs flex items-center gap-1.5"
                style={{ color: 'var(--cg-text-muted)' }}
              >
                <Users className="h-3 w-3 flex-shrink-0" />
                {handicapLabel}
              </p>
            </div>
          </div>

          {/* Match score indicator */}
          {matchScore !== null && matchScore !== undefined && (
            <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--cg-border)' }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs" style={{ color: 'var(--cg-text-muted)' }}>
                  Course EQ Match
                </span>
                <span
                  className="text-xs font-bold"
                  style={{ color: 'var(--cg-accent)' }}
                >
                  {matchScore}/100
                </span>
              </div>
              <div
                className="w-full h-1.5 rounded-full overflow-hidden"
                style={{ backgroundColor: 'var(--cg-bg)' }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${matchScore}%`,
                    backgroundColor: 'var(--cg-accent)',
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
