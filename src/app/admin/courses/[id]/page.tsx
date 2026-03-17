"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, Plus, Trash2, X, Star, Pencil, ImageIcon, Sparkles, CheckCircle, AlertCircle } from "lucide-react";

function getAdminKey() {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("golfEQ_admin_key") || "";
}

const TABS = [
  "Basic Info",
  "Pricing",
  "Design & Character",
  "Conditions",
  "History",
  "Nearby",
  "Media",
  "Tee Boxes",
] as const;
type Tab = (typeof TABS)[number];

export default function CourseEditorPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Record<string, any> | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState<Tab>("Basic Info");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [enriching, setEnriching] = useState(false);
  const [enrichResult, setEnrichResult] = useState<{
    fieldsEnriched: number;
    ruleBasedFields: string[];
    aiFields: string[];
    beforePct: number;
    afterPct: number;
    aiError?: string | null;
  } | null>(null);

  const fetchCourse = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/courses/${courseId}`, {
        headers: { "x-admin-key": getAdminKey() },
      });
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();
      setCourse(data);
      setForm(data);
    } catch {
      setCourse(null);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  const set = (field: string, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/courses/${courseId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": getAdminKey(),
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Save failed");
      }
      const updated = await res.json();
      setCourse(updated);
      setMessage({ type: "success", text: "Course saved successfully" });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleEnrich = async () => {
    setEnriching(true);
    setEnrichResult(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/enrich`, {
        method: "POST",
        headers: { "x-admin-key": getAdminKey() },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Enrichment failed");
      }
      const data = await res.json();
      setEnrichResult({
        fieldsEnriched: data.fieldsEnriched,
        ruleBasedFields: data.ruleBasedFields || [],
        aiFields: data.aiFields || [],
        beforePct: data.beforePct,
        afterPct: data.afterPct,
        aiError: data.aiError,
      });
      if (data.fieldsEnriched > 0) {
        setMessage({ type: "success", text: `Enriched ${data.fieldsEnriched} fields (${data.beforePct}% → ${data.afterPct}%)` });
        // Refresh course data to pick up enriched fields
        await fetchCourse();
      } else {
        setMessage({ type: "success", text: "No additional data could be found" });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setEnriching(false);
    }
  };

  // Calculate enrichment completeness percentage
  const ENRICHMENT_CHECK_FIELDS = [
    { key: "description", weight: 3 },
    { key: "par", weight: 2 },
    { key: "yearOpened", weight: 1 },
    { key: "originalArchitect", weight: 2 },
    { key: "courseType", weight: 1 },
    { key: "accessType", weight: 2 },
    { key: "courseStyle", weight: 1 },
    { key: "greenFeeLow", weight: 1 },
    { key: "greenFeeHigh", weight: 1 },
    { key: "walkingPolicy", weight: 1 },
    { key: "dressCode", weight: 1 },
    { key: "caddieAvailability", weight: 1 },
    { key: "practiceFacilities", weight: 1 },
    { key: "bestTimeToPlay", weight: 1 },
    { key: "bestMonths", weight: 1 },
    { key: "golfSeason", weight: 1 },
    { key: "averageRoundTime", weight: 1 },
    { key: "fairwayGrass", weight: 1 },
    { key: "greenGrass", weight: 1 },
    { key: "websiteUrl", weight: 1 },
    { key: "phone", weight: 1 },
    { key: "latitude", weight: 1 },
    { key: "streetAddress", weight: 1 },
  ];

  const enrichmentPct = course
    ? (() => {
        let totalWeight = 0;
        let filledWeight = 0;
        for (const f of ENRICHMENT_CHECK_FIELDS) {
          totalWeight += f.weight;
          const val = (course as any)[f.key];
          if (val !== null && val !== undefined && val !== "") {
            filledWeight += f.weight;
          }
        }
        return totalWeight > 0 ? Math.round((filledWeight / totalWeight) * 100) : 0;
      })()
    : 0;

  const enrichmentColor =
    enrichmentPct >= 80 ? "text-green-400" :
    enrichmentPct >= 60 ? "text-blue-400" :
    enrichmentPct >= 40 ? "text-yellow-400" :
    enrichmentPct >= 20 ? "text-orange-400" :
    "text-red-400";

  const enrichmentBgColor =
    enrichmentPct >= 80 ? "bg-green-500" :
    enrichmentPct >= 60 ? "bg-blue-500" :
    enrichmentPct >= 40 ? "bg-yellow-500" :
    enrichmentPct >= 20 ? "bg-orange-500" :
    "bg-red-500";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-gray-500" size={32} />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">Course not found</p>
        <Link href="/admin/courses" className="text-[#22c55e] hover:underline mt-2 inline-block">
          Back to courses
        </Link>
      </div>
    );
  }

  const inputClass =
    "w-full px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-white text-sm focus:outline-none focus:border-[#22c55e]";
  const labelClass = "block text-xs text-gray-400 mb-1";
  const readOnlyClass =
    "w-full px-3 py-2 rounded-lg bg-[#0d0d0d] border border-[#222] text-gray-500 text-sm cursor-not-allowed";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/courses" className="p-2 rounded-lg hover:bg-[#1a1a1a] text-gray-400">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{course.courseName}</h1>
            <p className="text-sm text-gray-400">
              {[course.city, course.state].filter(Boolean).join(", ")} &middot; ID {course.courseId}
            </p>
          </div>
          {/* Enrichment completeness indicator */}
          <div className="flex items-center gap-2 ml-2">
            <div className="w-24 h-2 rounded-full bg-[#222] overflow-hidden">
              <div className={`h-full rounded-full ${enrichmentBgColor} transition-all duration-500`} style={{ width: `${enrichmentPct}%` }} />
            </div>
            <span className={`text-xs font-medium ${enrichmentColor}`}>{enrichmentPct}%</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleEnrich}
            disabled={enriching}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {enriching ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {enriching ? "Enriching..." : "Enrich Course"}
          </button>
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
          <div className="flex items-center gap-2">
            {message.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {message.text}
          </div>
        </div>
      )}

      {/* Enrichment Results */}
      {enrichResult && enrichResult.fieldsEnriched > 0 && (
        <div className="p-4 rounded-lg bg-purple-900/20 border border-purple-800/50 text-sm">
          <div className="flex items-center gap-2 text-purple-300 font-medium mb-2">
            <Sparkles size={16} />
            Enrichment Complete — {enrichResult.fieldsEnriched} fields updated
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
            <div className="text-center p-2 rounded bg-[#111]">
              <div className="text-lg font-bold text-white">{enrichResult.beforePct}%</div>
              <div className="text-xs text-gray-500">Before</div>
            </div>
            <div className="text-center p-2 rounded bg-[#111]">
              <div className="text-lg font-bold text-green-400">{enrichResult.afterPct}%</div>
              <div className="text-xs text-gray-500">After</div>
            </div>
            <div className="text-center p-2 rounded bg-[#111]">
              <div className="text-lg font-bold text-blue-400">{enrichResult.ruleBasedFields.length}</div>
              <div className="text-xs text-gray-500">Rule-based</div>
            </div>
            <div className="text-center p-2 rounded bg-[#111]">
              <div className="text-lg font-bold text-purple-400">{enrichResult.aiFields.length}</div>
              <div className="text-xs text-gray-500">AI-powered</div>
            </div>
          </div>
          {enrichResult.aiFields.length > 0 && (
            <p className="text-xs text-gray-400">
              <span className="text-purple-400">AI fields:</span> {enrichResult.aiFields.join(", ")}
            </p>
          )}
          {enrichResult.ruleBasedFields.length > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              <span className="text-blue-400">Rule-based:</span> {enrichResult.ruleBasedFields.join(", ")}
            </p>
          )}
          {enrichResult.aiError && (
            <p className="text-xs text-yellow-400 mt-1">{enrichResult.aiError}</p>
          )}
          <button onClick={() => setEnrichResult(null)} className="text-xs text-gray-500 hover:text-gray-300 mt-2">
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-[#222] flex gap-1 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab
                ? "border-[#22c55e] text-[#22c55e]"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-[#111] border border-[#222] rounded-xl p-6">
        {activeTab === "Basic Info" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={labelClass}>Course Name</label>
              <input type="text" value={form.courseName || ""} onChange={(e) => set("courseName", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Facility Name</label>
              <input type="text" value={form.facilityName || ""} onChange={(e) => set("facilityName", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Original Architect</label>
              <input type="text" value={form.originalArchitect || ""} onChange={(e) => set("originalArchitect", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Renovation Architect</label>
              <input type="text" value={form.renovationArchitect || ""} onChange={(e) => set("renovationArchitect", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Renovation Year</label>
              <input type="number" value={form.renovationYear || ""} onChange={(e) => set("renovationYear", e.target.value ? parseInt(e.target.value) : null)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Street Address</label>
              <input type="text" value={form.streetAddress || ""} onChange={(e) => set("streetAddress", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>City</label>
              <input type="text" value={form.city || ""} onChange={(e) => set("city", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>State</label>
              <input type="text" value={form.state || ""} onChange={(e) => set("state", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Zip Code</label>
              <input type="text" value={form.zipCode || ""} onChange={(e) => set("zipCode", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Country</label>
              <input type="text" value={form.country || ""} onChange={(e) => set("country", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Latitude</label>
              <input type="number" step="any" value={form.latitude || ""} onChange={(e) => set("latitude", e.target.value ? parseFloat(e.target.value) : null)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Longitude</label>
              <input type="number" step="any" value={form.longitude || ""} onChange={(e) => set("longitude", e.target.value ? parseFloat(e.target.value) : null)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Course Type</label>
              <select value={form.courseType || ""} onChange={(e) => set("courseType", e.target.value || null)} className={inputClass}>
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
              <select value={form.accessType || ""} onChange={(e) => set("accessType", e.target.value || null)} className={inputClass}>
                <option value="">Select...</option>
                <option value="Public">Public</option>
                <option value="Private">Private</option>
                <option value="Resort">Resort</option>
                <option value="Semi-Private">Semi-Private</option>
                <option value="Military">Military</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Course Style</label>
              <input type="text" value={form.courseStyle || ""} onChange={(e) => set("courseStyle", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Number of Holes</label>
              <input type="number" value={form.numHoles ?? 18} onChange={(e) => set("numHoles", parseInt(e.target.value) || 18)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Par</label>
              <input type="number" value={form.par || ""} onChange={(e) => set("par", e.target.value ? parseInt(e.target.value) : null)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Year Opened</label>
              <input type="number" value={form.yearOpened || ""} onChange={(e) => set("yearOpened", e.target.value ? parseInt(e.target.value) : null)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Website URL</label>
              <input type="url" value={form.websiteUrl || ""} onChange={(e) => set("websiteUrl", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input type="text" value={form.phone || ""} onChange={(e) => set("phone", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" value={form.email || ""} onChange={(e) => set("email", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Tagline</label>
              <input type="text" value={form.tagline || ""} onChange={(e) => set("tagline", e.target.value)} className={inputClass} />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Description</label>
              <textarea rows={4} value={form.description || ""} onChange={(e) => set("description", e.target.value)} className={inputClass} />
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input type="checkbox" checked={form.isVerified || false} onChange={(e) => set("isVerified", e.target.checked)} className="accent-[#22c55e]" />
                Verified
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input type="checkbox" checked={form.isEnriched || false} onChange={(e) => set("isEnriched", e.target.checked)} className="accent-[#22c55e]" />
                Enriched
              </label>
            </div>
          </div>
        )}

        {activeTab === "Pricing" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Green Fee Low ($)</label>
              <input type="number" step="0.01" value={form.greenFeeLow ?? ""} onChange={(e) => set("greenFeeLow", e.target.value ? parseFloat(e.target.value) : null)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Green Fee High ($)</label>
              <input type="number" step="0.01" value={form.greenFeeHigh ?? ""} onChange={(e) => set("greenFeeHigh", e.target.value ? parseFloat(e.target.value) : null)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Green Fee Peak ($)</label>
              <input type="number" step="0.01" value={form.greenFeePeak ?? ""} onChange={(e) => set("greenFeePeak", e.target.value ? parseFloat(e.target.value) : null)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Green Fee Off-Peak ($)</label>
              <input type="number" step="0.01" value={form.greenFeeOffPeak ?? ""} onChange={(e) => set("greenFeeOffPeak", e.target.value ? parseFloat(e.target.value) : null)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Green Fee Twilight ($)</label>
              <input type="number" step="0.01" value={form.greenFeeTwilight ?? ""} onChange={(e) => set("greenFeeTwilight", e.target.value ? parseFloat(e.target.value) : null)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Currency</label>
              <input type="text" value={form.greenFeeCurrency || "USD"} onChange={(e) => set("greenFeeCurrency", e.target.value)} className={inputClass} maxLength={3} />
            </div>
            <div>
              <label className={labelClass}>Price Tier</label>
              <select value={form.priceTier || ""} onChange={(e) => set("priceTier", e.target.value || null)} className={inputClass}>
                <option value="">Select...</option>
                <option value="$">$ (Budget)</option>
                <option value="$$">$$ (Moderate)</option>
                <option value="$$$">$$$ (Premium)</option>
                <option value="$$$$">$$$$ (Luxury)</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input type="checkbox" checked={form.includesCart || false} onChange={(e) => set("includesCart", e.target.checked)} className="accent-[#22c55e]" />
              <label className="text-sm text-gray-300">Green fee includes cart</label>
            </div>
            <div>
              <label className={labelClass}>Booking URL</label>
              <input type="url" value={form.bookingUrl || ""} onChange={(e) => set("bookingUrl", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Walking Policy</label>
              <input type="text" value={form.walkingPolicy || ""} onChange={(e) => set("walkingPolicy", e.target.value)} className={inputClass} placeholder="e.g., Walking allowed, Cart mandatory" />
            </div>
            <div>
              <label className={labelClass}>Cart Policy</label>
              <input type="text" value={form.cartPolicy || ""} onChange={(e) => set("cartPolicy", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Cart Fee</label>
              <input type="text" value={form.cartFee || ""} onChange={(e) => set("cartFee", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Caddie Availability</label>
              <input type="text" value={form.caddieAvailability || ""} onChange={(e) => set("caddieAvailability", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Caddie Fee</label>
              <input type="text" value={form.caddieFee || ""} onChange={(e) => set("caddieFee", e.target.value)} className={inputClass} />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input type="checkbox" checked={form.clubRentalAvailable || false} onChange={(e) => set("clubRentalAvailable", e.target.checked)} className="accent-[#22c55e]" />
              <label className="text-sm text-gray-300">Club rental available</label>
            </div>
          </div>
        )}

        {activeTab === "Design & Character" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Signature Hole Number</label>
                <input type="number" value={form.signatureHoleNumber ?? ""} onChange={(e) => set("signatureHoleNumber", e.target.value ? parseInt(e.target.value) : null)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Dress Code</label>
                <input type="text" value={form.dressCode || ""} onChange={(e) => set("dressCode", e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Cell Phone Policy</label>
                <input type="text" value={form.cellPhonePolicy || ""} onChange={(e) => set("cellPhonePolicy", e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Guest Policy</label>
                <input type="text" value={form.guestPolicy || ""} onChange={(e) => set("guestPolicy", e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>How to Get On</label>
                <input type="text" value={form.howToGetOn || ""} onChange={(e) => set("howToGetOn", e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Resort Affiliate Access</label>
                <input type="text" value={form.resortAffiliateAccess || ""} onChange={(e) => set("resortAffiliateAccess", e.target.value)} className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Signature Hole Description</label>
              <textarea rows={3} value={form.signatureHoleDescription || ""} onChange={(e) => set("signatureHoleDescription", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Course Strategy</label>
              <textarea rows={3} value={form.courseStrategy || ""} onChange={(e) => set("courseStrategy", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>What to Expect</label>
              <textarea rows={3} value={form.whatToExpect || ""} onChange={(e) => set("whatToExpect", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Best Time to Play</label>
              <input type="text" value={form.bestTimeToPlay || ""} onChange={(e) => set("bestTimeToPlay", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Pace of Play Notes</label>
              <input type="text" value={form.paceOfPlayNotes || ""} onChange={(e) => set("paceOfPlayNotes", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Insider Tips (JSON)</label>
              <textarea rows={3} value={typeof form.insiderTips === "object" ? JSON.stringify(form.insiderTips, null, 2) : form.insiderTips || ""} onChange={(e) => {
                try { set("insiderTips", JSON.parse(e.target.value)); } catch { set("insiderTips", e.target.value); }
              }} className={inputClass} placeholder='["Tip 1", "Tip 2"]' />
            </div>
            <div>
              <label className={labelClass}>Design Philosophy</label>
              <textarea rows={3} value={form.designPhilosophy || ""} onChange={(e) => set("designPhilosophy", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Architect Bio</label>
              <textarea rows={3} value={form.architectBio || ""} onChange={(e) => set("architectBio", e.target.value)} className={inputClass} />
            </div>
          </div>
        )}

        {activeTab === "Conditions" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Fairway Grass</label>
              <input type="text" value={form.fairwayGrass || ""} onChange={(e) => set("fairwayGrass", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Green Grass</label>
              <input type="text" value={form.greenGrass || ""} onChange={(e) => set("greenGrass", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Green Speed</label>
              <input type="text" value={form.greenSpeed || ""} onChange={(e) => set("greenSpeed", e.target.value)} className={inputClass} placeholder="e.g., 11-12 on stimpmeter" />
            </div>
            <div>
              <label className={labelClass}>Aeration Schedule</label>
              <input type="text" value={form.aerationSchedule || ""} onChange={(e) => set("aerationSchedule", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Best Condition Months</label>
              <input type="text" value={form.bestConditionMonths || ""} onChange={(e) => set("bestConditionMonths", e.target.value)} className={inputClass} placeholder="e.g., April-June, September-October" />
            </div>
            <div>
              <label className={labelClass}>Golf Season</label>
              <input type="text" value={form.golfSeason || ""} onChange={(e) => set("golfSeason", e.target.value)} className={inputClass} placeholder="e.g., Year-round, March-November" />
            </div>
          </div>
        )}

        {activeTab === "History" && (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Renovation Notes</label>
              <textarea rows={3} value={form.renovationNotes || ""} onChange={(e) => set("renovationNotes", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Championship History (JSON)</label>
              <textarea rows={4} value={typeof form.championshipHistory === "object" ? JSON.stringify(form.championshipHistory, null, 2) : form.championshipHistory || ""} onChange={(e) => {
                try { set("championshipHistory", JSON.parse(e.target.value)); } catch { set("championshipHistory", e.target.value); }
              }} className={inputClass} placeholder='[{"event": "US Open", "year": 2020}]' />
            </div>
            <div>
              <label className={labelClass}>Famous Moments (JSON)</label>
              <textarea rows={4} value={typeof form.famousMoments === "object" ? JSON.stringify(form.famousMoments, null, 2) : form.famousMoments || ""} onChange={(e) => {
                try { set("famousMoments", JSON.parse(e.target.value)); } catch { set("famousMoments", e.target.value); }
              }} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Upcoming Events (JSON)</label>
              <textarea rows={4} value={typeof form.upcomingEvents === "object" ? JSON.stringify(form.upcomingEvents, null, 2) : form.upcomingEvents || ""} onChange={(e) => {
                try { set("upcomingEvents", JSON.parse(e.target.value)); } catch { set("upcomingEvents", e.target.value); }
              }} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Renovation History (JSON)</label>
              <textarea rows={4} value={typeof form.renovationHistory === "object" ? JSON.stringify(form.renovationHistory, null, 2) : form.renovationHistory || ""} onChange={(e) => {
                try { set("renovationHistory", JSON.parse(e.target.value)); } catch { set("renovationHistory", e.target.value); }
              }} className={inputClass} />
            </div>
          </div>
        )}

        {activeTab === "Nearby" && (
          <div className="space-y-6">
            {/* Lodging section */}
            <div>
              <h3 className="text-sm font-medium text-white mb-1">On-site Lodging</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={form.onSiteLodging || false} onChange={(e) => set("onSiteLodging", e.target.checked)} className="accent-[#22c55e]" />
                  <label className="text-sm text-gray-300">Has on-site lodging</label>
                </div>
                <div />
                <div>
                  <label className={labelClass}>Resort Name</label>
                  <input type="text" value={form.resortNameField || ""} onChange={(e) => set("resortNameField", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Resort Booking URL</label>
                  <input type="url" value={form.resortBookingUrl || ""} onChange={(e) => set("resortBookingUrl", e.target.value)} className={inputClass} />
                </div>
              </div>
            </div>

            {/* Read-only nearby relations */}
            <div>
              <h3 className="text-sm font-medium text-white mb-2">Nearby Dining ({course.nearbyDining?.length || 0})</h3>
              {course.nearbyDining?.length > 0 ? (
                <div className="space-y-2">
                  {course.nearbyDining.map((d: any) => (
                    <div key={d.id} className="p-3 rounded-lg bg-[#0d0d0d] border border-[#222] text-sm">
                      <span className="text-white font-medium">{d.name}</span>
                      {d.cuisineType && <span className="text-gray-500 ml-2">{d.cuisineType}</span>}
                      {d.distanceMiles && <span className="text-gray-600 ml-2">{Number(d.distanceMiles).toFixed(1)} mi</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-sm">No nearby dining entries</p>
              )}
            </div>

            <div>
              <h3 className="text-sm font-medium text-white mb-2">Nearby Lodging ({course.nearbyLodging?.length || 0})</h3>
              {course.nearbyLodging?.length > 0 ? (
                <div className="space-y-2">
                  {course.nearbyLodging.map((l: any) => (
                    <div key={l.id} className="p-3 rounded-lg bg-[#0d0d0d] border border-[#222] text-sm">
                      <span className="text-white font-medium">{l.name}</span>
                      {l.lodgingType && <span className="text-gray-500 ml-2">{l.lodgingType}</span>}
                      {l.distanceMiles && <span className="text-gray-600 ml-2">{Number(l.distanceMiles).toFixed(1)} mi</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-sm">No nearby lodging entries</p>
              )}
            </div>

            <div>
              <h3 className="text-sm font-medium text-white mb-2">Nearby Attractions ({course.nearbyAttractions?.length || 0})</h3>
              {course.nearbyAttractions?.length > 0 ? (
                <div className="space-y-2">
                  {course.nearbyAttractions.map((a: any) => (
                    <div key={a.id} className="p-3 rounded-lg bg-[#0d0d0d] border border-[#222] text-sm">
                      <span className="text-white font-medium">{a.name}</span>
                      {a.category && <span className="text-gray-500 ml-2">{a.category}</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-sm">No nearby attraction entries</p>
              )}
            </div>
          </div>
        )}

        {activeTab === "Media" && (
          <MediaTab courseId={courseId} adminKey={getAdminKey()} initialMedia={course.media || []} onMediaChange={fetchCourse} />
        )}

        {activeTab === "Tee Boxes" && (
          <div>
            <h3 className="text-sm font-medium text-white mb-3">Tee Boxes ({course.teeBoxes?.length || 0})</h3>
            {course.teeBoxes?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#222] text-gray-400 text-left">
                      <th className="px-4 py-2 font-medium">Tee Name</th>
                      <th className="px-4 py-2 font-medium">Color</th>
                      <th className="px-4 py-2 font-medium">Gender</th>
                      <th className="px-4 py-2 font-medium text-right">Yardage</th>
                      <th className="px-4 py-2 font-medium text-right">Rating</th>
                      <th className="px-4 py-2 font-medium text-right">Slope</th>
                    </tr>
                  </thead>
                  <tbody>
                    {course.teeBoxes.map((t: any) => (
                      <tr key={t.teeId} className="border-b border-[#1a1a1a]">
                        <td className="px-4 py-2 text-white">{t.teeName}</td>
                        <td className="px-4 py-2 text-gray-400">{t.color || "—"}</td>
                        <td className="px-4 py-2 text-gray-400">{t.gender || "—"}</td>
                        <td className="px-4 py-2 text-right text-white font-mono">{t.totalYardage?.toLocaleString() || "—"}</td>
                        <td className="px-4 py-2 text-right text-gray-400">{t.courseRating ? Number(t.courseRating).toFixed(1) : "—"}</td>
                        <td className="px-4 py-2 text-right text-gray-400">{t.slopeRating || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-600 text-sm">No tee boxes configured</p>
            )}

            {course.holes?.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-white mb-3">Holes ({course.holes.length})</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#222] text-gray-400 text-left">
                        <th className="px-4 py-2 font-medium">Hole</th>
                        <th className="px-4 py-2 font-medium">Par</th>
                      </tr>
                    </thead>
                    <tbody>
                      {course.holes.map((h: any) => (
                        <tr key={h.holeId} className="border-b border-[#1a1a1a]">
                          <td className="px-4 py-2 text-white">{h.holeNumber}</td>
                          <td className="px-4 py-2 text-gray-400">{h.par}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────── Media Tab Component ─────────────────────────── */

function MediaTab({
  courseId,
  adminKey,
  initialMedia,
  onMediaChange,
}: {
  courseId: string;
  adminKey: string;
  initialMedia: any[];
  onMediaChange: () => void;
}) {
  const [media, setMedia] = useState<any[]>(initialMedia);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addUrl, setAddUrl] = useState("");
  const [addCaption, setAddCaption] = useState("");
  const [addCredit, setAddCredit] = useState("");
  const [addIsPrimary, setAddIsPrimary] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [adding, setAdding] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const [editCredit, setEditCredit] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [mediaMessage, setMediaMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    setMedia(initialMedia);
  }, [initialMedia]);

  const showMsg = (type: "success" | "error", text: string) => {
    setMediaMessage({ type, text });
    setTimeout(() => setMediaMessage(null), 3000);
  };

  const handleAdd = async () => {
    if (!addUrl.trim()) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({
          url: addUrl.trim(),
          caption: addCaption.trim() || null,
          credit: addCredit.trim() || null,
          mediaType: "image",
          isPrimary: addIsPrimary,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add");
      }
      setShowAddForm(false);
      setAddUrl("");
      setAddCaption("");
      setAddCredit("");
      setAddIsPrimary(false);
      setPreviewError(false);
      showMsg("success", "Photo added successfully");
      onMediaChange();
    } catch (err: any) {
      showMsg("error", err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async () => {
    if (deleteId === null) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/media/${deleteId}`, {
        method: "DELETE",
        headers: { "x-admin-key": adminKey },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }
      setDeleteId(null);
      showMsg("success", "Photo deleted");
      onMediaChange();
    } catch (err: any) {
      showMsg("error", err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleTogglePrimary = async (mediaId: number, current: boolean) => {
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/media/${mediaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ isPrimary: !current }),
      });
      if (!res.ok) throw new Error("Failed to update");
      onMediaChange();
    } catch (err: any) {
      showMsg("error", err.message);
    }
  };

  const startEdit = (m: any) => {
    setEditingId(m.mediaId);
    setEditCaption(m.caption || "");
    setEditCredit(m.credit || "");
  };

  const handleEditSave = async () => {
    if (editingId === null) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/media/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ caption: editCaption, credit: editCredit }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setEditingId(null);
      showMsg("success", "Caption updated");
      onMediaChange();
    } catch (err: any) {
      showMsg("error", err.message);
    } finally {
      setEditSaving(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-white text-sm focus:outline-none focus:border-[#22c55e]";
  const labelClass = "block text-xs text-gray-400 mb-1";

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-white">Course Media ({media.length})</h3>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#22c55e] text-black text-sm font-medium hover:bg-[#16a34a] transition-colors"
        >
          <Plus size={16} />
          Add Photo
        </button>
      </div>

      {/* Message */}
      {mediaMessage && (
        <div className={`p-3 rounded-lg text-sm mb-4 ${
          mediaMessage.type === "success"
            ? "bg-green-900/30 border border-green-800 text-green-400"
            : "bg-red-900/30 border border-red-800 text-red-400"
        }`}>
          {mediaMessage.text}
        </div>
      )}

      {/* Add Photo Form */}
      {showAddForm && (
        <div className="mb-6 p-4 rounded-xl bg-[#0d0d0d] border border-[#333]">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-white">Add Photo by URL</h4>
            <button onClick={() => { setShowAddForm(false); setAddUrl(""); setAddCaption(""); setAddCredit(""); setPreviewError(false); }} className="text-gray-500 hover:text-white">
              <X size={18} />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className={labelClass}>Image URL *</label>
              <input
                type="url"
                value={addUrl}
                onChange={(e) => { setAddUrl(e.target.value); setPreviewError(false); }}
                placeholder="https://example.com/photo.jpg"
                className={inputClass}
              />
            </div>

            {/* Preview */}
            {addUrl.trim() && (
              <div>
                <label className={labelClass}>Preview</label>
                <div className="rounded-lg border border-[#333] overflow-hidden bg-[#1a1a1a] max-w-sm">
                  {previewError ? (
                    <div className="w-full h-40 flex flex-col items-center justify-center text-gray-500 text-sm gap-2">
                      <ImageIcon size={24} />
                      <span>Could not load preview</span>
                    </div>
                  ) : (
                    <img
                      src={addUrl.trim()}
                      alt="Preview"
                      className="w-full h-40 object-cover"
                      onError={() => setPreviewError(true)}
                    />
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Caption</label>
                <input type="text" value={addCaption} onChange={(e) => setAddCaption(e.target.value)} placeholder="e.g., Hole 18 at sunset" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Credit</label>
                <input type="text" value={addCredit} onChange={(e) => setAddCredit(e.target.value)} placeholder="e.g., Photographer name" className={inputClass} />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input type="checkbox" checked={addIsPrimary} onChange={(e) => setAddIsPrimary(e.target.checked)} className="accent-[#22c55e]" />
              Set as primary photo
            </label>

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleAdd}
                disabled={adding || !addUrl.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#22c55e] text-black text-sm font-medium hover:bg-[#16a34a] disabled:opacity-50 transition-colors"
              >
                {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                {adding ? "Adding..." : "Add Photo"}
              </button>
              <button
                onClick={() => { setShowAddForm(false); setAddUrl(""); setAddCaption(""); setAddCredit(""); setPreviewError(false); }}
                className="px-4 py-2 rounded-lg border border-[#333] text-gray-400 text-sm hover:text-white hover:border-[#555] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-[#111] border border-[#333] rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h4 className="text-white font-medium mb-2">Delete Photo</h4>
            <p className="text-gray-400 text-sm mb-4">Are you sure you want to delete this photo? This action cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteId(null)}
                disabled={deleting}
                className="px-4 py-2 rounded-lg border border-[#333] text-gray-400 text-sm hover:text-white hover:border-[#555] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Grid */}
      {media.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {media.map((m: any) => (
            <div key={m.mediaId} className="group rounded-lg border border-[#222] overflow-hidden bg-[#0d0d0d] relative">
              {/* Image */}
              <div className="relative">
                {m.mediaType === "image" || m.url?.match(/\.(jpg|jpeg|png|gif|webp)/i) ? (
                  <img src={m.url} alt={m.caption || "Course media"} className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 flex items-center justify-center text-gray-600 text-sm">
                    <ImageIcon size={24} className="mr-2" />
                    {m.mediaType || "Media"}
                  </div>
                )}

                {/* Overlay actions */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-start justify-end p-2 gap-1 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => handleTogglePrimary(m.mediaId, m.isPrimary)}
                    title={m.isPrimary ? "Remove primary" : "Set as primary"}
                    className={`p-1.5 rounded-lg transition-colors ${m.isPrimary ? "bg-yellow-500 text-black" : "bg-black/60 text-white hover:bg-black/80"}`}
                  >
                    <Star size={14} fill={m.isPrimary ? "currentColor" : "none"} />
                  </button>
                  <button
                    onClick={() => startEdit(m)}
                    title="Edit caption"
                    className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteId(m.mediaId)}
                    title="Delete photo"
                    className="p-1.5 rounded-lg bg-black/60 text-red-400 hover:bg-red-600 hover:text-white transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Primary badge */}
                {m.isPrimary && (
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-yellow-500 text-black text-xs font-medium flex items-center gap-1">
                    <Star size={10} fill="currentColor" />
                    Primary
                  </div>
                )}
              </div>

              {/* Info / Edit */}
              <div className="p-3">
                {editingId === m.mediaId ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editCaption}
                      onChange={(e) => setEditCaption(e.target.value)}
                      placeholder="Caption"
                      className={inputClass}
                      autoFocus
                    />
                    <input
                      type="text"
                      value={editCredit}
                      onChange={(e) => setEditCredit(e.target.value)}
                      placeholder="Credit"
                      className={inputClass}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleEditSave}
                        disabled={editSaving}
                        className="flex items-center gap-1 px-3 py-1 rounded bg-[#22c55e] text-black text-xs font-medium hover:bg-[#16a34a] disabled:opacity-50"
                      >
                        {editSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1 rounded border border-[#333] text-gray-400 text-xs hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-gray-400">{m.caption || "No caption"}</p>
                    {m.credit && <p className="text-xs text-gray-600 mt-0.5">Credit: {m.credit}</p>}
                    <p className="text-xs text-gray-600 mt-1">
                      {m.mediaType} &middot; Order: {m.sortOrder}
                    </p>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <ImageIcon size={32} className="mx-auto text-gray-600 mb-3" />
          <p className="text-gray-500 text-sm">No media uploaded</p>
          <p className="text-gray-600 text-xs mt-1">Click "Add Photo" to get started</p>
        </div>
      )}
    </div>
  );
}
