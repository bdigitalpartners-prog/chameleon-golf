"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Sprout,
  AlertTriangle,
  Calendar,
  MapPin,
  Clock,
  ChevronLeft,
  ChevronRight,
  Plus,
  Loader2,
  X,
  CheckCircle2,
} from "lucide-react";

/* ─── Types ─────────────────────────────────── */
interface Aeration {
  id: number;
  course_id: number;
  course_name: string;
  city: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
  aeration_type: string;
  start_date: string | null;
  end_date: string | null;
  recovery_weeks: number | null;
  source: string;
  reporter_name: string | null;
  is_verified: boolean;
  notes: string | null;
  created_at: string;
}

/* ─── Helpers ───────────────────────────────── */
function aerationTypeLabel(type: string) {
  const map: Record<string, string> = {
    greens: "Greens",
    fairways: "Fairways",
    tees: "Tees",
    full_course: "Full Course",
  };
  return map[type] || type;
}

function aerationTypeBadgeColor(type: string) {
  const map: Record<string, string> = {
    greens: "bg-red-500/10 text-red-400 border-red-500/30",
    fairways: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
    tees: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    full_course: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  };
  return map[type] || "bg-[#333]/10 text-[#9CA3AF] border-[#333]";
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* ─── Aeration Card ─────────────────────────── */
function AerationCard({ aeration }: { aeration: Aeration }) {
  const isActive =
    aeration.start_date &&
    new Date(aeration.start_date) <= new Date() &&
    (!aeration.end_date || new Date(aeration.end_date) >= new Date());

  return (
    <div
      className={`bg-[#111111] border rounded-xl p-4 transition-colors ${
        isActive
          ? "border-yellow-500/40 hover:border-yellow-500/60"
          : "border-[#222222] hover:border-[#00FF85]/30"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-white font-semibold text-sm truncate">
              {aeration.course_name || `Course #${aeration.course_id}`}
            </h3>
            {isActive && (
              <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 whitespace-nowrap">
                <AlertTriangle className="w-2.5 h-2.5" />
                Active
              </span>
            )}
          </div>
          {aeration.city && aeration.state && (
            <div className="flex items-center gap-1 text-xs text-[#9CA3AF] mt-0.5">
              <MapPin className="w-3 h-3" />
              {aeration.city}, {aeration.state}
            </div>
          )}
        </div>
        <span
          className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${aerationTypeBadgeColor(aeration.aeration_type)}`}
        >
          {aerationTypeLabel(aeration.aeration_type)}
        </span>
      </div>

      {/* Details */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="p-2 rounded-lg bg-[#1a1a1a]">
          <div className="text-[10px] text-[#9CA3AF]">Start</div>
          <div className="text-xs text-white">
            {formatDate(aeration.start_date)}
          </div>
        </div>
        <div className="p-2 rounded-lg bg-[#1a1a1a]">
          <div className="text-[10px] text-[#9CA3AF]">End</div>
          <div className="text-xs text-white">
            {formatDate(aeration.end_date)}
          </div>
        </div>
        <div className="p-2 rounded-lg bg-[#1a1a1a]">
          <div className="text-[10px] text-[#9CA3AF]">Recovery</div>
          <div className="text-xs text-white">
            {aeration.recovery_weeks
              ? `${aeration.recovery_weeks} weeks`
              : "—"}
          </div>
        </div>
      </div>

      {/* Notes */}
      {aeration.notes && (
        <p className="text-xs text-[#ccc] mb-2 line-clamp-2">
          {aeration.notes}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center gap-3 text-[10px] text-[#9CA3AF]">
        {aeration.is_verified && (
          <span className="flex items-center gap-1 text-[#00FF85]">
            <CheckCircle2 className="w-3 h-3" />
            Verified
          </span>
        )}
        <span>Source: {aeration.source?.replace(/_/g, " ") || "User"}</span>
        {aeration.reporter_name && (
          <span>by {aeration.reporter_name}</span>
        )}
      </div>
    </div>
  );
}

/* ─── Report Form Modal ─────────────────────── */
function AerationFormModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const [courseId, setCourseId] = useState("");
  const [aerationType, setAerationType] = useState("greens");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [recoveryWeeks, setRecoveryWeeks] = useState("");
  const [source, setSource] = useState("user_report");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!courseId) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/aeration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: Number(courseId),
          aerationType,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          recoveryWeeks: recoveryWeeks ? Number(recoveryWeeks) : undefined,
          source,
          notes: notes || undefined,
        }),
      });
      if (res.ok) {
        onSubmit();
        onClose();
        setCourseId("");
        setAerationType("greens");
        setStartDate("");
        setEndDate("");
        setRecoveryWeeks("");
        setSource("user_report");
        setNotes("");
      }
    } catch (err) {
      console.error("Submit failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-white text-sm focus:border-[#00FF85] focus:outline-none";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#111] border border-[#222] rounded-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b border-[#222]">
          <h3 className="text-lg font-bold text-white">Report Aeration</h3>
          <button
            onClick={onClose}
            className="text-[#9CA3AF] hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs text-[#9CA3AF] mb-1 block">
              Course ID
            </label>
            <input
              type="number"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              placeholder="Enter course ID"
              className={inputClass}
            />
          </div>

          <div>
            <label className="text-xs text-[#9CA3AF] mb-1 block">
              Aeration Type
            </label>
            <select
              value={aerationType}
              onChange={(e) => setAerationType(e.target.value)}
              className={inputClass}
            >
              <option value="greens">Greens</option>
              <option value="fairways">Fairways</option>
              <option value="tees">Tees</option>
              <option value="full_course">Full Course</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#9CA3AF] mb-1 block">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs text-[#9CA3AF] mb-1 block">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#9CA3AF] mb-1 block">
                Recovery Weeks
              </label>
              <input
                type="number"
                value={recoveryWeeks}
                onChange={(e) => setRecoveryWeeks(e.target.value)}
                placeholder="e.g. 4"
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs text-[#9CA3AF] mb-1 block">
                Source
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className={inputClass}
              >
                <option value="user_report">I Saw It</option>
                <option value="course_website">Course Website</option>
                <option value="social_media">Social Media</option>
                <option value="phone_call">Phone Call</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-[#9CA3AF] mb-1 block">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any details..."
              rows={2}
              className={inputClass + " resize-none"}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!courseId || submitting}
            className="w-full py-2.5 rounded-lg bg-[#00FF85] text-black font-semibold text-sm disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Submit Report
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Calendar Navigation ───────────────────── */
function MonthNav({
  month,
  onChange,
}: {
  month: string;
  onChange: (m: string) => void;
}) {
  const [year, mon] = month.split("-").map(Number);
  const date = new Date(year, mon - 1, 1);
  const label = date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const prev = () => {
    const d = new Date(year, mon - 2, 1);
    onChange(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    );
  };
  const next = () => {
    const d = new Date(year, mon, 1);
    onChange(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    );
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={prev}
        className="p-1 rounded hover:bg-[#222] text-[#9CA3AF] hover:text-white transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-sm text-white font-medium min-w-[140px] text-center">
        {label}
      </span>
      <button
        onClick={next}
        className="p-1 rounded hover:bg-[#222] text-[#9CA3AF] hover:text-white transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

/* ─── Main Tracker ──────────────────────────── */
export function AerationTracker() {
  const { data: session } = useSession();
  const [activeAerations, setActiveAerations] = useState<Aeration[]>([]);
  const [calendarAerations, setCalendarAerations] = useState<Aeration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState<"active" | "calendar">("active");

  const now = new Date();
  const [month, setMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  );

  const fetchActive = useCallback(async () => {
    try {
      const res = await fetch("/api/aeration/active?limit=50");
      const data = await res.json();
      setActiveAerations(data.active || []);
    } catch (err) {
      console.error("Failed to fetch active aerations:", err);
    }
  }, []);

  const fetchCalendar = useCallback(async () => {
    try {
      const res = await fetch(`/api/aeration/calendar?month=${month}`);
      const data = await res.json();
      setCalendarAerations(data.aerations || []);
    } catch (err) {
      console.error("Failed to fetch calendar aerations:", err);
    }
  }, [month]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchActive(), fetchCalendar()]).finally(() =>
      setLoading(false)
    );
  }, [fetchActive, fetchCalendar]);

  const currentList =
    tab === "active" ? activeAerations : calendarAerations;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Hero */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
              <Sprout className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                Aeration Tracker
              </h1>
              <p className="text-[#9CA3AF] text-sm">
                Know which courses are aerating before you book.
              </p>
            </div>
          </div>
          {session && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#00FF85] text-black font-semibold text-sm hover:bg-[#00FF85]/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Report Aeration
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 mb-6 border-b border-[#222]">
        <button
          onClick={() => setTab("active")}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
            tab === "active"
              ? "text-[#00FF85] border-[#00FF85]"
              : "text-[#9CA3AF] border-transparent hover:text-white"
          }`}
        >
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Active Now
            {activeAerations.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 text-[10px] font-bold">
                {activeAerations.length}
              </span>
            )}
          </span>
        </button>
        <button
          onClick={() => setTab("calendar")}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
            tab === "calendar"
              ? "text-[#00FF85] border-[#00FF85]"
              : "text-[#9CA3AF] border-transparent hover:text-white"
          }`}
        >
          <span className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Calendar
          </span>
        </button>

        {tab === "calendar" && (
          <div className="ml-auto">
            <MonthNav month={month} onChange={setMonth} />
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-[#111111] border border-[#222222] rounded-xl p-4 animate-pulse"
            >
              <div className="h-5 w-40 bg-[#222] rounded mb-2" />
              <div className="h-3 w-28 bg-[#222] rounded mb-4" />
              <div className="grid grid-cols-3 gap-2">
                <div className="h-10 bg-[#1a1a1a] rounded" />
                <div className="h-10 bg-[#1a1a1a] rounded" />
                <div className="h-10 bg-[#1a1a1a] rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : currentList.length === 0 ? (
        <div className="bg-[#111111] border border-[#222222] rounded-xl p-8 text-center">
          <Sprout className="w-12 h-12 text-[#333] mx-auto mb-3" />
          <h3 className="text-white font-semibold mb-1">
            {tab === "active"
              ? "No active aerations"
              : "No aerations this month"}
          </h3>
          <p className="text-sm text-[#9CA3AF] mb-4">
            {tab === "active"
              ? "Great news — no courses in our database are currently aerating."
              : "No aeration reports for this month yet."}
          </p>
          {session && (
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 rounded-lg bg-[#00FF85] text-black font-semibold text-sm"
            >
              Report Aeration
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentList.map((aeration) => (
            <AerationCard key={aeration.id} aeration={aeration} />
          ))}
        </div>
      )}

      {/* Report Form */}
      <AerationFormModal
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={() => {
          fetchActive();
          fetchCalendar();
        }}
      />
    </div>
  );
}
