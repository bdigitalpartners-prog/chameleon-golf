"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Search, X } from "lucide-react";

export default function CaddyApplyPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [courseSearch, setCourseSearch] = useState("");
  const [courseResults, setCourseResults] = useState<any[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<
    { courseId: number; courseName: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Course search
  useEffect(() => {
    if (courseSearch.trim().length < 2) {
      setCourseResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/courses/search?q=${encodeURIComponent(courseSearch.trim())}&limit=10`
        );
        if (res.ok) {
          const data = await res.json();
          setCourseResults(Array.isArray(data) ? data : data.courses || []);
        }
      } catch {
        // ignore
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [courseSearch]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setError("First name, last name, and email are required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/looper-guild/caddies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone: phone || null,
          bio: bio || null,
          yearsExperience: yearsExperience || null,
          photoUrl: photoUrl || null,
          courseNames: selectedCourses.map((c) => c.courseId),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
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
          <div className="text-4xl mb-4" style={{ color: "var(--cg-accent)" }}>
            &#10003;
          </div>
          <h1
            className="text-2xl font-bold mb-4"
            style={{ color: "var(--cg-text-primary)" }}
          >
            Application Submitted
          </h1>
          <p
            className="text-sm leading-relaxed mb-6"
            style={{ color: "var(--cg-text-secondary)" }}
          >
            Application submitted. You&apos;ll hear from us once approved.
          </p>
          <Link
            href="/looper-guild"
            className="inline-block rounded-lg px-6 py-3 text-sm font-semibold transition-colors"
            style={{
              backgroundColor: "var(--cg-accent)",
              color: "var(--cg-text-inverse)",
            }}
          >
            Back to Looper Guild
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
        {/* Back link */}
        <Link
          href="/looper-guild"
          className="inline-flex items-center gap-1.5 text-sm mb-6 transition-colors"
          style={{ color: "var(--cg-text-muted)" }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Looper Guild
        </Link>

        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <img
              src="/looper-guild-lambda.png"
              alt="Looper Guild"
              className="h-14 w-14 object-contain"
            />
          </div>
          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: "var(--cg-text-primary)" }}
          >
            Apply as a Caddy
          </h1>
          <p
            className="text-sm"
            style={{ color: "var(--cg-text-secondary)" }}
          >
            Fill out the form below to join the Looper Guild network.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Info */}
          <div
            className="rounded-xl p-5 sm:p-6"
            style={{
              backgroundColor: "var(--cg-bg-secondary)",
              border: "1px solid var(--cg-border)",
            }}
          >
            <h2
              className="text-lg font-semibold mb-4"
              style={{ color: "var(--cg-text-primary)" }}
            >
              Personal Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="First Name"
                required
                value={firstName}
                onChange={setFirstName}
                placeholder="Your first name"
              />
              <Field
                label="Last Name"
                required
                value={lastName}
                onChange={setLastName}
                placeholder="Your last name"
              />
              <Field
                label="Email"
                required
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="you@example.com"
              />
              <Field
                label="Phone"
                value={phone}
                onChange={setPhone}
                placeholder="(optional)"
              />
            </div>
          </div>

          {/* Profile */}
          <div
            className="rounded-xl p-5 sm:p-6"
            style={{
              backgroundColor: "var(--cg-bg-secondary)",
              border: "1px solid var(--cg-border)",
            }}
          >
            <h2
              className="text-lg font-semibold mb-4"
              style={{ color: "var(--cg-text-primary)" }}
            >
              Caddy Profile
            </h2>
            <div className="space-y-4">
              <div>
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: "var(--cg-text-secondary)" }}
                >
                  Bio / About
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell golfers about yourself, your experience, and what makes you a great caddy..."
                  rows={4}
                  className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors resize-y"
                  style={{
                    backgroundColor: "var(--cg-bg-tertiary)",
                    color: "var(--cg-text-primary)",
                    border: "1px solid var(--cg-border)",
                  }}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Years of Experience"
                  type="number"
                  value={yearsExperience}
                  onChange={setYearsExperience}
                  placeholder="e.g. 5"
                />
                <Field
                  label="Photo URL"
                  value={photoUrl}
                  onChange={setPhotoUrl}
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>

          {/* Courses */}
          <div
            className="rounded-xl p-5 sm:p-6"
            style={{
              backgroundColor: "var(--cg-bg-secondary)",
              border: "1px solid var(--cg-border)",
            }}
          >
            <h2
              className="text-lg font-semibold mb-4"
              style={{ color: "var(--cg-text-primary)" }}
            >
              Courses You Caddy At
            </h2>

            {/* Selected courses */}
            {selectedCourses.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedCourses.map((c) => (
                  <span
                    key={c.courseId}
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium"
                    style={{
                      backgroundColor: "var(--cg-accent-bg)",
                      color: "var(--cg-accent)",
                      border: "1px solid var(--cg-accent-muted)",
                    }}
                  >
                    {c.courseName}
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedCourses((prev) =>
                          prev.filter((p) => p.courseId !== c.courseId)
                        )
                      }
                      className="ml-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Search */}
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                style={{ color: "var(--cg-text-muted)" }}
              />
              <input
                type="text"
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
                placeholder="Search courses..."
                className="w-full rounded-lg pl-9 pr-3 py-2.5 text-sm outline-none transition-colors"
                style={{
                  backgroundColor: "var(--cg-bg-tertiary)",
                  color: "var(--cg-text-primary)",
                  border: "1px solid var(--cg-border)",
                }}
              />
            </div>

            {courseResults.length > 0 && (
              <div
                className="mt-2 rounded-lg max-h-40 overflow-y-auto"
                style={{
                  backgroundColor: "var(--cg-bg-tertiary)",
                  border: "1px solid var(--cg-border)",
                }}
              >
                {courseResults.map((course: any) => {
                  const id = course.courseId ?? course.id;
                  const name = course.courseName ?? course.name;
                  const isSelected = selectedCourses.some(
                    (c) => c.courseId === id
                  );
                  return (
                    <button
                      key={id}
                      type="button"
                      disabled={isSelected}
                      onClick={() => {
                        setSelectedCourses((prev) => [
                          ...prev,
                          { courseId: id, courseName: name },
                        ]);
                        setCourseSearch("");
                        setCourseResults([]);
                      }}
                      className="w-full text-left px-3 py-2 text-sm transition-colors disabled:opacity-40"
                      style={{ color: "var(--cg-text-primary)" }}
                    >
                      {name}
                      {course.city && course.state && (
                        <span
                          className="ml-2 text-xs"
                          style={{ color: "var(--cg-text-muted)" }}
                        >
                          {course.city}, {course.state}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

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
            {loading ? "Submitting..." : "Submit Application"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({
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
        {required && <span style={{ color: "var(--cg-accent)" }}> *</span>}
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
