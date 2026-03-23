"use client";

const PLATFORM_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  youtube: { bg: "#FF0000", text: "#FFFFFF", label: "YouTube" },
  instagram: { bg: "#C13584", text: "#FFFFFF", label: "Instagram" },
  tiktok: { bg: "#000000", text: "#FFFFFF", label: "TikTok" },
  podcast: { bg: "#7C3AED", text: "#FFFFFF", label: "Podcast" },
  blog: { bg: "#2563EB", text: "#FFFFFF", label: "Blog" },
};

const CONTENT_TYPE_LABELS: Record<string, string> = {
  review: "Review",
  flyover: "Flyover",
  vlog: "Vlog",
  podcast_mention: "Podcast",
  course_guide: "Course Guide",
};

export function PlatformBadge({ platform, size = "sm" }: { platform: string; size?: "sm" | "md" }) {
  const style = PLATFORM_STYLES[platform] || { bg: "#4B5563", text: "#FFFFFF", label: platform };
  const sizeClasses = size === "md" ? "px-2.5 py-1 text-xs" : "px-1.5 py-0.5 text-[10px]";

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-md ${sizeClasses}`}
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {style.label}
    </span>
  );
}

export function ContentTypeBadge({ contentType }: { contentType: string }) {
  const label = CONTENT_TYPE_LABELS[contentType] || contentType;
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded-md"
      style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "var(--cg-text-secondary)" }}
    >
      {label}
    </span>
  );
}
