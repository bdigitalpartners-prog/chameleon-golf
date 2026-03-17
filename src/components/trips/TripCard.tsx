"use client";

import Link from "next/link";
import { MapPin, Calendar, Users, Flag } from "lucide-react";

type TripCardProps = {
  trip: {
    id: string;
    name: string;
    destination: string;
    startDate: string;
    endDate: string;
    status: string;
    groupMatchScore?: string | number | null;
    participants: {
      id: string;
      user: { id: string; name?: string; image?: string };
    }[];
    rounds: any[];
    _count?: { expenses: number; itinerary: number };
  };
};

const STATUS_COLORS: Record<string, string> = {
  planning: "#f59e0b",
  confirmed: "#22c55e",
  active: "#3b82f6",
  completed: "#6b7280",
};

export function TripCard({ trip }: TripCardProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const dayCount =
    Math.ceil(
      (new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) /
        (1000 * 60 * 60 * 24)
    ) + 1;

  return (
    <Link
      href={`/trips/${trip.id}`}
      className="rounded-xl p-4 block transition-all hover:scale-[1.01]"
      style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-sm truncate" style={{ color: "var(--cg-text-primary)" }}>
          {trip.name}
        </h3>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-medium capitalize flex-shrink-0 ml-2"
          style={{
            backgroundColor: `${STATUS_COLORS[trip.status] ?? "#6b7280"}20`,
            color: STATUS_COLORS[trip.status] ?? "#6b7280",
          }}
        >
          {trip.status}
        </span>
      </div>

      {/* Destination & dates */}
      <div className="space-y-1.5 mb-3">
        <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--cg-text-muted)" }}>
          <MapPin className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">{trip.destination}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--cg-text-muted)" }}>
          <Calendar className="h-3 w-3 flex-shrink-0" />
          <span>
            {formatDate(trip.startDate)} - {formatDate(trip.endDate)} ({dayCount}d)
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-xs" style={{ color: "var(--cg-text-secondary)" }}>
            <Users className="h-3 w-3" /> {trip.participants.length}
          </span>
          <span className="flex items-center gap-1 text-xs" style={{ color: "var(--cg-text-secondary)" }}>
            <Flag className="h-3 w-3" /> {trip.rounds.length} rounds
          </span>
        </div>

        {trip.groupMatchScore != null && (
          <div className="flex items-center gap-1">
            <span className="text-[10px]" style={{ color: "var(--cg-text-muted)" }}>EQ</span>
            <span className="text-sm font-bold" style={{ color: "var(--cg-accent)" }}>
              {Number(trip.groupMatchScore).toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {/* Participant avatars */}
      {trip.participants.length > 0 && (
        <div className="flex items-center mt-3 pt-3" style={{ borderTop: "1px solid var(--cg-border)" }}>
          <div className="flex -space-x-2">
            {trip.participants.slice(0, 5).map((p) => (
              <div
                key={p.id}
                className="h-6 w-6 rounded-full flex items-center justify-center overflow-hidden border-2"
                style={{
                  backgroundColor: "var(--cg-bg-tertiary)",
                  borderColor: "var(--cg-bg-card)",
                }}
              >
                {p.user.image ? (
                  <img src={p.user.image} alt="" className="h-6 w-6 rounded-full object-cover" />
                ) : (
                  <span className="text-[8px] font-bold" style={{ color: "var(--cg-text-muted)" }}>
                    {(p.user.name ?? "?").charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            ))}
            {trip.participants.length > 5 && (
              <div
                className="h-6 w-6 rounded-full flex items-center justify-center border-2"
                style={{
                  backgroundColor: "var(--cg-bg-tertiary)",
                  borderColor: "var(--cg-bg-card)",
                }}
              >
                <span className="text-[8px] font-bold" style={{ color: "var(--cg-text-muted)" }}>
                  +{trip.participants.length - 5}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </Link>
  );
}
