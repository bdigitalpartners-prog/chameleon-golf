"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, ExternalLink } from "lucide-react";

function getAdminKey() {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("golfEQ_admin_key") || "";
}

const ERA_OPTIONS = ["Pioneer", "Golden Age", "Post-War", "Modern", "Contemporary"];

export default function ArchitectEditorPage() {
  const params = useParams();
  const router = useRouter();
  const architectId = params.id as string;

  const [architect, setArchitect] = useState<Record<string, any> | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchArchitect = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/architects/${architectId}`, {
        headers: { "x-admin-key": getAdminKey() },
      });
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();
      setArchitect(data);
      setForm({
        ...data,
        signatureCourses: (data.signatureCourses || []).join("\n"),
        notableFeatures: (data.notableFeatures || []).join("\n"),
      });
    } catch {
      setArchitect(null);
    } finally {
      setLoading(false);
    }
  }, [architectId]);

  useEffect(() => {
    fetchArchitect();
  }, [fetchArchitect]);

  const set = (field: string, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const payload: Record<string, any> = { ...form };

      // Convert arrays from newline-separated strings
      payload.signatureCourses = (payload.signatureCourses || "")
        .split("\n")
        .map((s: string) => s.trim())
        .filter(Boolean);
      payload.notableFeatures = (payload.notableFeatures || "")
        .split("\n")
        .map((s: string) => s.trim())
        .filter(Boolean);

      // Convert numeric fields
      if (payload.bornYear) payload.bornYear = parseInt(payload.bornYear);
      else payload.bornYear = null;
      if (payload.diedYear) payload.diedYear = parseInt(payload.diedYear);
      else payload.diedYear = null;
      if (payload.totalCoursesDesigned) payload.totalCoursesDesigned = parseInt(payload.totalCoursesDesigned);
      else payload.totalCoursesDesigned = null;

      const res = await fetch(`/api/admin/architects/${architectId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": getAdminKey(),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Save failed");
      }
      const updated = await res.json();
      setArchitect(updated);
      setForm({
        ...updated,
        signatureCourses: (updated.signatureCourses || []).join("\n"),
        notableFeatures: (updated.notableFeatures || []).join("\n"),
      });
      setMessage({ type: "success", text: "Architect saved successfully" });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-gray-500" size={32} />
      </div>
    );
  }

  if (!architect) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">Architect not found</p>
        <Link href="/admin/architects" className="text-[#22c55e] hover:underline mt-2 inline-block">
          Back to architects
        </Link>
      </div>
    );
  }

  const inputClass =
    "w-full px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-white text-sm focus:outline-none focus:border-[#22c55e]";
  const labelClass = "block text-xs text-gray-400 mb-1";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/architects" className="p-2 rounded-lg hover:bg-[#1a1a1a] text-gray-400">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{architect.name}</h1>
            <p className="text-sm text-gray-400">
              {[architect.nationality, architect.era ? `${architect.era} Era` : null].filter(Boolean).join(" · ")} · ID {architect.id}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/architects/${architect.slug}`}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#333] text-gray-300 hover:bg-[#1a1a1a] transition-colors"
          >
            <ExternalLink size={14} />
            View Profile
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#22c55e] text-black font-medium hover:bg-[#16a34a] disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-lg text-sm ${
          message.type === "success"
            ? "bg-green-900/30 border border-green-800 text-green-400"
            : "bg-red-900/30 border border-red-800 text-red-400"
        }`}>
          {message.text}
        </div>
      )}

      {/* Basic Info */}
      <div className="bg-[#111] border border-[#222] rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Basic Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className={labelClass}>Name</label>
            <input
              type="text"
              value={form.name || ""}
              onChange={(e) => set("name", e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Slug</label>
            <input
              type="text"
              value={form.slug || ""}
              onChange={(e) => set("slug", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Born Year</label>
            <input
              type="number"
              value={form.bornYear || ""}
              onChange={(e) => set("bornYear", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Died Year</label>
            <input
              type="number"
              value={form.diedYear || ""}
              onChange={(e) => set("diedYear", e.target.value)}
              className={inputClass}
              placeholder="Leave blank if living"
            />
          </div>
          <div>
            <label className={labelClass}>Nationality</label>
            <input
              type="text"
              value={form.nationality || ""}
              onChange={(e) => set("nationality", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Era</label>
            <select
              value={form.era || ""}
              onChange={(e) => set("era", e.target.value || null)}
              className={inputClass}
            >
              <option value="">Select era...</option>
              {ERA_OPTIONS.map((era) => (
                <option key={era} value={era}>{era}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Total Courses Designed</label>
            <input
              type="number"
              value={form.totalCoursesDesigned || ""}
              onChange={(e) => set("totalCoursesDesigned", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Image URL</label>
            <input
              type="url"
              value={form.imageUrl || ""}
              onChange={(e) => set("imageUrl", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Biography & Philosophy */}
      <div className="bg-[#111] border border-[#222] rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Biography & Philosophy</h2>
        <div>
          <label className={labelClass}>
            Biography
            <span className="text-gray-600 ml-2">
              ({(form.bio || "").split(/\s+/).filter(Boolean).length} words)
            </span>
          </label>
          <textarea
            rows={10}
            value={form.bio || ""}
            onChange={(e) => set("bio", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Design Philosophy</label>
          <textarea
            rows={3}
            value={form.designPhilosophy || ""}
            onChange={(e) => set("designPhilosophy", e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {/* Courses & Features */}
      <div className="bg-[#111] border border-[#222] rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Courses & Features</h2>
        <div>
          <label className={labelClass}>
            Signature Courses (one per line)
            <span className="text-gray-600 ml-2">
              ({(form.signatureCourses || "").split("\n").filter((s: string) => s.trim()).length} entries)
            </span>
          </label>
          <textarea
            rows={6}
            value={form.signatureCourses || ""}
            onChange={(e) => set("signatureCourses", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>
            Notable Design Features (one per line)
            <span className="text-gray-600 ml-2">
              ({(form.notableFeatures || "").split("\n").filter((s: string) => s.trim()).length} entries)
            </span>
          </label>
          <textarea
            rows={4}
            value={form.notableFeatures || ""}
            onChange={(e) => set("notableFeatures", e.target.value)}
            className={inputClass}
          />
        </div>
      </div>
    </div>
  );
}
