"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import {
  Loader2,
  ThumbsUp,
  ThumbsDown,
  MapPin,
  Calendar,
  Trash2,
  Plus,
} from "lucide-react";

interface TripCourse {
  id: string;
  courseId: number;
  playDate: string | null;
  teeTime: string | null;
  playOrder: number;
  confirmed: boolean;
  notes: string | null;
  course: {
    courseId: number;
    courseName: string;
    city: string;
    state: string;
    accessType: string | null;
    latitude: number | null;
    longitude: number | null;
  };
  circleAvgScore: number | null;
  circleRatingCount: number;
  votes: { up: number; down: number; userVote?: number };
}

interface TripDetail {
  id: string;
  title: string;
  destination: string | null;
  startDate: string | null;
  endDate: string | null;
  status: string;
  notes: string | null;
  creator: { id: string; name: string; image: string | null };
  courses: TripCourse[];
  members: { id: string; name: string; image: string | null }[];
}

export default function TripDetailPage() {
  const { data: session, status: authStatus } = useSession();
  const params = useParams();
  const circleId = params.id as string;
  const tripId = params.tripId as string;
  const userId = (session?.user as any)?.id;

  const [loading, setLoading] = useState(true);
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [addingCourse, setAddingCourse] = useState(false);
  const [courseIdInput, setCourseIdInput] = useState("");

  const fetchTrip = () => {
    fetch(`/api/circles/${circleId}/trips/${tripId}`)
      .then((r) => r.json())
      .then((data) => setTrip(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    fetchTrip();
  }, [authStatus, circleId, tripId]);

  const handleVote = async (courseId: number, vote: number) => {
    await fetch(`/api/circles/${circleId}/trips/${tripId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, vote }),
    });
    fetchTrip();
  };

  const handleRemoveCourse = async (courseId: number) => {
    await fetch(`/api/circles/${circleId}/trips/${tripId}/courses/${courseId}`, {
      method: "DELETE",
    });
    fetchTrip();
  };

  const handleAddCourse = async () => {
    const cid = parseInt(courseIdInput, 10);
    if (isNaN(cid)) return;
    setAddingCourse(true);
    try {
      await fetch(`/api/circles/${circleId}/trips/${tripId}/courses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: cid }),
      });
      setCourseIdInput("");
      fetchTrip();
    } catch (err) {
      console.error(err);
    } finally {
      setAddingCourse(false);
    }
  };

  if (authStatus === "loading" || loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--cg-accent)" }} />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center" style={{ color: "var(--cg-text-muted)" }}>
        Trip not found.
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
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="font-display text-2xl font-bold" style={{ color: "var(--cg-text-primary)" }}>
            {trip.title}
          </h1>
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
        <div className="flex items-center gap-4 text-sm" style={{ color: "var(--cg-text-muted)" }}>
          {trip.destination && (
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {trip.destination}
            </span>
          )}
          {trip.startDate && (
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(trip.startDate).toLocaleDateString()}
              {trip.endDate && ` – ${new Date(trip.endDate).toLocaleDateString()}`}
            </span>
          )}
        </div>
        {trip.notes && (
          <p className="text-sm mt-2" style={{ color: "var(--cg-text-secondary)" }}>
            {trip.notes}
          </p>
        )}
      </div>

      {/* Courses */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold" style={{ color: "var(--cg-text-primary)" }}>
            Courses ({trip.courses.length})
          </h2>
        </div>

        {trip.courses.length === 0 ? (
          <div
            className="rounded-xl p-6 text-center"
            style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
          >
            <p className="text-sm" style={{ color: "var(--cg-text-muted)" }}>
              No courses added yet. Add courses to start planning your itinerary.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {trip.courses.map((tc) => (
              <div
                key={tc.id}
                className="rounded-xl p-4"
                style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold" style={{ color: "var(--cg-text-primary)" }}>
                      {tc.course.courseName}
                    </h3>
                    <p className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
                      {tc.course.city}, {tc.course.state}
                      {tc.course.accessType && ` · ${tc.course.accessType}`}
                    </p>
                    {tc.circleAvgScore !== null && (
                      <p className="text-xs mt-1" style={{ color: "var(--cg-accent)" }}>
                        Circle avg: {tc.circleAvgScore.toFixed(1)} ({tc.circleRatingCount} ratings)
                      </p>
                    )}
                    {tc.playDate && (
                      <p className="text-xs mt-1" style={{ color: "var(--cg-text-secondary)" }}>
                        {new Date(tc.playDate).toLocaleDateString()}
                        {tc.teeTime && ` at ${tc.teeTime}`}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Vote buttons */}
                    <button
                      onClick={() => handleVote(tc.courseId, 1)}
                      className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition-colors"
                      style={{
                        backgroundColor: tc.votes.userVote === 1 ? "#22c55e20" : "var(--cg-bg-tertiary)",
                        color: tc.votes.userVote === 1 ? "#22c55e" : "var(--cg-text-muted)",
                      }}
                    >
                      <ThumbsUp className="h-3 w-3" />
                      {tc.votes.up}
                    </button>
                    <button
                      onClick={() => handleVote(tc.courseId, -1)}
                      className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition-colors"
                      style={{
                        backgroundColor: tc.votes.userVote === -1 ? "#ef444420" : "var(--cg-bg-tertiary)",
                        color: tc.votes.userVote === -1 ? "#ef4444" : "var(--cg-text-muted)",
                      }}
                    >
                      <ThumbsDown className="h-3 w-3" />
                      {tc.votes.down}
                    </button>
                    <button
                      onClick={() => handleRemoveCourse(tc.courseId)}
                      className="rounded-lg p-1 transition-colors"
                      style={{ color: "var(--cg-text-muted)" }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add course */}
        <div className="mt-3 flex gap-2">
          <input
            type="number"
            placeholder="Course ID"
            value={courseIdInput}
            onChange={(e) => setCourseIdInput(e.target.value)}
            className="flex-1 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
            style={{ backgroundColor: "var(--cg-bg-secondary)", color: "var(--cg-text-primary)", border: "1px solid var(--cg-border)" }}
          />
          <button
            onClick={handleAddCourse}
            disabled={addingCourse || !courseIdInput}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium"
            style={{ backgroundColor: "var(--cg-accent)", color: "var(--cg-text-inverse)", opacity: addingCourse ? 0.7 : 1 }}
          >
            {addingCourse ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add
          </button>
        </div>
      </div>

      {/* Members */}
      <div
        className="rounded-xl p-4"
        style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
      >
        <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--cg-text-primary)" }}>
          Circle Members ({trip.members.length})
        </h2>
        <div className="flex flex-wrap gap-2">
          {trip.members.map((m) => (
            <div key={m.id} className="flex items-center gap-2">
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  backgroundColor: m.image ? "transparent" : "var(--cg-accent-muted)",
                  color: "var(--cg-accent)",
                  backgroundImage: m.image ? `url(${m.image})` : undefined,
                  backgroundSize: "cover",
                }}
              >
                {!m.image && (m.name?.[0]?.toUpperCase() || "?")}
              </div>
              <span className="text-xs" style={{ color: "var(--cg-text-secondary)" }}>
                {m.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
