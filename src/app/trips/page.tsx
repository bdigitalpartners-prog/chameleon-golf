"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Loader2, Plus, MapPin, Calendar, Users, Plane } from "lucide-react";
import { TripCard } from "@/components/trips/TripCard";

type Trip = {
  id: string;
  name: string;
  destination: string;
  description?: string;
  startDate: string;
  endDate: string;
  budget?: string;
  groupSize?: number;
  status: string;
  groupMatchScore?: number;
  participants: {
    id: string;
    userId: string;
    role: string;
    rsvpStatus: string;
    user: { id: string; name?: string; email?: string; image?: string };
  }[];
  rounds: any[];
  _count: { expenses: number; itinerary: number };
};

const STATUS_FILTERS = [
  { value: "", label: "All Trips" },
  { value: "planning", label: "Planning" },
  { value: "confirmed", label: "Confirmed" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
] as const;

export default function TripsPage() {
  const { data: session, status: authStatus } = useSession();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    if (authStatus !== "authenticated") return;

    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);

    fetch(`/api/trips?${params}`)
      .then((r) => r.json())
      .then((data) => setTrips(data.trips ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [authStatus, statusFilter]);

  if (authStatus === "loading") {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--cg-accent)" }} />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <Plane className="mx-auto h-16 w-16" style={{ color: "var(--cg-text-muted)" }} />
        <h1 className="mt-4 font-display text-2xl font-bold" style={{ color: "var(--cg-text-primary)" }}>
          Sign in to plan trips
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--cg-text-muted)" }}>
          Create and manage golf trips with your crew
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: "var(--cg-text-primary)" }}>
            EQ Trip Planner
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--cg-text-muted)" }}>
            Plan golf trips matched to your group's preferences
          </p>
        </div>
        <Link
          href="/trips/new"
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all"
          style={{ backgroundColor: "var(--cg-accent)", color: "var(--cg-text-inverse)" }}
        >
          <Plus className="h-4 w-4" /> New Trip
        </Link>
      </div>

      {/* Status filter pills */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className="rounded-full px-3 py-1 text-xs font-medium transition-all"
            style={{
              backgroundColor: statusFilter === f.value ? "var(--cg-accent)" : "var(--cg-bg-tertiary)",
              color: statusFilter === f.value ? "var(--cg-text-inverse)" : "var(--cg-text-secondary)",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--cg-accent)" }} />
        </div>
      ) : trips.length === 0 ? (
        <div
          className="rounded-xl p-8 text-center"
          style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
        >
          <MapPin className="mx-auto h-10 w-10" style={{ color: "var(--cg-text-muted)" }} />
          <h3 className="mt-3 font-display text-lg font-semibold" style={{ color: "var(--cg-text-primary)" }}>
            No trips yet
          </h3>
          <p className="mt-1 text-sm" style={{ color: "var(--cg-text-muted)" }}>
            Create your first golf trip to get started
          </p>
          <Link
            href="/trips/new"
            className="mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
            style={{ backgroundColor: "var(--cg-accent)", color: "var(--cg-text-inverse)" }}
          >
            <Plus className="h-4 w-4" /> Create Trip
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}
    </div>
  );
}
