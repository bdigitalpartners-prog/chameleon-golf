"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  Plus,
  X,
  Calendar,
  MapPin,
  Users,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const EVENT_TYPES = [
  { key: "TEE_TIME", label: "Tee Time" },
  { key: "TOURNAMENT", label: "Tournament" },
  { key: "SOCIAL", label: "Social" },
  { key: "MEMBER_GUEST", label: "Member-Guest" },
  { key: "COURSE_OUTING", label: "Course Outing" },
];

const RSVP_STYLES: Record<string, { bg: string; text: string }> = {
  GOING: { bg: "rgba(34,197,94,0.1)", text: "#22c55e" },
  MAYBE: { bg: "rgba(245,158,11,0.1)", text: "#f59e0b" },
  DECLINED: { bg: "rgba(239,68,68,0.1)", text: "#ef4444" },
};

interface EventData {
  id: string;
  title: string;
  description: string | null;
  eventType: string;
  startDate: string;
  endDate: string | null;
  location: string | null;
  maxAttendees: number | null;
  course: { courseId: number; courseName: string } | null;
  createdBy: { id: string; name: string; image: string | null };
  rsvpCounts: { going: number; maybe: number; declined: number };
  userRsvp: { status: string; guestCount: number } | null;
}

export function CircleEventsTab({ circleId, isAdmin }: { circleId: string; isAdmin: boolean }) {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [rsvpLoading, setRsvpLoading] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    eventType: "TEE_TIME",
    startDate: "",
    endDate: "",
    maxAttendees: "",
    location: "",
  });

  useEffect(() => {
    fetchEvents();
  }, [circleId, page]);

  const fetchEvents = () => {
    setLoading(true);
    fetch(`/api/circles/${circleId}/events?upcoming=true&page=${page}&limit=10`)
      .then((r) => r.json())
      .then((data) => {
        setEvents(data.events ?? []);
        setTotalPages(data.totalPages ?? 1);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const handleCreate = async () => {
    if (!form.title || !form.startDate) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/circles/${circleId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description || null,
          eventType: form.eventType,
          startDate: new Date(form.startDate).toISOString(),
          endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
          maxAttendees: form.maxAttendees ? Number(form.maxAttendees) : null,
          location: form.location || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create event");
      setShowForm(false);
      setForm({ title: "", description: "", eventType: "TEE_TIME", startDate: "", endDate: "", maxAttendees: "", location: "" });
      fetchEvents();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRSVP = async (eventId: string, status: string) => {
    setRsvpLoading(eventId);
    try {
      const res = await fetch(`/api/circles/${circleId}/events/${eventId}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) fetchEvents();
    } catch (err) {
      console.error(err);
    } finally {
      setRsvpLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold" style={{ color: "var(--cg-text-primary)" }}>
          Upcoming Events
        </h3>
        {isAdmin && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium"
            style={{ backgroundColor: "var(--cg-accent)", color: "var(--cg-text-inverse)" }}
          >
            {showForm ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
            {showForm ? "Cancel" : "New Event"}
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg p-3 text-sm" style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "var(--cg-status-error, #ef4444)" }}>
          {error}
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div
          className="rounded-xl p-4 space-y-3"
          style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
        >
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Event title"
            className="w-full rounded-lg px-3 py-2 text-sm"
            style={{ backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-text-primary)", border: "1px solid var(--cg-border)" }}
          />
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Description (optional)"
            rows={2}
            className="w-full rounded-lg px-3 py-2 text-sm resize-none"
            style={{ backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-text-primary)", border: "1px solid var(--cg-border)" }}
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--cg-text-muted)" }}>
                Type
              </label>
              <select
                value={form.eventType}
                onChange={(e) => setForm({ ...form, eventType: e.target.value })}
                className="w-full rounded-lg px-3 py-2 text-sm"
                style={{ backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-text-primary)", border: "1px solid var(--cg-border)" }}
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--cg-text-muted)" }}>
                Max Attendees
              </label>
              <input
                type="number"
                value={form.maxAttendees}
                onChange={(e) => setForm({ ...form, maxAttendees: e.target.value })}
                placeholder="Unlimited"
                className="w-full rounded-lg px-3 py-2 text-sm"
                style={{ backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-text-primary)", border: "1px solid var(--cg-border)" }}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--cg-text-muted)" }}>
                Start Date/Time
              </label>
              <input
                type="datetime-local"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full rounded-lg px-3 py-2 text-sm"
                style={{ backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-text-primary)", border: "1px solid var(--cg-border)" }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--cg-text-muted)" }}>
                End Date/Time
              </label>
              <input
                type="datetime-local"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full rounded-lg px-3 py-2 text-sm"
                style={{ backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-text-primary)", border: "1px solid var(--cg-border)" }}
              />
            </div>
          </div>
          <input
            type="text"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="Location (optional)"
            className="w-full rounded-lg px-3 py-2 text-sm"
            style={{ backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-text-primary)", border: "1px solid var(--cg-border)" }}
          />
          <button
            onClick={handleCreate}
            disabled={submitting || !form.title || !form.startDate}
            className="w-full rounded-lg py-2 text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: "var(--cg-accent)", color: "var(--cg-text-inverse)" }}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Create Event"}
          </button>
        </div>
      )}

      {/* Events list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--cg-accent)" }} />
        </div>
      ) : events.length === 0 ? (
        <div
          className="rounded-xl p-8 text-center"
          style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
        >
          <Calendar className="mx-auto h-10 w-10 mb-2" style={{ color: "var(--cg-text-muted)" }} />
          <p className="text-sm" style={{ color: "var(--cg-text-muted)" }}>
            No upcoming events.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => {
            const eventTypeLabel = EVENT_TYPES.find((t) => t.key === event.eventType)?.label ?? event.eventType;
            const startDate = new Date(event.startDate);
            const userStatus = event.userRsvp?.status;

            return (
              <div
                key={event.id}
                className="rounded-xl p-4"
                style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-sm font-semibold" style={{ color: "var(--cg-text-primary)" }}>
                      {event.title}
                    </h4>
                    <span
                      className="inline-block text-xs font-medium rounded-full px-2 py-0.5 mt-1"
                      style={{ backgroundColor: "var(--cg-accent-bg)", color: "var(--cg-accent)" }}
                    >
                      {eventTypeLabel}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold" style={{ color: "var(--cg-accent)" }}>
                      {startDate.getDate()}
                    </p>
                    <p className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
                      {startDate.toLocaleDateString("en-US", { month: "short" })}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 text-xs mb-3" style={{ color: "var(--cg-text-muted)" }}>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {startDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                  </span>
                  {(event.location || event.course) && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {event.course?.courseName ?? event.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {event.rsvpCounts.going} going
                    {event.maxAttendees ? ` / ${event.maxAttendees}` : ""}
                  </span>
                </div>

                {event.description && (
                  <p className="text-sm mb-3" style={{ color: "var(--cg-text-secondary)" }}>
                    {event.description.slice(0, 120)}
                    {event.description.length > 120 ? "..." : ""}
                  </p>
                )}

                {/* RSVP buttons */}
                <div className="flex gap-2">
                  {(["GOING", "MAYBE", "DECLINED"] as const).map((status) => {
                    const style = RSVP_STYLES[status];
                    const isSelected = userStatus === status;
                    return (
                      <button
                        key={status}
                        onClick={() => handleRSVP(event.id, status)}
                        disabled={rsvpLoading === event.id}
                        className="flex-1 rounded-lg py-1.5 text-xs font-medium transition-all disabled:opacity-50"
                        style={{
                          backgroundColor: isSelected ? style.bg : "var(--cg-bg-tertiary)",
                          color: isSelected ? style.text : "var(--cg-text-muted)",
                          border: `1px solid ${isSelected ? style.text : "var(--cg-border)"}`,
                        }}
                      >
                        {status === "GOING" ? "Going" : status === "MAYBE" ? "Maybe" : "Decline"}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="rounded-lg px-3 py-1.5 text-sm disabled:opacity-50"
            style={{ backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-text-secondary)" }}
          >
            Previous
          </button>
          <span className="flex items-center text-sm" style={{ color: "var(--cg-text-muted)" }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="rounded-lg px-3 py-1.5 text-sm disabled:opacity-50"
            style={{ backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-text-secondary)" }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
