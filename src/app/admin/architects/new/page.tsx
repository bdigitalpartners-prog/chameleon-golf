"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

function getAdminKey() {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("golfEQ_admin_key") || "";
}

function toSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const ERA_OPTIONS = ["Pioneer", "Golden Age", "Post-War", "Modern", "Contemporary"];

export default function NewArchitectPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    slug: "",
    bornYear: "",
    diedYear: "",
    nationality: "",
    bio: "",
    designPhilosophy: "",
    signatureCourses: "",
    notableFeatures: "",
    era: "",
    totalCoursesDesigned: "",
    imageUrl: "",
    companyUrl: "",
    instagramUrl: "",
    twitterUrl: "",
    facebookUrl: "",
    tiktokUrl: "",
  });

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleNameChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      name: value,
      slug: prev.slug === toSlug(prev.name) || prev.slug === "" ? toSlug(value) : prev.slug,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Architect name is required");
      return;
    }
    if (!form.slug.trim()) {
      setError("Slug is required");
      return;
    }
    setSaving(true);
    setError("");

    try {
      const payload: Record<string, any> = {
        name: form.name,
        slug: form.slug,
      };

      if (form.bornYear) payload.bornYear = parseInt(form.bornYear);
      if (form.diedYear) payload.diedYear = parseInt(form.diedYear);
      if (form.nationality) payload.nationality = form.nationality;
      if (form.bio) payload.bio = form.bio;
      if (form.designPhilosophy) payload.designPhilosophy = form.designPhilosophy;
      if (form.signatureCourses.trim()) {
        payload.signatureCourses = form.signatureCourses.split("\n").map((s) => s.trim()).filter(Boolean);
      }
      if (form.notableFeatures.trim()) {
        payload.notableFeatures = form.notableFeatures.split("\n").map((s) => s.trim()).filter(Boolean);
      }
      if (form.era) payload.era = form.era;
      if (form.totalCoursesDesigned) payload.totalCoursesDesigned = parseInt(form.totalCoursesDesigned);
      if (form.imageUrl) payload.imageUrl = form.imageUrl;
      if (form.companyUrl) payload.companyUrl = form.companyUrl;
      if (form.instagramUrl) payload.instagramUrl = form.instagramUrl;
      if (form.twitterUrl) payload.twitterUrl = form.twitterUrl;
      if (form.facebookUrl) payload.facebookUrl = form.facebookUrl;
      if (form.tiktokUrl) payload.tiktokUrl = form.tiktokUrl;

      const res = await fetch("/api/admin/architects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": getAdminKey(),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create architect");
      }

      const architect = await res.json();
      router.push(`/admin/architects/${architect.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-white text-sm focus:outline-none focus:border-[#22c55e]";
  const labelClass = "block text-xs text-gray-400 mb-1";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/architects" className="p-2 rounded-lg hover:bg-[#1a1a1a] text-gray-400">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-white">Add New Architect</h1>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-900/30 border border-red-800 text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-[#111] border border-[#222] rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={labelClass}>Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className={inputClass}
                placeholder="e.g., Tom Fazio"
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Slug *</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => set("slug", e.target.value)}
                className={inputClass}
                placeholder="e.g., tom-fazio"
              />
            </div>
            <div>
              <label className={labelClass}>Born Year</label>
              <input
                type="number"
                value={form.bornYear}
                onChange={(e) => set("bornYear", e.target.value)}
                className={inputClass}
                placeholder="e.g., 1945"
              />
            </div>
            <div>
              <label className={labelClass}>Died Year</label>
              <input
                type="number"
                value={form.diedYear}
                onChange={(e) => set("diedYear", e.target.value)}
                className={inputClass}
                placeholder="Leave blank if living"
              />
            </div>
            <div>
              <label className={labelClass}>Nationality</label>
              <input
                type="text"
                value={form.nationality}
                onChange={(e) => set("nationality", e.target.value)}
                className={inputClass}
                placeholder="e.g., American"
              />
            </div>
            <div>
              <label className={labelClass}>Era</label>
              <select
                value={form.era}
                onChange={(e) => set("era", e.target.value)}
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
                value={form.totalCoursesDesigned}
                onChange={(e) => set("totalCoursesDesigned", e.target.value)}
                className={inputClass}
                placeholder="Approximate number"
              />
            </div>
            <div>
              <label className={labelClass}>Image URL</label>
              <input
                type="url"
                value={form.imageUrl}
                onChange={(e) => set("imageUrl", e.target.value)}
                className={inputClass}
                placeholder="https://..."
              />
            </div>
            <div>
              <label className={labelClass}>Company URL</label>
              <input
                type="url"
                value={form.companyUrl}
                onChange={(e) => set("companyUrl", e.target.value)}
                className={inputClass}
                placeholder="https://..."
              />
            </div>
          </div>
        </div>

        <div className="bg-[#111] border border-[#222] rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Biography & Philosophy</h2>
          <div>
            <label className={labelClass}>Biography (200-300 words)</label>
            <textarea
              rows={8}
              value={form.bio}
              onChange={(e) => set("bio", e.target.value)}
              className={inputClass}
              placeholder="Detailed biography of the architect..."
            />
          </div>
          <div>
            <label className={labelClass}>Design Philosophy (2-3 sentences)</label>
            <textarea
              rows={3}
              value={form.designPhilosophy}
              onChange={(e) => set("designPhilosophy", e.target.value)}
              className={inputClass}
              placeholder="What defines their design approach..."
            />
          </div>
        </div>

        <div className="bg-[#111] border border-[#222] rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Social Links</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Instagram URL</label>
              <input type="url" value={form.instagramUrl || ""} onChange={(e) => set("instagramUrl", e.target.value)} placeholder="https://instagram.com/..." className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Twitter / X URL</label>
              <input type="url" value={form.twitterUrl || ""} onChange={(e) => set("twitterUrl", e.target.value)} placeholder="https://x.com/..." className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Facebook URL</label>
              <input type="url" value={form.facebookUrl || ""} onChange={(e) => set("facebookUrl", e.target.value)} placeholder="https://facebook.com/..." className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>TikTok URL</label>
              <input type="url" value={form.tiktokUrl || ""} onChange={(e) => set("tiktokUrl", e.target.value)} placeholder="https://tiktok.com/@..." className={inputClass} />
            </div>
          </div>
        </div>

        <div className="bg-[#111] border border-[#222] rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Courses & Features</h2>
          <div>
            <label className={labelClass}>Signature Courses (one per line)</label>
            <textarea
              rows={5}
              value={form.signatureCourses}
              onChange={(e) => set("signatureCourses", e.target.value)}
              className={inputClass}
              placeholder={"Augusta National Golf Club\nCypress Point Club\nRoyal Melbourne Golf Club"}
            />
          </div>
          <div>
            <label className={labelClass}>Notable Design Features (one per line)</label>
            <textarea
              rows={4}
              value={form.notableFeatures}
              onChange={(e) => set("notableFeatures", e.target.value)}
              className={inputClass}
              placeholder={"Strategic bunkering\nNatural contours\nDramatic green complexes"}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#22c55e] text-black font-medium hover:bg-[#16a34a] disabled:opacity-50 transition-colors"
          >
            <Save size={16} />
            {saving ? "Creating..." : "Create Architect"}
          </button>
        </div>
      </form>
    </div>
  );
}
