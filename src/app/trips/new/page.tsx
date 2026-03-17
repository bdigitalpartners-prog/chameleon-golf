"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  MapPin,
  Calendar,
  Users,
  DollarSign,
  ChevronRight,
  ChevronLeft,
  Check,
  Plane,
} from "lucide-react";

const STEPS = ["Destination", "Dates", "Group", "Budget"] as const;
type Step = (typeof STEPS)[number];

export default function NewTripPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [groupSize, setGroupSize] = useState("4");
  const [budget, setBudget] = useState("");

  if (authStatus === "loading") {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--cg-accent)" }} />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <Plane className="mx-auto h-16 w-16" style={{ color: "var(--cg-text-muted)" }} />
        <h1 className="mt-4 font-display text-2xl font-bold" style={{ color: "var(--cg-text-primary)" }}>
          Sign in to create a trip
        </h1>
      </div>
    );
  }

  const canAdvance = () => {
    switch (currentStep) {
      case 0:
        return name.trim().length > 0 && destination.trim().length > 0;
      case 1:
        return startDate && endDate && new Date(endDate) >= new Date(startDate);
      case 2:
        return Number(groupSize) > 0;
      case 3:
        return true; // Budget is optional
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          destination: destination.trim(),
          description: description.trim() || null,
          startDate,
          endDate,
          groupSize: Number(groupSize),
          budget: budget.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create trip");
      }

      const trip = await res.json();
      router.push(`/trips/${trip.id}`);
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  const inputStyle = {
    backgroundColor: "var(--cg-bg-tertiary)",
    color: "var(--cg-text-primary)",
    border: "1px solid var(--cg-border)",
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Header */}
      <h1 className="font-display text-2xl font-bold mb-2" style={{ color: "var(--cg-text-primary)" }}>
        Plan a New Trip
      </h1>
      <p className="text-sm mb-8" style={{ color: "var(--cg-text-muted)" }}>
        Set up your golf getaway in a few steps
      </p>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((step, i) => (
          <div key={step} className="flex items-center gap-2 flex-1">
            <div
              className="flex items-center justify-center h-8 w-8 rounded-full text-xs font-bold flex-shrink-0 transition-all"
              style={{
                backgroundColor:
                  i < currentStep
                    ? "var(--cg-accent)"
                    : i === currentStep
                      ? "var(--cg-accent)"
                      : "var(--cg-bg-tertiary)",
                color:
                  i <= currentStep
                    ? "var(--cg-text-inverse)"
                    : "var(--cg-text-muted)",
              }}
            >
              {i < currentStep ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span
              className="text-xs font-medium hidden sm:block"
              style={{
                color: i <= currentStep ? "var(--cg-text-primary)" : "var(--cg-text-muted)",
              }}
            >
              {step}
            </span>
            {i < STEPS.length - 1 && (
              <div
                className="flex-1 h-px"
                style={{
                  backgroundColor:
                    i < currentStep ? "var(--cg-accent)" : "var(--cg-border)",
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div
        className="rounded-xl p-6"
        style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
      >
        {/* Step 1: Destination */}
        {currentStep === 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5" style={{ color: "var(--cg-accent)" }} />
              <h2 className="font-display text-lg font-semibold" style={{ color: "var(--cg-text-primary)" }}>
                Where are you heading?
              </h2>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--cg-text-secondary)" }}>
                Trip Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Scottsdale Spring Trip 2026"
                className="w-full rounded-lg px-4 py-2.5 text-sm"
                style={inputStyle}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--cg-text-secondary)" }}>
                Destination
              </label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g., Scottsdale, AZ"
                className="w-full rounded-lg px-4 py-2.5 text-sm"
                style={inputStyle}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--cg-text-secondary)" }}>
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Notes about the trip..."
                rows={3}
                className="w-full rounded-lg px-4 py-2.5 text-sm resize-none"
                style={inputStyle}
              />
            </div>
          </div>
        )}

        {/* Step 2: Dates */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5" style={{ color: "var(--cg-accent)" }} />
              <h2 className="font-display text-lg font-semibold" style={{ color: "var(--cg-text-primary)" }}>
                When are you going?
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--cg-text-secondary)" }}>
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-lg px-4 py-2.5 text-sm"
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--cg-text-secondary)" }}>
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  className="w-full rounded-lg px-4 py-2.5 text-sm"
                  style={inputStyle}
                />
              </div>
            </div>

            {startDate && endDate && new Date(endDate) >= new Date(startDate) && (
              <p className="text-sm" style={{ color: "var(--cg-text-muted)" }}>
                {Math.ceil(
                  (new Date(endDate).getTime() - new Date(startDate).getTime()) /
                    (1000 * 60 * 60 * 24)
                ) + 1}{" "}
                days
              </p>
            )}
          </div>
        )}

        {/* Step 3: Group */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5" style={{ color: "var(--cg-accent)" }} />
              <h2 className="font-display text-lg font-semibold" style={{ color: "var(--cg-text-primary)" }}>
                How many golfers?
              </h2>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--cg-text-secondary)" }}>
                Group Size
              </label>
              <input
                type="number"
                value={groupSize}
                onChange={(e) => setGroupSize(e.target.value)}
                min={1}
                max={24}
                className="w-full rounded-lg px-4 py-2.5 text-sm"
                style={inputStyle}
              />
            </div>

            <p className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
              You can invite participants after creating the trip. The group match score will
              improve as more members add their EQ weight profiles.
            </p>
          </div>
        )}

        {/* Step 4: Budget */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="h-5 w-5" style={{ color: "var(--cg-accent)" }} />
              <h2 className="font-display text-lg font-semibold" style={{ color: "var(--cg-text-primary)" }}>
                Budget (optional)
              </h2>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--cg-text-secondary)" }}>
                Budget Per Person
              </label>
              <input
                type="text"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g., $2,000"
                className="w-full rounded-lg px-4 py-2.5 text-sm"
                style={inputStyle}
              />
            </div>

            <p className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
              Set a per-person budget to help guide course selection and expense tracking.
              You can change this later.
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-lg p-3 text-sm" style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
            {error}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6 pt-4" style={{ borderTop: "1px solid var(--cg-border)" }}>
          <button
            onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
            disabled={currentStep === 0}
            className="inline-flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium transition-all disabled:opacity-30"
            style={{
              backgroundColor: "var(--cg-bg-tertiary)",
              color: "var(--cg-text-secondary)",
              border: "1px solid var(--cg-border)",
            }}
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>

          {currentStep < STEPS.length - 1 ? (
            <button
              onClick={() => setCurrentStep((s) => s + 1)}
              disabled={!canAdvance()}
              className="inline-flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium transition-all disabled:opacity-30"
              style={{ backgroundColor: "var(--cg-accent)", color: "var(--cg-text-inverse)" }}
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-medium transition-all disabled:opacity-50"
              style={{ backgroundColor: "var(--cg-accent)", color: "var(--cg-text-inverse)" }}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Check className="h-4 w-4" /> Create Trip
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
