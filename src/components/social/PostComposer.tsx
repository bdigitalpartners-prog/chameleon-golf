"use client";

import { useState, useEffect, useRef } from "react";
import { Image, X, MapPin, Loader2, Send } from "lucide-react";
import { MentionInput } from "./MentionInput";

interface Circle {
  id: string;
  name: string;
}

interface PostComposerProps {
  circleId?: string; // Pre-selected circle (for circle detail page)
  onPostCreated?: () => void;
}

export function PostComposer({ circleId, onPostCreated }: PostComposerProps) {
  const [content, setContent] = useState("");
  const [selectedCircle, setSelectedCircle] = useState(circleId ?? "");
  const [circles, setCircles] = useState<Circle[]>([]);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [courseSearch, setCourseSearch] = useState("");
  const [courseResults, setCourseResults] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [showCourseSearch, setShowCourseSearch] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!circleId) {
      fetch("/api/circles")
        .then((r) => r.json())
        .then((data) => setCircles(data.circles ?? []))
        .catch(console.error);
    }
  }, [circleId]);

  useEffect(() => {
    if (circleId) setSelectedCircle(circleId);
  }, [circleId]);

  useEffect(() => {
    if (!courseSearch.trim()) {
      setCourseResults([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`/api/courses?q=${encodeURIComponent(courseSearch)}&limit=5`)
        .then((r) => r.json())
        .then((data) => setCourseResults(data.courses ?? data ?? []))
        .catch(() => setCourseResults([]));
    }, 300);
    return () => clearTimeout(timer);
  }, [courseSearch]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const remaining = 4 - mediaUrls.length;
    const toUpload = files.slice(0, remaining);

    setUploading(true);
    for (const file of toUpload) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "posts");

        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (data.url) {
          setMediaUrls((prev) => [...prev, data.url]);
          setMediaPreviews((prev) => [...prev, URL.createObjectURL(file)]);
        }
      } catch (err) {
        console.error("Upload failed:", err);
      }
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeMedia = (index: number) => {
    setMediaUrls((prev) => prev.filter((_, i) => i !== index));
    setMediaPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if ((!content.trim() && mediaUrls.length === 0) || !selectedCircle) return;

    setPosting(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          circleId: selectedCircle,
          content: content.trim() || null,
          type: mediaUrls.length > 0 ? "PHOTO" : "TEXT",
          mediaUrls,
          courseId: selectedCourse?.courseId ?? null,
        }),
      });

      if (res.ok) {
        setContent("");
        setMediaUrls([]);
        setMediaPreviews([]);
        setSelectedCourse(null);
        onPostCreated?.();
      }
    } catch (err) {
      console.error("Failed to create post:", err);
    } finally {
      setPosting(false);
    }
  };

  const canSubmit = (content.trim() || mediaUrls.length > 0) && selectedCircle && !posting;

  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
    >
      <MentionInput
        value={content}
        onChange={setContent}
        placeholder="Share with your circle..."
        rows={2}
      />

      {/* Media previews */}
      {mediaPreviews.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {mediaPreviews.map((preview, i) => (
            <div key={i} className="relative h-20 w-20 rounded-lg overflow-hidden">
              <img src={preview} alt="" className="h-full w-full object-cover" />
              <button
                onClick={() => removeMedia(i)}
                className="absolute top-1 right-1 rounded-full p-0.5"
                style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
              >
                <X className="h-3 w-3" style={{ color: "#fff" }} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Course tag */}
      {selectedCourse && (
        <div
          className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs"
          style={{ backgroundColor: "var(--cg-accent-bg)", color: "var(--cg-accent)" }}
        >
          <MapPin className="h-3 w-3" />
          {selectedCourse.courseName}
          <button onClick={() => setSelectedCourse(null)}>
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Course search dropdown */}
      {showCourseSearch && (
        <div className="relative">
          <input
            type="text"
            value={courseSearch}
            onChange={(e) => setCourseSearch(e.target.value)}
            placeholder="Search courses..."
            autoFocus
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={{
              backgroundColor: "var(--cg-bg-secondary)",
              color: "var(--cg-text-primary)",
              border: "1px solid var(--cg-border)",
            }}
          />
          {courseResults.length > 0 && (
            <div
              className="absolute left-0 right-0 z-50 mt-1 rounded-lg shadow-lg overflow-hidden"
              style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
            >
              {courseResults.map((course: any) => (
                <button
                  key={course.courseId}
                  onClick={() => {
                    setSelectedCourse(course);
                    setShowCourseSearch(false);
                    setCourseSearch("");
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition-colors hover:opacity-80"
                  style={{ color: "var(--cg-text-primary)" }}
                >
                  <MapPin className="h-4 w-4 flex-shrink-0" style={{ color: "var(--cg-accent)" }} />
                  <div>
                    <p className="font-medium">{course.courseName}</p>
                    <p className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
                      {course.city}, {course.state}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {!circleId && (
            <select
              value={selectedCircle}
              onChange={(e) => setSelectedCircle(e.target.value)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium outline-none"
              style={{
                backgroundColor: "var(--cg-bg-secondary)",
                color: "var(--cg-text-secondary)",
                border: "1px solid var(--cg-border)",
              }}
            >
              <option value="">Select circle...</option>
              {circles.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={mediaUrls.length >= 4 || uploading}
            className="rounded-lg p-2 transition-colors disabled:opacity-40"
            style={{ color: "var(--cg-text-muted)" }}
            title="Add photos"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Image className="h-4 w-4" />
            )}
          </button>

          <button
            onClick={() => setShowCourseSearch(!showCourseSearch)}
            className="rounded-lg p-2 transition-colors"
            style={{ color: selectedCourse ? "var(--cg-accent)" : "var(--cg-text-muted)" }}
            title="Tag a course"
          >
            <MapPin className="h-4 w-4" />
          </button>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all disabled:opacity-40"
          style={{
            backgroundColor: "var(--cg-accent)",
            color: "var(--cg-text-inverse)",
          }}
        >
          {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Post
        </button>
      </div>
    </div>
  );
}
