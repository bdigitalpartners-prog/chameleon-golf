"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

function getAdminKey() {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("golfEQ_admin_key") || "";
}

export default function NewCoursePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    courseName: "",
    facilityName: "",
    streetAddress: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States",
    courseType: "",
    accessType: "",
    numHoles: 18,
    par: "",
    yearOpened: "",
    originalArchitect: "",
    websiteUrl: "",
    phone: "",
    email: "",
    greenFeeLow: "",
    greenFeeHigh: "",
    description: "",
  });

  const set = (field: string, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.courseName.trim()) {
      setError("Course name is required");
      return;
    }
    setSaving(true);
    setError("");

    try {
      const payload: Record<string, any> = { ...form };
      // Convert numeric fields
      if (payload.par) payload.par = parseInt(payload.par);
      else delete payload.par;
      if (payload.yearOpened) payload.yearOpened = parseInt(payload.yearOpened);
      else delete payload.yearOpened;
      if (payload.greenFeeLow) payload.greenFeeLow = parseFloat(payload.greenFeeLow);
      else delete payload.greenFeeLow;
      if (payload.greenFeeHigh) payload.greenFeeHigh = parseFloat(payload.greenFeeHigh);
      else delete payload.greenFeeHigh;
      // Remove empty strings
      for (const key of Object.keys(payload)) {
        if (payload[key] === "") delete payload[key];
      }

      const res = await fetch("/api/admin/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": getAdminKey(),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create course");
      }

      const course = await res.json();
      router.push(`/admin/courses/${course.courseId}`);
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
        <Link href="/admin/courses" className="p-2 rounded-lg hover:bg-[#1a1a1a] text-gray-400">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-white">Add New Course</h1>
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
              <label className={labelClass}>Course Name *</label>
              <input type="text" value={form.courseName} onChange={(e) => set("courseName", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Facility Name</label>
              <input type="text" value={form.facilityName} onChange={(e) => set("facilityName", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Original Architect</label>
              <input type="text" value={form.originalArchitect} onChange={(e) => set("originalArchitect", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Street Address</label>
              <input type="text" value={form.streetAddress} onChange={(e) => set("streetAddress", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>City</label>
              <input type="text" value={form.city} onChange={(e) => set("city", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>State</label>
              <input type="text" value={form.state} onChange={(e) => set("state", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Zip Code</label>
              <input type="text" value={form.zipCode} onChange={(e) => set("zipCode", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Country</label>
              <input type="text" value={form.country} onChange={(e) => set("country", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Course Type</label>
              <select value={form.courseType} onChange={(e) => set("courseType", e.target.value)} className={inputClass}>
                <option value="">Select...</option>
                <option value="Regulation">Regulation</option>
                <option value="Links">Links</option>
                <option value="Parkland">Parkland</option>
                <option value="Desert">Desert</option>
                <option value="Mountain">Mountain</option>
                <option value="Executive">Executive</option>
                <option value="Par-3">Par-3</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Access Type</label>
              <select value={form.accessType} onChange={(e) => set("accessType", e.target.value)} className={inputClass}>
                <option value="">Select...</option>
                <option value="Public">Public</option>
                <option value="Private">Private</option>
                <option value="Resort">Resort</option>
                <option value="Semi-Private">Semi-Private</option>
                <option value="Military">Military</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Number of Holes</label>
              <input type="number" value={form.numHoles} onChange={(e) => set("numHoles", parseInt(e.target.value) || 18)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Par</label>
              <input type="number" value={form.par} onChange={(e) => set("par", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Year Opened</label>
              <input type="number" value={form.yearOpened} onChange={(e) => set("yearOpened", e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>

        <div className="bg-[#111] border border-[#222] rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Contact & Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Website URL</label>
              <input type="url" value={form.websiteUrl} onChange={(e) => set("websiteUrl", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input type="text" value={form.phone} onChange={(e) => set("phone", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={inputClass} />
            </div>
            <div />
            <div>
              <label className={labelClass}>Green Fee Low ($)</label>
              <input type="number" step="0.01" value={form.greenFeeLow} onChange={(e) => set("greenFeeLow", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Green Fee High ($)</label>
              <input type="number" step="0.01" value={form.greenFeeHigh} onChange={(e) => set("greenFeeHigh", e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>

        <div className="bg-[#111] border border-[#222] rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Description</h2>
          <textarea
            rows={5}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            className={inputClass}
            placeholder="Course description..."
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#22c55e] text-black font-medium hover:bg-[#16a34a] disabled:opacity-50 transition-colors"
          >
            <Save size={16} />
            {saving ? "Creating..." : "Create Course"}
          </button>
        </div>
      </form>
    </div>
  );
}
