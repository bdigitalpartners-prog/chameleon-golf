"use client";

import { useState } from "react";
import Link from "next/link";

const HOW_FOUND_OPTIONS = [
  "Word of Mouth",
  "Social Media",
  "Search",
  "Golf Forum",
  "Friend/Referral",
  "Other",
];

const CONTENT_CHECKLIST_OPTIONS = [
  "Course reviews/deep dives",
  "Travel guides & trip planning",
  "Equipment & gear reviews",
  "Instruction & improvement tips",
  "Tournament coverage",
  "Architect profiles & course design",
  "Local hidden gems",
  "Other",
];

const TOOL_CHECKLIST_OPTIONS = [
  "Personalized course rankings",
  "Course comparison tool",
  "Trip planner",
  "Handicap tracking integration",
  "Tee time booking",
  "Score posting & stats",
  "Social features (groups, challenges)",
  "Mobile app",
  "AI caddie / course recommendations",
  "Other",
];

const COURSE_INTEL_CHECKLIST_OPTIONS = [
  "Insider tips & strategy",
  "Real conditions & pace of play",
  "Best time to visit",
  "Nearby dining & lodging",
  "Green fees & how to get on",
  "Photo/video walkthroughs",
  "Player reviews by handicap range",
  "Other",
];

const INTEREST_OPTIONS = [
  "Very interested",
  "Somewhat interested",
  "Just exploring",
  "Not interested",
];

export default function FeedbackPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [handicapIndex, setHandicapIndex] = useState("");
  const [homeCourse, setHomeCourse] = useState("");
  const [howFound, setHowFound] = useState("");
  const [contentIdeas, setContentIdeas] = useState("");
  const [contentChecklist, setContentChecklist] = useState<string[]>([]);
  const [toolIdeas, setToolIdeas] = useState("");
  const [toolChecklist, setToolChecklist] = useState<string[]>([]);
  const [courseIntelligence, setCourseIntelligence] = useState("");
  const [courseIntelChecklist, setCourseIntelChecklist] = useState<string[]>([]);
  const [generalFeedback, setGeneralFeedback] = useState("");
  const [interestLevel, setInterestLevel] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  function toggleChecklist(
    list: string[],
    setList: (v: string[]) => void,
    value: string
  ) {
    setList(
      list.includes(value)
        ? list.filter((v) => v !== value)
        : [...list, value]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          handicapIndex: handicapIndex || null,
          homeCourse: homeCourse || null,
          howFound: howFound || null,
          contentIdeas: contentIdeas || null,
          contentChecklist: contentChecklist.length
            ? JSON.stringify(contentChecklist)
            : null,
          toolIdeas: toolIdeas || null,
          toolChecklist: toolChecklist.length
            ? JSON.stringify(toolChecklist)
            : null,
          courseIntelligence: courseIntelligence || null,
          courseIntelChecklist: courseIntelChecklist.length
            ? JSON.stringify(courseIntelChecklist)
            : null,
          generalFeedback: generalFeedback || null,
          interestLevel: interestLevel || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: "var(--cg-bg-primary)" }}
      >
        <div
          className="max-w-md w-full text-center rounded-xl p-8"
          style={{
            backgroundColor: "var(--cg-bg-secondary)",
            border: "1px solid var(--cg-border)",
          }}
        >
          <div
            className="text-4xl mb-4"
            style={{ color: "var(--cg-accent)" }}
          >
            &#10003;
          </div>
          <h1
            className="text-2xl font-bold mb-4"
            style={{ color: "var(--cg-text-primary)" }}
          >
            Thank You
          </h1>
          <p
            className="text-sm leading-relaxed mb-6"
            style={{ color: "var(--cg-text-secondary)" }}
          >
            Thank you for shaping the future of golfEQUALIZER. Your feedback is
            invaluable.
          </p>
          <Link
            href="/"
            className="inline-block rounded-lg px-6 py-3 text-sm font-semibold transition-colors"
            style={{
              backgroundColor: "var(--cg-accent)",
              color: "var(--cg-text-inverse)",
            }}
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen py-12 px-4 sm:px-6"
      style={{ backgroundColor: "var(--cg-bg-primary)" }}
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1
            className="text-3xl sm:text-4xl font-bold mb-4"
            style={{ color: "var(--cg-text-primary)" }}
          >
            Founding Advisory Board
          </h1>
          <p
            className="text-sm sm:text-base leading-relaxed max-w-xl mx-auto"
            style={{ color: "var(--cg-text-secondary)" }}
          >
            You&apos;ve been invited to pressure-test golfEQUALIZER before
            launch. Nothing is final. Everything is open. Tell us what this
            should become.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Contact Info */}
          <Section title="Contact Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                label="Full Name"
                required
                value={fullName}
                onChange={setFullName}
                placeholder="Your name"
              />
              <InputField
                label="Email"
                required
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="you@example.com"
              />
              <InputField
                label="Handicap Index"
                value={handicapIndex}
                onChange={setHandicapIndex}
                placeholder="e.g. 12.4"
              />
              <InputField
                label="Home Course"
                value={homeCourse}
                onChange={setHomeCourse}
                placeholder="e.g. Pebble Beach"
              />
            </div>
            <div className="mt-4">
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--cg-text-secondary)" }}
              >
                How did you find us?
              </label>
              <select
                value={howFound}
                onChange={(e) => setHowFound(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors"
                style={{
                  backgroundColor: "var(--cg-bg-tertiary)",
                  color: "var(--cg-text-primary)",
                  border: "1px solid var(--cg-border)",
                }}
              >
                <option value="">Select...</option>
                {HOW_FOUND_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </Section>

          {/* Content Ideas */}
          <Section
            title="Content Ideas"
            subtitle="What content would make this your go-to golf resource?"
          >
            <TextArea
              value={contentIdeas}
              onChange={setContentIdeas}
              placeholder="Share your ideas..."
            />
            <ChecklistGroup
              options={CONTENT_CHECKLIST_OPTIONS}
              selected={contentChecklist}
              onToggle={(v) =>
                toggleChecklist(contentChecklist, setContentChecklist, v)
              }
            />
          </Section>

          {/* Tool & Feature Ideas */}
          <Section
            title="Tool & Feature Ideas"
            subtitle="What tools or features would you use most?"
          >
            <TextArea
              value={toolIdeas}
              onChange={setToolIdeas}
              placeholder="Share your ideas..."
            />
            <ChecklistGroup
              options={TOOL_CHECKLIST_OPTIONS}
              selected={toolChecklist}
              onToggle={(v) =>
                toggleChecklist(toolChecklist, setToolChecklist, v)
              }
            />
          </Section>

          {/* Course Intelligence */}
          <Section
            title="Course Intelligence"
            subtitle="What would you want to know about a course before playing it?"
          >
            <TextArea
              value={courseIntelligence}
              onChange={setCourseIntelligence}
              placeholder="Share your ideas..."
            />
            <ChecklistGroup
              options={COURSE_INTEL_CHECKLIST_OPTIONS}
              selected={courseIntelChecklist}
              onToggle={(v) =>
                toggleChecklist(
                  courseIntelChecklist,
                  setCourseIntelChecklist,
                  v
                )
              }
            />
          </Section>

          {/* General Feedback */}
          <Section
            title="General Feedback"
            subtitle="Anything else? What's missing? What excites you? What would you change?"
          >
            <TextArea
              value={generalFeedback}
              onChange={setGeneralFeedback}
              placeholder="Tell us anything..."
              rows={5}
            />
          </Section>

          {/* Interest Level */}
          <Section
            title="Interest Level"
            subtitle="How interested are you in early/founding membership?"
          >
            <div className="space-y-2">
              {INTEREST_OPTIONS.map((opt) => (
                <label
                  key={opt}
                  className="flex items-center gap-3 cursor-pointer rounded-lg px-3 py-2.5 transition-colors"
                  style={{
                    backgroundColor:
                      interestLevel === opt
                        ? "var(--cg-accent-bg)"
                        : "transparent",
                    border:
                      interestLevel === opt
                        ? "1px solid var(--cg-accent-muted)"
                        : "1px solid transparent",
                  }}
                >
                  <input
                    type="radio"
                    name="interestLevel"
                    value={opt}
                    checked={interestLevel === opt}
                    onChange={(e) => setInterestLevel(e.target.value)}
                    className="sr-only"
                  />
                  <span
                    className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                    style={{
                      borderColor:
                        interestLevel === opt
                          ? "var(--cg-accent)"
                          : "var(--cg-border)",
                    }}
                  >
                    {interestLevel === opt && (
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: "var(--cg-accent)" }}
                      />
                    )}
                  </span>
                  <span
                    className="text-sm"
                    style={{ color: "var(--cg-text-primary)" }}
                  >
                    {opt}
                  </span>
                </label>
              ))}
            </div>
          </Section>

          {/* Error */}
          {error && (
            <p
              className="text-sm text-center"
              style={{ color: "var(--cg-error)" }}
            >
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg px-5 py-3.5 text-sm font-semibold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: "var(--cg-accent)",
              color: "var(--cg-text-inverse)",
            }}
          >
            {loading ? "Submitting..." : "Submit Feedback \u2192"}
          </button>

          <p
            className="text-xs text-center"
            style={{ color: "var(--cg-text-muted)" }}
          >
            Your responses help us build a better platform for golfers like you.
          </p>
        </form>
      </div>
    </div>
  );
}

/* ── Reusable sub-components ── */

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl p-5 sm:p-6"
      style={{
        backgroundColor: "var(--cg-bg-secondary)",
        border: "1px solid var(--cg-border)",
      }}
    >
      <h2
        className="text-lg font-semibold mb-1"
        style={{ color: "var(--cg-text-primary)" }}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className="text-sm mb-4"
          style={{ color: "var(--cg-text-secondary)" }}
        >
          {subtitle}
        </p>
      )}
      {!subtitle && <div className="mb-4" />}
      {children}
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label
        className="block text-xs font-medium mb-1.5"
        style={{ color: "var(--cg-text-secondary)" }}
      >
        {label}
        {required && (
          <span style={{ color: "var(--cg-accent)" }}> *</span>
        )}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors"
        style={{
          backgroundColor: "var(--cg-bg-tertiary)",
          color: "var(--cg-text-primary)",
          border: "1px solid var(--cg-border)",
        }}
      />
    </div>
  );
}

function TextArea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors resize-y"
      style={{
        backgroundColor: "var(--cg-bg-tertiary)",
        color: "var(--cg-text-primary)",
        border: "1px solid var(--cg-border)",
      }}
    />
  );
}

function ChecklistGroup({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {options.map((opt) => {
        const isSelected = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            className="rounded-full px-3 py-1.5 text-xs font-medium transition-all cursor-pointer"
            style={{
              backgroundColor: isSelected
                ? "var(--cg-accent-bg)"
                : "var(--cg-bg-tertiary)",
              color: isSelected
                ? "var(--cg-accent)"
                : "var(--cg-text-secondary)",
              border: isSelected
                ? "1px solid var(--cg-accent-muted)"
                : "1px solid var(--cg-border)",
            }}
          >
            {isSelected ? "\u2713 " : ""}
            {opt}
          </button>
        );
      })}
    </div>
  );
}
