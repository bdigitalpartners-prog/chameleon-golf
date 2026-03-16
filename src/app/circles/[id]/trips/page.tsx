"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Plus, MapPin, Calendar, Users, ChevronRight } from "lucide-react";

interface Trip {
  id: string;
  title: string;
  destination: string | null;
  startDate: string | null;
  endDate: string | null;
  status: string;
  courseCount: number;
  voterCount: number;
  creator: { id: string; name: string; image: string | null };
  createdAt: string;
}

export default function CircleTripsPage() {
  const { data: session, status: authStatus } = useSession();
  const params = useParams();
  const router = useRouter();
  const circleId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: "", destination: "", startDate: "", endDate: "", notes: "" });

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    fetch(`/api/circles/${circleId}/trips?limit=50`)
      .then((r) => r.json())
      .then((data) => setTrips(data.trips || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [authStatus, circleId]);

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(`/api/circles/${circleId}/trips`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          destination: form.destination || undefined,
          startDate: form.startDate || undefined,
          endDate: form.endDate || undefined,
          notes: form.notes || undefined,
        }),
      });
      if (res.ok) {
        const trip = await res.json();
        router.push(`/circles/${circleId}/trips/${trip.id}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  if (authStatus === "loading" || loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--cg-accent)" }} />
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    PLANNING: "var(--cg-accent)",
    CONFIRMED: "#22c55e",
    COMPLETED: "var(--cg-text-muted)",
    CANCELLED: "#ef4444",
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: "var(--cg-text-primary)" }}>
            Trip Planner
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--cg-text-muted)" }}>
            Plan golf trips with your circle
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
          style={{ backgroundColor: "var(--cg-accent)", color: "var(--cg-text-inverse)" }}
        >
          <Plus className="h-4 w-4" />
          New Trip
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div
          className="rounded-xl p-5 mb-6 space-y-4"
          style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
        >
          <h2 className="text-sm font-semibold" style={{ color: "var(--cg-text-primary)" }}>
            Create Trip
          </h2>
          <input
            type="text"
            placeholder="Trip title *"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
            style={{ backgroundColor: "var(--cg-bg-secondary)", color: "var(--cg-text-primary)", border: "1px solid var(--cg-border)" }}
          />
          <input
            type="text"
            placeholder="Destination (e.g. Scottsdale, AZ)"
            value={form.destination}
            onChange={(e) => setForm({ ...form, destination: e.target.value })}
            className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
            style={{ backgroundColor: "var(--cg-bg-secondary)", color: "var(--cg-text-primary)", border: "1px solid var(--cg-border)" }}
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1" style={{ color: "var(--cg-text-muted)" }}>Start Date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
                style={{ backgroundColor: "var(--cg-bg-secondary)", color: "var(--cg-text-primary)", border: "1px solid var(--cg-border)" }}
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: "var(--cg-text-muted)" }}>End Date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
                style={{ backgroundColor: "var(--cg-bg-secondary)", color: "var(--cg-text-primary)", border: "1px solid var(--cg-border)" }}
              />
            </div>
          </div>
          <textarea
            placeholder="Notes (optional)"
            rows={2}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2"
            style={{ backgroundColor: "var(--cg-bg-secondary)", color: "var(--cg-text-primary)", border: "1px solid var(--cg-border)" }}
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowCreate(false)}
              className="rounded-lg px-4 py-2 text-sm"
              style={{ color: "var(--cg-text-secondary)" }}
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={creating || !form.title.trim()}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
              style={{ backgroundColor: "var(--cg-accent)", color: "var(--cg-text-inverse)", opacity: creating ? 0.7 : 1 }}
            >
              {creating && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Trip
            </button>
          </div>
        </div>
      )}

      {/* Trip list */}
      {trips.length === 0 ? (
        <div
          className="rounded-xl p-8 text-center"
          style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
        >
          <p style={{ color: "var(--cg-text-muted)" }}>
            No trips planned yet. Create your first golf trip!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {trips.map((trip) => (
            <div
              key={trip.id}
              onClick={() => router.push(`/circles/${circleId}/trips/${trip.id}`)}
              className="rounded-xl p-4 cursor-pointer transition-all hover:shadow-md"
              style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold" style={{ color: "var(--cg-text-primary)" }}>
                      {trip.title}
                    </h3>
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: `${statusColors[trip.status] || "var(--cg-text-muted)"}20`,
                        color: statusColors[trip.status] || "var(--cg-text-muted)",
                      }}
                    >
                      {trip.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs" style={{ color: "var(--cg-text-muted)" }}>
                    {trip.destination && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {trip.destination}
                      </span>
                    )}
                    {trip.startDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(trip.startDate).toLocaleDateString()}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      {trip.courseCount} course{trip.courseCount !== 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {trip.voterCount} voter{trip.voterCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5" style={{ color: "var(--cg-text-muted)" }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
