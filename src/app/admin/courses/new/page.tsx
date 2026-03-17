"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

export default function AddCoursePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [courseName, setCourseName] = useState("");
  const [facilityName, setFacilityName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [country, setCountry] = useState("United States");
  const [accessType, setAccessType] = useState("");
  const [courseType, setCourseType] = useState("");
  const [numHoles, setNumHoles] = useState("18");
  const [par, setPar] = useState("");
  const [yearOpened, setYearOpened] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    if (!courseName.trim()) {
      showToast("error", "Course name is required");
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        courseName: courseName.trim(),
        facilityName: facilityName || null,
        city: city || null,
        state: state || null,
        zipCode: zipCode || null,
        country,
        accessType: accessType || null,
        courseType: courseType || null,
        numHoles: numHoles ? parseInt(numHoles) : 18,
        par: par ? parseInt(par) : null,
        yearOpened: yearOpened ? parseInt(yearOpened) : null,
        websiteUrl: websiteUrl || null,
        phone: phone || null,
        description: description || null,
      };

      const res = await fetch("/api/admin/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": localStorage.getItem("golfEQ_admin_key") || "",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed to create course");
      const data = await res.json();
      showToast("success", "Course created!");
      setTimeout(() => router.push(`/admin/courses/${data.courseId}`), 500);
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to create course");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl">
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-sm shadow-lg"
          style={{
            backgroundColor: toast.type === "success" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
            color: toast.type === "success" ? "#22c55e" : "#ef4444",
            border: `1px solid ${toast.type === "success" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
          }}
        >
          {toast.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/admin/courses")}
            className="rounded-lg p-2 text-gray-400 hover:text-white hover:bg-white/5"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-white">Add Course</h1>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium transition-colors"
          style={{ backgroundColor: "#22c55e", color: "#000" }}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Create Course
        </button>
      </div>

      <div
        className="rounded-xl p-6 space-y-6"
        style={{ backgroundColor: "#111111", border: "1px solid #1f1f1f" }}
      >
        <p className="text-xs text-gray-500">Create the course with basic info, then edit it to add full details.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Course Name *</label>
            <input
              type="text"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="e.g. Pine Valley Golf Club"
              className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
              style={{ backgroundColor: "#0a0a0a", border: "1px solid #1f1f1f" }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Facility Name</label>
            <input
              type="text"
              value={facilityName}
              onChange={(e) => setFacilityName(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
              style={{ backgroundColor: "#0a0a0a", border: "1px solid #1f1f1f" }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Website</label>
            <input
              type="text"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
              style={{ backgroundColor: "#0a0a0a", border: "1px solid #1f1f1f" }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
              style={{ backgroundColor: "#0a0a0a", border: "1px solid #1f1f1f" }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">State</label>
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
              style={{ backgroundColor: "#0a0a0a", border: "1px solid #1f1f1f" }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Zip Code</label>
            <input
              type="text"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
              style={{ backgroundColor: "#0a0a0a", border: "1px solid #1f1f1f" }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Country</label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
              style={{ backgroundColor: "#0a0a0a", border: "1px solid #1f1f1f" }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
              style={{ backgroundColor: "#0a0a0a", border: "1px solid #1f1f1f" }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Access Type</label>
            <select
              value={accessType}
              onChange={(e) => setAccessType(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
              style={{ backgroundColor: "#0a0a0a", border: "1px solid #1f1f1f" }}
            >
              <option value="">—</option>
              <option value="Public">Public</option>
              <option value="Private">Private</option>
              <option value="Resort">Resort</option>
              <option value="Semi-Private">Semi-Private</option>
              <option value="Military">Military</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Course Type</label>
            <select
              value={courseType}
              onChange={(e) => setCourseType(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
              style={{ backgroundColor: "#0a0a0a", border: "1px solid #1f1f1f" }}
            >
              <option value="">—</option>
              <option value="Links">Links</option>
              <option value="Parkland">Parkland</option>
              <option value="Desert">Desert</option>
              <option value="Mountain">Mountain</option>
              <option value="Heathland">Heathland</option>
              <option value="Tropical">Tropical</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Number of Holes</label>
            <input
              type="number"
              value={numHoles}
              onChange={(e) => setNumHoles(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
              style={{ backgroundColor: "#0a0a0a", border: "1px solid #1f1f1f" }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Par</label>
            <input
              type="number"
              value={par}
              onChange={(e) => setPar(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
              style={{ backgroundColor: "#0a0a0a", border: "1px solid #1f1f1f" }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Year Opened</label>
            <input
              type="number"
              value={yearOpened}
              onChange={(e) => setYearOpened(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
              style={{ backgroundColor: "#0a0a0a", border: "1px solid #1f1f1f" }}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none resize-y"
              style={{ backgroundColor: "#0a0a0a", border: "1px solid #1f1f1f" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
