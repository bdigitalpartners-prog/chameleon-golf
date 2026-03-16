"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Loader2,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

const TABS = [
  "Basic Info",
  "Pricing & Policies",
  "Design & Character",
  "Conditions",
  "History",
  "Nearby",
  "Media",
  "Tee Boxes & Holes",
] as const;

type Tab = (typeof TABS)[number];

interface NearbyDining {
  name: string;
  cuisineType: string;
  priceLevel: string;
  rating: string;
  distanceMiles: string;
  description: string;
  address: string;
  phone: string;
  websiteUrl: string;
  isOnSite: boolean;
  sortOrder: number;
}

interface NearbyLodging {
  name: string;
  lodgingType: string;
  priceTier: string;
  avgPricePerNight: string;
  rating: string;
  distanceMiles: string;
  description: string;
  address: string;
  phone: string;
  websiteUrl: string;
  bookingUrl: string;
  isOnSite: boolean;
  isPartner: boolean;
  sortOrder: number;
}

interface NearbyAttraction {
  name: string;
  category: string;
  description: string;
  distanceMiles: string;
  websiteUrl: string;
}

interface MediaItem {
  mediaId?: number;
  mediaType: string;
  imageType: string;
  url: string;
  caption: string;
  credit: string;
  isPrimary: boolean;
  sortOrder: number;
}

interface TeeBox {
  teeId?: number;
  teeName: string;
  color: string;
  gender: string;
  courseRating: string;
  slopeRating: string;
  totalYardage: string;
}

interface HoleData {
  holeId?: number;
  holeNumber: number;
  par: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CourseData = Record<string, any>;

export default function CourseEditorPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("Basic Info");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Course data
  const [course, setCourse] = useState<CourseData>({});
  const [dining, setDining] = useState<NearbyDining[]>([]);
  const [lodging, setLodging] = useState<NearbyLodging[]>([]);
  const [attractions, setAttractions] = useState<NearbyAttraction[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [teeBoxes, setTeeBoxes] = useState<TeeBox[]>([]);
  const [holes, setHoles] = useState<HoleData[]>([]);

  const showToast = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/admin/courses/${courseId}`, {
          headers: { "x-admin-key": localStorage.getItem("golfEQ_admin_key") || "" },
        });
        if (!res.ok) throw new Error("Failed to load course");
        const data = await res.json();

        // Separate relations from course fields
        const { nearbyDining: d, nearbyLodging: l, nearbyAttractions: a, media: m, teeBoxes: t, holes: h, rankings, chameleonScores, ...courseFields } = data;

        setCourse(courseFields);
        setDining(
          (d || []).map((item: CourseData) => ({
            name: item.name || "",
            cuisineType: item.cuisineType || "",
            priceLevel: item.priceLevel || "",
            rating: item.rating?.toString() || "",
            distanceMiles: item.distanceMiles?.toString() || "",
            description: item.description || "",
            address: item.address || "",
            phone: item.phone || "",
            websiteUrl: item.websiteUrl || "",
            isOnSite: item.isOnSite || false,
            sortOrder: item.sortOrder || 0,
          }))
        );
        setLodging(
          (l || []).map((item: CourseData) => ({
            name: item.name || "",
            lodgingType: item.lodgingType || "",
            priceTier: item.priceTier || "",
            avgPricePerNight: item.avgPricePerNight?.toString() || "",
            rating: item.rating?.toString() || "",
            distanceMiles: item.distanceMiles?.toString() || "",
            description: item.description || "",
            address: item.address || "",
            phone: item.phone || "",
            websiteUrl: item.websiteUrl || "",
            bookingUrl: item.bookingUrl || "",
            isOnSite: item.isOnSite || false,
            isPartner: item.isPartner || false,
            sortOrder: item.sortOrder || 0,
          }))
        );
        setAttractions(
          (a || []).map((item: CourseData) => ({
            name: item.name || "",
            category: item.category || "",
            description: item.description || "",
            distanceMiles: item.distanceMiles?.toString() || "",
            websiteUrl: item.websiteUrl || "",
          }))
        );
        setMedia(
          (m || []).map((item: CourseData) => ({
            mediaId: item.mediaId,
            mediaType: item.mediaType || "image",
            imageType: item.imageType || "",
            url: item.url || "",
            caption: item.caption || "",
            credit: item.credit || "",
            isPrimary: item.isPrimary || false,
            sortOrder: item.sortOrder || 0,
          }))
        );
        setTeeBoxes(
          (t || []).map((item: CourseData) => ({
            teeId: item.teeId,
            teeName: item.teeName || "",
            color: item.color || "",
            gender: item.gender || "",
            courseRating: item.courseRating?.toString() || "",
            slopeRating: item.slopeRating?.toString() || "",
            totalYardage: item.totalYardage?.toString() || "",
          }))
        );
        setHoles(
          (h || []).map((item: CourseData) => ({
            holeId: item.holeId,
            holeNumber: item.holeNumber,
            par: item.par?.toString() || "4",
          }))
        );
      } catch (err) {
        console.error(err);
        showToast("error", "Failed to load course");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [courseId, showToast]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Build update body - convert numeric strings
      const numericFields = [
        "par", "numHoles", "yearOpened", "renovationYear", "signatureHoleNumber",
      ];
      const decimalFields = [
        "latitude", "longitude", "greenFeeLow", "greenFeeHigh",
        "greenFeePeak", "greenFeeOffPeak", "greenFeeTwilight",
      ];
      const boolFields = [
        "isVerified", "isEnriched", "clubRentalAvailable",
        "onSiteLodging", "includesCart",
      ];

      const body: CourseData = {};
      for (const [k, v] of Object.entries(course)) {
        if (["courseId", "createdAt", "updatedAt"].includes(k)) continue;
        if (numericFields.includes(k)) {
          body[k] = v === "" || v === null ? null : parseInt(v);
        } else if (decimalFields.includes(k)) {
          body[k] = v === "" || v === null ? null : parseFloat(v);
        } else if (boolFields.includes(k)) {
          body[k] = Boolean(v);
        } else {
          body[k] = v === "" ? null : v;
        }
      }

      // Add nearby data
      body.dining = dining.map((d, i) => ({
        name: d.name,
        cuisineType: d.cuisineType || null,
        priceLevel: d.priceLevel || null,
        rating: d.rating ? parseFloat(d.rating) : null,
        distanceMiles: d.distanceMiles ? parseFloat(d.distanceMiles) : null,
        description: d.description || null,
        address: d.address || null,
        phone: d.phone || null,
        websiteUrl: d.websiteUrl || null,
        isOnSite: d.isOnSite,
        sortOrder: i,
      }));

      body.lodging = lodging.map((l, i) => ({
        name: l.name,
        lodgingType: l.lodgingType || null,
        priceTier: l.priceTier || null,
        avgPricePerNight: l.avgPricePerNight ? parseInt(l.avgPricePerNight) : null,
        rating: l.rating ? parseFloat(l.rating) : null,
        distanceMiles: l.distanceMiles ? parseFloat(l.distanceMiles) : null,
        description: l.description || null,
        address: l.address || null,
        phone: l.phone || null,
        websiteUrl: l.websiteUrl || null,
        bookingUrl: l.bookingUrl || null,
        isOnSite: l.isOnSite,
        isPartner: l.isPartner,
        sortOrder: i,
      }));

      body.attractions = attractions.map((a) => ({
        name: a.name,
        category: a.category || null,
        description: a.description || null,
        distanceMiles: a.distanceMiles ? parseFloat(a.distanceMiles) : null,
        websiteUrl: a.websiteUrl || null,
      }));

      const res = await fetch(`/api/admin/courses/${courseId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": localStorage.getItem("golfEQ_admin_key") || "",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed to save");
      showToast("success", "Course saved successfully");
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to save course");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: string, value: unknown) => {
    setCourse((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
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
          <div>
            <h1 className="text-2xl font-bold text-white">{course.courseName || "Course"}</h1>
            <p className="text-xs text-gray-500">ID: {courseId}</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium transition-colors"
          style={{ backgroundColor: "#22c55e", color: "#000" }}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            style={
              activeTab === tab
                ? { backgroundColor: "rgba(34,197,94,0.1)", color: "#22c55e" }
                : { color: "#9ca3af" }
            }
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div
        className="rounded-xl p-6"
        style={{ backgroundColor: "#111111", border: "1px solid #1f1f1f" }}
      >
        {activeTab === "Basic Info" && (
          <BasicInfoTab course={course} updateField={updateField} />
        )}
        {activeTab === "Pricing & Policies" && (
          <PricingTab course={course} updateField={updateField} />
        )}
        {activeTab === "Design & Character" && (
          <DesignTab course={course} updateField={updateField} />
        )}
        {activeTab === "Conditions" && (
          <ConditionsTab course={course} updateField={updateField} />
        )}
        {activeTab === "History" && (
          <HistoryTab course={course} updateField={updateField} />
        )}
        {activeTab === "Nearby" && (
          <NearbyTab
            dining={dining} setDining={setDining}
            lodging={lodging} setLodging={setLodging}
            attractions={attractions} setAttractions={setAttractions}
          />
        )}
        {activeTab === "Media" && (
          <MediaTab media={media} setMedia={setMedia} />
        )}
        {activeTab === "Tee Boxes & Holes" && (
          <TeeBoxesHolesTab
            teeBoxes={teeBoxes} setTeeBoxes={setTeeBoxes}
            holes={holes} setHoles={setHoles}
            numHoles={course.numHoles || 18}
          />
        )}
      </div>
    </div>
  );
}

/* ─── Shared Components ──────────────────────────────────────────── */

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
        style={{ backgroundColor: "#0a0a0a", border: "1px solid #1f1f1f" }}
      />
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
      <textarea
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none resize-y"
        style={{ backgroundColor: "#0a0a0a", border: "1px solid #1f1f1f" }}
      />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
        style={{ backgroundColor: "#0a0a0a", border: "1px solid #1f1f1f" }}
      >
        <option value="">—</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div
        className="relative w-10 h-5 rounded-full transition-colors"
        style={{ backgroundColor: checked ? "#22c55e" : "#333" }}
        onClick={() => onChange(!checked)}
      >
        <div
          className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform"
          style={{ left: checked ? "22px" : "2px" }}
        />
      </div>
      <span className="text-sm text-gray-300">{label}</span>
    </label>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold text-white mb-4">{children}</h3>;
}

/* ─── Tab: Basic Info ────────────────────────────────────────────── */

function BasicInfoTab({ course, updateField }: { course: CourseData; updateField: (f: string, v: unknown) => void }) {
  return (
    <div className="space-y-6">
      <SectionTitle>Core Details</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Course Name" value={course.courseName || ""} onChange={(v) => updateField("courseName", v)} className="md:col-span-2" />
        <Field label="Facility Name" value={course.facilityName || ""} onChange={(v) => updateField("facilityName", v)} />
        <Field label="Website URL" value={course.websiteUrl || ""} onChange={(v) => updateField("websiteUrl", v)} />
        <Field label="Phone" value={course.phone || ""} onChange={(v) => updateField("phone", v)} />
        <Field label="Email" value={course.email || ""} onChange={(v) => updateField("email", v)} />
      </div>

      <SectionTitle>Location</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Field label="Street Address" value={course.streetAddress || ""} onChange={(v) => updateField("streetAddress", v)} className="md:col-span-2 lg:col-span-3" />
        <Field label="City" value={course.city || ""} onChange={(v) => updateField("city", v)} />
        <Field label="State" value={course.state || ""} onChange={(v) => updateField("state", v)} />
        <Field label="Zip Code" value={course.zipCode || ""} onChange={(v) => updateField("zipCode", v)} />
        <Field label="Country" value={course.country || "United States"} onChange={(v) => updateField("country", v)} />
        <Field label="Latitude" value={course.latitude?.toString() || ""} onChange={(v) => updateField("latitude", v)} type="number" />
        <Field label="Longitude" value={course.longitude?.toString() || ""} onChange={(v) => updateField("longitude", v)} type="number" />
      </div>

      <SectionTitle>Classification</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Select
          label="Access Type"
          value={course.accessType || ""}
          onChange={(v) => updateField("accessType", v)}
          options={[
            { label: "Public", value: "Public" },
            { label: "Private", value: "Private" },
            { label: "Resort", value: "Resort" },
            { label: "Semi-Private", value: "Semi-Private" },
            { label: "Military", value: "Military" },
          ]}
        />
        <Select
          label="Course Type"
          value={course.courseType || ""}
          onChange={(v) => updateField("courseType", v)}
          options={[
            { label: "Links", value: "Links" },
            { label: "Parkland", value: "Parkland" },
            { label: "Desert", value: "Desert" },
            { label: "Mountain", value: "Mountain" },
            { label: "Heathland", value: "Heathland" },
            { label: "Tropical", value: "Tropical" },
          ]}
        />
        <Select
          label="Course Style"
          value={course.courseStyle || ""}
          onChange={(v) => updateField("courseStyle", v)}
          options={[
            { label: "Traditional", value: "Traditional" },
            { label: "Modern", value: "Modern" },
            { label: "Classic", value: "Classic" },
            { label: "Resort", value: "Resort" },
          ]}
        />
        <Field label="Number of Holes" value={course.numHoles?.toString() || "18"} onChange={(v) => updateField("numHoles", v)} type="number" />
        <Field label="Par" value={course.par?.toString() || ""} onChange={(v) => updateField("par", v)} type="number" />
        <Field label="Year Opened" value={course.yearOpened?.toString() || ""} onChange={(v) => updateField("yearOpened", v)} type="number" />
      </div>

      <SectionTitle>Status</SectionTitle>
      <div className="flex flex-wrap gap-6">
        <Toggle label="Verified" checked={course.isVerified || false} onChange={(v) => updateField("isVerified", v)} />
        <Toggle label="Enriched" checked={course.isEnriched || false} onChange={(v) => updateField("isEnriched", v)} />
      </div>

      <SectionTitle>Description</SectionTitle>
      <TextArea label="Description" value={course.description || ""} onChange={(v) => updateField("description", v)} rows={4} />
      <Field label="Tagline" value={course.tagline || ""} onChange={(v) => updateField("tagline", v)} />
    </div>
  );
}

/* ─── Tab: Pricing & Policies ────────────────────────────────────── */

function PricingTab({ course, updateField }: { course: CourseData; updateField: (f: string, v: unknown) => void }) {
  return (
    <div className="space-y-6">
      <SectionTitle>Green Fees</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Field label="Green Fee (Low)" value={course.greenFeeLow?.toString() || ""} onChange={(v) => updateField("greenFeeLow", v)} type="number" placeholder="$" />
        <Field label="Green Fee (High)" value={course.greenFeeHigh?.toString() || ""} onChange={(v) => updateField("greenFeeHigh", v)} type="number" placeholder="$" />
        <Field label="Green Fee (Peak)" value={course.greenFeePeak?.toString() || ""} onChange={(v) => updateField("greenFeePeak", v)} type="number" placeholder="$" />
        <Field label="Green Fee (Off-Peak)" value={course.greenFeeOffPeak?.toString() || ""} onChange={(v) => updateField("greenFeeOffPeak", v)} type="number" placeholder="$" />
        <Field label="Green Fee (Twilight)" value={course.greenFeeTwilight?.toString() || ""} onChange={(v) => updateField("greenFeeTwilight", v)} type="number" placeholder="$" />
        <Select
          label="Price Tier"
          value={course.priceTier || ""}
          onChange={(v) => updateField("priceTier", v)}
          options={[
            { label: "$", value: "$" },
            { label: "$$", value: "$$" },
            { label: "$$$", value: "$$$" },
            { label: "$$$$", value: "$$$$" },
          ]}
        />
        <Select
          label="Currency"
          value={course.greenFeeCurrency || "USD"}
          onChange={(v) => updateField("greenFeeCurrency", v)}
          options={[
            { label: "USD", value: "USD" },
            { label: "EUR", value: "EUR" },
            { label: "GBP", value: "GBP" },
          ]}
        />
        <Toggle label="Includes Cart" checked={course.includesCart || false} onChange={(v) => updateField("includesCart", v)} />
      </div>

      <SectionTitle>Walking & Carts</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Walking Policy"
          value={course.walkingPolicy || ""}
          onChange={(v) => updateField("walkingPolicy", v)}
          options={[
            { label: "Walking Only", value: "Walking Only" },
            { label: "Walking Allowed", value: "Walking Allowed" },
            { label: "Cart Required", value: "Cart Required" },
            { label: "Restricted Times", value: "Restricted Times" },
          ]}
        />
        <Field label="Cart Policy" value={course.cartPolicy || ""} onChange={(v) => updateField("cartPolicy", v)} />
        <Field label="Cart Fee" value={course.cartFee || ""} onChange={(v) => updateField("cartFee", v)} />
      </div>

      <SectionTitle>Caddie</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Caddie Availability"
          value={course.caddieAvailability || ""}
          onChange={(v) => updateField("caddieAvailability", v)}
          options={[
            { label: "Available", value: "Available" },
            { label: "Required", value: "Required" },
            { label: "Not Available", value: "Not Available" },
          ]}
        />
        <Field label="Caddie Fee" value={course.caddieFee || ""} onChange={(v) => updateField("caddieFee", v)} />
      </div>

      <SectionTitle>Policies & Access</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Dress Code" value={course.dressCode || ""} onChange={(v) => updateField("dressCode", v)} />
        <Field label="Cell Phone Policy" value={course.cellPhonePolicy || ""} onChange={(v) => updateField("cellPhonePolicy", v)} />
        <Field label="Booking URL" value={course.bookingUrl || ""} onChange={(v) => updateField("bookingUrl", v)} />
        <Toggle label="Club Rental Available" checked={course.clubRentalAvailable || false} onChange={(v) => updateField("clubRentalAvailable", v)} />
      </div>

      <SectionTitle>Guest Access</SectionTitle>
      <div className="grid grid-cols-1 gap-4">
        <TextArea label="How to Get On" value={course.howToGetOn || ""} onChange={(v) => updateField("howToGetOn", v)} />
        <Field label="Resort/Affiliate Access" value={course.resortAffiliateAccess || ""} onChange={(v) => updateField("resortAffiliateAccess", v)} />
        <Field label="Guest Policy" value={course.guestPolicy || ""} onChange={(v) => updateField("guestPolicy", v)} />
      </div>

      <SectionTitle>Resort</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Toggle label="On-Site Lodging" checked={course.onSiteLodging || false} onChange={(v) => updateField("onSiteLodging", v)} />
        <Field label="Resort Name" value={course.resortNameField || ""} onChange={(v) => updateField("resortNameField", v)} />
        <Field label="Resort Booking URL" value={course.resortBookingUrl || ""} onChange={(v) => updateField("resortBookingUrl", v)} />
      </div>
    </div>
  );
}

/* ─── Tab: Design & Character ────────────────────────────────────── */

function DesignTab({ course, updateField }: { course: CourseData; updateField: (f: string, v: unknown) => void }) {
  return (
    <div className="space-y-6">
      <SectionTitle>Architects</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Original Architect" value={course.originalArchitect || ""} onChange={(v) => updateField("originalArchitect", v)} />
        <Field label="Renovation Architect" value={course.renovationArchitect || ""} onChange={(v) => updateField("renovationArchitect", v)} />
        <Field label="Renovation Year" value={course.renovationYear?.toString() || ""} onChange={(v) => updateField("renovationYear", v)} type="number" />
        <Field label="Renovation Notes" value={course.renovationNotes || ""} onChange={(v) => updateField("renovationNotes", v)} />
      </div>
      <TextArea label="Architect Bio" value={course.architectBio || ""} onChange={(v) => updateField("architectBio", v)} />
      <TextArea label="Design Philosophy" value={course.designPhilosophy || ""} onChange={(v) => updateField("designPhilosophy", v)} />

      <SectionTitle>Signature Hole</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Signature Hole Number" value={course.signatureHoleNumber?.toString() || ""} onChange={(v) => updateField("signatureHoleNumber", v)} type="number" />
      </div>
      <TextArea label="Signature Hole Description" value={course.signatureHoleDescription || ""} onChange={(v) => updateField("signatureHoleDescription", v)} />

      <SectionTitle>Character</SectionTitle>
      <TextArea label="What to Expect" value={course.whatToExpect || ""} onChange={(v) => updateField("whatToExpect", v)} />
      <TextArea label="Course Strategy" value={course.courseStrategy || ""} onChange={(v) => updateField("courseStrategy", v)} />
      <TextArea label="Pace of Play Notes" value={course.paceOfPlayNotes || ""} onChange={(v) => updateField("paceOfPlayNotes", v)} />

      <SectionTitle>Best Time to Play</SectionTitle>
      <Field label="Best Time to Play" value={course.bestTimeToPlay || ""} onChange={(v) => updateField("bestTimeToPlay", v)} />
    </div>
  );
}

/* ─── Tab: Conditions ────────────────────────────────────────────── */

function ConditionsTab({ course, updateField }: { course: CourseData; updateField: (f: string, v: unknown) => void }) {
  return (
    <div className="space-y-6">
      <SectionTitle>Turf</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Fairway Grass" value={course.fairwayGrass || ""} onChange={(v) => updateField("fairwayGrass", v)} />
        <Field label="Green Grass" value={course.greenGrass || ""} onChange={(v) => updateField("greenGrass", v)} />
        <Field label="Green Speed" value={course.greenSpeed || ""} onChange={(v) => updateField("greenSpeed", v)} />
      </div>

      <SectionTitle>Maintenance</SectionTitle>
      <Field label="Aeration Schedule" value={course.aerationSchedule || ""} onChange={(v) => updateField("aerationSchedule", v)} />
      <Field label="Best Condition Months" value={course.bestConditionMonths || ""} onChange={(v) => updateField("bestConditionMonths", v)} />
      <Field label="Golf Season" value={course.golfSeason || ""} onChange={(v) => updateField("golfSeason", v)} />
    </div>
  );
}

/* ─── Tab: History ────────────────────────────────────────────────── */

function HistoryTab({ course, updateField }: { course: CourseData; updateField: (f: string, v: unknown) => void }) {
  const parseJson = (val: unknown): string => {
    if (!val) return "";
    if (typeof val === "string") return val;
    return JSON.stringify(val, null, 2);
  };

  const setJson = (field: string, val: string) => {
    try {
      updateField(field, val ? JSON.parse(val) : null);
    } catch {
      // Keep as string while editing
      updateField(field, val);
    }
  };

  return (
    <div className="space-y-6">
      <SectionTitle>Championship History</SectionTitle>
      <TextArea label="Championship History (JSON)" value={parseJson(course.championshipHistory)} onChange={(v) => setJson("championshipHistory", v)} rows={5} />

      <SectionTitle>Famous Moments</SectionTitle>
      <TextArea label="Famous Moments (JSON)" value={parseJson(course.famousMoments)} onChange={(v) => setJson("famousMoments", v)} rows={5} />

      <SectionTitle>Upcoming Events</SectionTitle>
      <TextArea label="Upcoming Events (JSON)" value={parseJson(course.upcomingEvents)} onChange={(v) => setJson("upcomingEvents", v)} rows={5} />

      <SectionTitle>Insider Tips</SectionTitle>
      <TextArea label="Insider Tips (JSON)" value={parseJson(course.insiderTips)} onChange={(v) => setJson("insiderTips", v)} rows={5} />
    </div>
  );
}

/* ─── Tab: Nearby ─────────────────────────────────────────────────── */

function NearbyTab({
  dining, setDining,
  lodging, setLodging,
  attractions, setAttractions,
}: {
  dining: NearbyDining[];
  setDining: (v: NearbyDining[]) => void;
  lodging: NearbyLodging[];
  setLodging: (v: NearbyLodging[]) => void;
  attractions: NearbyAttraction[];
  setAttractions: (v: NearbyAttraction[]) => void;
}) {
  return (
    <div className="space-y-8">
      {/* Dining */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <SectionTitle>Nearby Dining ({dining.length})</SectionTitle>
          <button
            onClick={() =>
              setDining([...dining, {
                name: "", cuisineType: "", priceLevel: "", rating: "",
                distanceMiles: "", description: "", address: "", phone: "",
                websiteUrl: "", isOnSite: false, sortOrder: dining.length,
              }])
            }
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg"
            style={{ backgroundColor: "rgba(34,197,94,0.1)", color: "#22c55e" }}
          >
            <Plus className="h-3 w-3" /> Add
          </button>
        </div>
        {dining.map((d, i) => (
          <div
            key={i}
            className="rounded-lg p-4 mb-3"
            style={{ backgroundColor: "#0a0a0a", border: "1px solid #1f1f1f" }}
          >
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs text-gray-500">#{i + 1}</span>
              <button
                onClick={() => setDining(dining.filter((_, j) => j !== i))}
                className="text-red-400 hover:text-red-300"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                placeholder="Name"
                value={d.name}
                onChange={(e) => {
                  const updated = [...dining];
                  updated[i] = { ...d, name: e.target.value };
                  setDining(updated);
                }}
                className="rounded px-3 py-1.5 text-sm text-white outline-none"
                style={{ backgroundColor: "#111111", border: "1px solid #1f1f1f" }}
              />
              <input
                placeholder="Cuisine Type"
                value={d.cuisineType}
                onChange={(e) => {
                  const updated = [...dining];
                  updated[i] = { ...d, cuisineType: e.target.value };
                  setDining(updated);
                }}
                className="rounded px-3 py-1.5 text-sm text-white outline-none"
                style={{ backgroundColor: "#111111", border: "1px solid #1f1f1f" }}
              />
              <input
                placeholder="Price Level"
                value={d.priceLevel}
                onChange={(e) => {
                  const updated = [...dining];
                  updated[i] = { ...d, priceLevel: e.target.value };
                  setDining(updated);
                }}
                className="rounded px-3 py-1.5 text-sm text-white outline-none"
                style={{ backgroundColor: "#111111", border: "1px solid #1f1f1f" }}
              />
              <input
                placeholder="Rating"
                value={d.rating}
                onChange={(e) => {
                  const updated = [...dining];
                  updated[i] = { ...d, rating: e.target.value };
                  setDining(updated);
                }}
                className="rounded px-3 py-1.5 text-sm text-white outline-none"
                style={{ backgroundColor: "#111111", border: "1px solid #1f1f1f" }}
              />
              <input
                placeholder="Distance (miles)"
                value={d.distanceMiles}
                onChange={(e) => {
                  const updated = [...dining];
                  updated[i] = { ...d, distanceMiles: e.target.value };
                  setDining(updated);
                }}
                className="rounded px-3 py-1.5 text-sm text-white outline-none"
                style={{ backgroundColor: "#111111", border: "1px solid #1f1f1f" }}
              />
              <input
                placeholder="Phone"
                value={d.phone}
                onChange={(e) => {
                  const updated = [...dining];
                  updated[i] = { ...d, phone: e.target.value };
                  setDining(updated);
                }}
                className="rounded px-3 py-1.5 text-sm text-white outline-none"
                style={{ backgroundColor: "#111111", border: "1px solid #1f1f1f" }}
              />
              <input
                placeholder="Address"
                value={d.address}
                onChange={(e) => {
                  const updated = [...dining];
                  updated[i] = { ...d, address: e.target.value };
                  setDining(updated);
                }}
                className="rounded px-3 py-1.5 text-sm text-white outline-none col-span-full"
                style={{ backgroundColor: "#111111", border: "1px solid #1f1f1f" }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Lodging */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <SectionTitle>Nearby Lodging ({lodging.length})</SectionTitle>
          <button
            onClick={() =>
              setLodging([...lodging, {
                name: "", lodgingType: "", priceTier: "", avgPricePerNight: "",
                rating: "", distanceMiles: "", description: "", address: "",
                phone: "", websiteUrl: "", bookingUrl: "", isOnSite: false,
                isPartner: false, sortOrder: lodging.length,
              }])
            }
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg"
            style={{ backgroundColor: "rgba(34,197,94,0.1)", color: "#22c55e" }}
          >
            <Plus className="h-3 w-3" /> Add
          </button>
        </div>
        {lodging.map((l, i) => (
          <div
            key={i}
            className="rounded-lg p-4 mb-3"
            style={{ backgroundColor: "#0a0a0a", border: "1px solid #1f1f1f" }}
          >
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs text-gray-500">#{i + 1}</span>
              <button
                onClick={() => setLodging(lodging.filter((_, j) => j !== i))}
                className="text-red-400 hover:text-red-300"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                placeholder="Name"
                value={l.name}
                onChange={(e) => {
                  const updated = [...lodging];
                  updated[i] = { ...l, name: e.target.value };
                  setLodging(updated);
                }}
                className="rounded px-3 py-1.5 text-sm text-white outline-none"
                style={{ backgroundColor: "#111111", border: "1px solid #1f1f1f" }}
              />
              <input
                placeholder="Lodging Type"
                value={l.lodgingType}
                onChange={(e) => {
                  const updated = [...lodging];
                  updated[i] = { ...l, lodgingType: e.target.value };
                  setLodging(updated);
                }}
                className="rounded px-3 py-1.5 text-sm text-white outline-none"
                style={{ backgroundColor: "#111111", border: "1px solid #1f1f1f" }}
              />
              <input
                placeholder="Avg Price/Night"
                value={l.avgPricePerNight}
                onChange={(e) => {
                  const updated = [...lodging];
                  updated[i] = { ...l, avgPricePerNight: e.target.value };
                  setLodging(updated);
                }}
                className="rounded px-3 py-1.5 text-sm text-white outline-none"
                style={{ backgroundColor: "#111111", border: "1px solid #1f1f1f" }}
              />
              <input
                placeholder="Rating"
                value={l.rating}
                onChange={(e) => {
                  const updated = [...lodging];
                  updated[i] = { ...l, rating: e.target.value };
                  setLodging(updated);
                }}
                className="rounded px-3 py-1.5 text-sm text-white outline-none"
                style={{ backgroundColor: "#111111", border: "1px solid #1f1f1f" }}
              />
              <input
                placeholder="Distance (miles)"
                value={l.distanceMiles}
                onChange={(e) => {
                  const updated = [...lodging];
                  updated[i] = { ...l, distanceMiles: e.target.value };
                  setLodging(updated);
                }}
                className="rounded px-3 py-1.5 text-sm text-white outline-none"
                style={{ backgroundColor: "#111111", border: "1px solid #1f1f1f" }}
              />
              <input
                placeholder="Phone"
                value={l.phone}
                onChange={(e) => {
                  const updated = [...lodging];
                  updated[i] = { ...l, phone: e.target.value };
                  setLodging(updated);
                }}
                className="rounded px-3 py-1.5 text-sm text-white outline-none"
                style={{ backgroundColor: "#111111", border: "1px solid #1f1f1f" }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Attractions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <SectionTitle>Nearby Attractions ({attractions.length})</SectionTitle>
          <button
            onClick={() =>
              setAttractions([...attractions, {
                name: "", category: "", description: "", distanceMiles: "", websiteUrl: "",
              }])
            }
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg"
            style={{ backgroundColor: "rgba(34,197,94,0.1)", color: "#22c55e" }}
          >
            <Plus className="h-3 w-3" /> Add
          </button>
        </div>
        {attractions.map((a, i) => (
          <div
            key={i}
            className="rounded-lg p-4 mb-3"
            style={{ backgroundColor: "#0a0a0a", border: "1px solid #1f1f1f" }}
          >
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs text-gray-500">#{i + 1}</span>
              <button
                onClick={() => setAttractions(attractions.filter((_, j) => j !== i))}
                className="text-red-400 hover:text-red-300"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                placeholder="Name"
                value={a.name}
                onChange={(e) => {
                  const updated = [...attractions];
                  updated[i] = { ...a, name: e.target.value };
                  setAttractions(updated);
                }}
                className="rounded px-3 py-1.5 text-sm text-white outline-none"
                style={{ backgroundColor: "#111111", border: "1px solid #1f1f1f" }}
              />
              <input
                placeholder="Category"
                value={a.category}
                onChange={(e) => {
                  const updated = [...attractions];
                  updated[i] = { ...a, category: e.target.value };
                  setAttractions(updated);
                }}
                className="rounded px-3 py-1.5 text-sm text-white outline-none"
                style={{ backgroundColor: "#111111", border: "1px solid #1f1f1f" }}
              />
              <input
                placeholder="Distance (miles)"
                value={a.distanceMiles}
                onChange={(e) => {
                  const updated = [...attractions];
                  updated[i] = { ...a, distanceMiles: e.target.value };
                  setAttractions(updated);
                }}
                className="rounded px-3 py-1.5 text-sm text-white outline-none"
                style={{ backgroundColor: "#111111", border: "1px solid #1f1f1f" }}
              />
              <input
                placeholder="Description"
                value={a.description}
                onChange={(e) => {
                  const updated = [...attractions];
                  updated[i] = { ...a, description: e.target.value };
                  setAttractions(updated);
                }}
                className="rounded px-3 py-1.5 text-sm text-white outline-none col-span-full"
                style={{ backgroundColor: "#111111", border: "1px solid #1f1f1f" }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Tab: Media ──────────────────────────────────────────────────── */

function MediaTab({
  media,
  setMedia,
}: {
  media: MediaItem[];
  setMedia: (v: MediaItem[]) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <SectionTitle>Media ({media.length})</SectionTitle>
        <button
          onClick={() =>
            setMedia([...media, {
              mediaType: "image", imageType: "", url: "", caption: "",
              credit: "", isPrimary: false, sortOrder: media.length,
            }])
          }
          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg"
          style={{ backgroundColor: "rgba(34,197,94,0.1)", color: "#22c55e" }}
        >
          <Plus className="h-3 w-3" /> Add Media
        </button>
      </div>
      {media.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-8">No media items yet</p>
      )}
      {media.map((m, i) => (
        <div
          key={i}
          className="rounded-lg p-4 mb-3"
          style={{ backgroundColor: "#0a0a0a", border: "1px solid #1f1f1f" }}
        >
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">#{i + 1}</span>
              {m.isPrimary && (
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(34,197,94,0.15)", color: "#22c55e" }}>
                  Primary
                </span>
              )}
            </div>
            <button
              onClick={() => setMedia(media.filter((_, j) => j !== i))}
              className="text-red-400 hover:text-red-300"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              placeholder="URL"
              value={m.url}
              onChange={(e) => {
                const updated = [...media];
                updated[i] = { ...m, url: e.target.value };
                setMedia(updated);
              }}
              className="rounded px-3 py-1.5 text-sm text-white outline-none col-span-full"
              style={{ backgroundColor: "#111111", border: "1px solid #1f1f1f" }}
            />
            <input
              placeholder="Caption"
              value={m.caption}
              onChange={(e) => {
                const updated = [...media];
                updated[i] = { ...m, caption: e.target.value };
                setMedia(updated);
              }}
              className="rounded px-3 py-1.5 text-sm text-white outline-none"
              style={{ backgroundColor: "#111111", border: "1px solid #1f1f1f" }}
            />
            <input
              placeholder="Credit"
              value={m.credit}
              onChange={(e) => {
                const updated = [...media];
                updated[i] = { ...m, credit: e.target.value };
                setMedia(updated);
              }}
              className="rounded px-3 py-1.5 text-sm text-white outline-none"
              style={{ backgroundColor: "#111111", border: "1px solid #1f1f1f" }}
            />
            <select
              value={m.mediaType}
              onChange={(e) => {
                const updated = [...media];
                updated[i] = { ...m, mediaType: e.target.value };
                setMedia(updated);
              }}
              className="rounded px-3 py-1.5 text-sm text-white outline-none"
              style={{ backgroundColor: "#111111", border: "1px solid #1f1f1f" }}
            >
              <option value="image">Image</option>
              <option value="video">Video</option>
            </select>
            <input
              placeholder="Image Type (e.g., hero, gallery)"
              value={m.imageType}
              onChange={(e) => {
                const updated = [...media];
                updated[i] = { ...m, imageType: e.target.value };
                setMedia(updated);
              }}
              className="rounded px-3 py-1.5 text-sm text-white outline-none"
              style={{ backgroundColor: "#111111", border: "1px solid #1f1f1f" }}
            />
          </div>
          <div className="mt-3">
            <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={m.isPrimary}
                onChange={(e) => {
                  const updated = media.map((item, j) => ({
                    ...item,
                    isPrimary: j === i ? e.target.checked : false,
                  }));
                  setMedia(updated);
                }}
                className="accent-green-500"
              />
              Set as primary
            </label>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Tab: Tee Boxes & Holes ──────────────────────────────────────── */

function TeeBoxesHolesTab({
  teeBoxes,
  setTeeBoxes,
  holes,
  setHoles,
  numHoles,
}: {
  teeBoxes: TeeBox[];
  setTeeBoxes: (v: TeeBox[]) => void;
  holes: HoleData[];
  setHoles: (v: HoleData[]) => void;
  numHoles: number;
}) {
  const initHoles = () => {
    const newHoles: HoleData[] = [];
    for (let i = 1; i <= numHoles; i++) {
      const existing = holes.find((h) => h.holeNumber === i);
      newHoles.push(existing || { holeNumber: i, par: "4" });
    }
    setHoles(newHoles);
  };

  return (
    <div className="space-y-8">
      {/* Tee Boxes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <SectionTitle>Tee Boxes ({teeBoxes.length})</SectionTitle>
          <button
            onClick={() =>
              setTeeBoxes([...teeBoxes, {
                teeName: "", color: "", gender: "",
                courseRating: "", slopeRating: "", totalYardage: "",
              }])
            }
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg"
            style={{ backgroundColor: "rgba(34,197,94,0.1)", color: "#22c55e" }}
          >
            <Plus className="h-3 w-3" /> Add Tee Box
          </button>
        </div>
        {teeBoxes.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid #1f1f1f" }}>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Name</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Color</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Gender</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Rating</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Slope</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Yardage</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {teeBoxes.map((t, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #1a1a1a" }}>
                    <td className="px-3 py-2">
                      <input
                        value={t.teeName}
                        onChange={(e) => {
                          const updated = [...teeBoxes];
                          updated[i] = { ...t, teeName: e.target.value };
                          setTeeBoxes(updated);
                        }}
                        className="w-full rounded px-2 py-1 text-sm text-white outline-none"
                        style={{ backgroundColor: "#0a0a0a", border: "1px solid #1f1f1f" }}
                        placeholder="Championship"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={t.color}
                        onChange={(e) => {
                          const updated = [...teeBoxes];
                          updated[i] = { ...t, color: e.target.value };
                          setTeeBoxes(updated);
                        }}
                        className="w-24 rounded px-2 py-1 text-sm text-white outline-none"
                        style={{ backgroundColor: "#0a0a0a", border: "1px solid #1f1f1f" }}
                        placeholder="Blue"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={t.gender}
                        onChange={(e) => {
                          const updated = [...teeBoxes];
                          updated[i] = { ...t, gender: e.target.value };
                          setTeeBoxes(updated);
                        }}
                        className="rounded px-2 py-1 text-sm text-white outline-none"
                        style={{ backgroundColor: "#0a0a0a", border: "1px solid #1f1f1f" }}
                      >
                        <option value="">—</option>
                        <option value="Men">Men</option>
                        <option value="Women">Women</option>
                        <option value="All">All</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={t.courseRating}
                        onChange={(e) => {
                          const updated = [...teeBoxes];
                          updated[i] = { ...t, courseRating: e.target.value };
                          setTeeBoxes(updated);
                        }}
                        className="w-20 rounded px-2 py-1 text-sm text-white outline-none"
                        style={{ backgroundColor: "#0a0a0a", border: "1px solid #1f1f1f" }}
                        placeholder="72.5"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={t.slopeRating}
                        onChange={(e) => {
                          const updated = [...teeBoxes];
                          updated[i] = { ...t, slopeRating: e.target.value };
                          setTeeBoxes(updated);
                        }}
                        className="w-20 rounded px-2 py-1 text-sm text-white outline-none"
                        style={{ backgroundColor: "#0a0a0a", border: "1px solid #1f1f1f" }}
                        placeholder="135"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={t.totalYardage}
                        onChange={(e) => {
                          const updated = [...teeBoxes];
                          updated[i] = { ...t, totalYardage: e.target.value };
                          setTeeBoxes(updated);
                        }}
                        className="w-24 rounded px-2 py-1 text-sm text-white outline-none"
                        style={{ backgroundColor: "#0a0a0a", border: "1px solid #1f1f1f" }}
                        placeholder="7200"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => setTeeBoxes(teeBoxes.filter((_, j) => j !== i))}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Holes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <SectionTitle>Holes ({holes.length})</SectionTitle>
          {holes.length === 0 && (
            <button
              onClick={initHoles}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg"
              style={{ backgroundColor: "rgba(34,197,94,0.1)", color: "#22c55e" }}
            >
              <Plus className="h-3 w-3" /> Initialize {numHoles} Holes
            </button>
          )}
        </div>
        {holes.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {holes.map((h, i) => (
              <div
                key={i}
                className="rounded-lg p-3 text-center"
                style={{ backgroundColor: "#0a0a0a", border: "1px solid #1f1f1f" }}
              >
                <div className="text-xs text-gray-500 mb-1">Hole {h.holeNumber}</div>
                <select
                  value={h.par}
                  onChange={(e) => {
                    const updated = [...holes];
                    updated[i] = { ...h, par: e.target.value };
                    setHoles(updated);
                  }}
                  className="w-full rounded px-2 py-1 text-sm text-white text-center outline-none"
                  style={{ backgroundColor: "#111111", border: "1px solid #1f1f1f" }}
                >
                  <option value="3">Par 3</option>
                  <option value="4">Par 4</option>
                  <option value="5">Par 5</option>
                  <option value="6">Par 6</option>
                </select>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
