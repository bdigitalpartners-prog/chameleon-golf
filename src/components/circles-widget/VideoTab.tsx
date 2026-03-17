"use client";

import { useState } from "react";
import { Play, PictureInPicture2, Film } from "lucide-react";

interface VideoItem {
  id: string;
  title: string;
  url: string;
  thumbnail?: string;
  duration?: string;
  source: "course" | "circle";
}

// Placeholder videos for demo — in production these would come from the API
const PLACEHOLDER_VIDEOS: VideoItem[] = [
  {
    id: "1",
    title: "Course Flyover — Front 9",
    url: "",
    duration: "4:32",
    source: "course",
  },
  {
    id: "2",
    title: "Tips: Reading Greens",
    url: "",
    duration: "6:18",
    source: "circle",
  },
  {
    id: "3",
    title: "Member Highlights — March",
    url: "",
    duration: "3:45",
    source: "circle",
  },
];

export function VideoTab() {
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);
  const [isPiP, setIsPiP] = useState(false);

  const courseVideos = PLACEHOLDER_VIDEOS.filter((v) => v.source === "course");
  const circleVideos = PLACEHOLDER_VIDEOS.filter((v) => v.source === "circle");

  return (
    <div className="flex flex-col">
      {/* Video Player Area */}
      <div
        className="relative mx-3 mt-3 rounded-xl overflow-hidden"
        style={{
          aspectRatio: "16/9",
          backgroundColor: "var(--cg-bg-primary)",
          border: "1px solid var(--cg-border-subtle)",
        }}
      >
        {activeVideo ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm" style={{ color: "var(--cg-text-muted)" }}>
              {activeVideo.title}
            </span>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <Play style={{ width: 40, height: 40, color: "var(--cg-text-muted)" }} />
            <span className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
              Select a video to play
            </span>
          </div>
        )}

        {/* PiP toggle */}
        {activeVideo && (
          <button
            onClick={() => setIsPiP(!isPiP)}
            className="absolute top-2 right-2 rounded-lg p-1.5 transition-colors"
            style={{
              backgroundColor: "rgba(0,0,0,0.6)",
              color: isPiP ? "var(--cg-accent)" : "var(--cg-text-secondary)",
            }}
          >
            <PictureInPicture2 style={{ width: 16, height: 16 }} />
          </button>
        )}
      </div>

      {/* Course Videos */}
      <div className="px-4 pt-4 pb-1">
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: "var(--cg-text-muted)" }}
        >
          Course Videos
        </span>
      </div>
      <div className="px-2">
        {courseVideos.length === 0 ? (
          <div className="px-2 py-4 text-center">
            <span className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
              No course videos available
            </span>
          </div>
        ) : (
          courseVideos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              isActive={activeVideo?.id === video.id}
              onClick={() => setActiveVideo(video)}
            />
          ))
        )}
      </div>

      {/* Circle Shared Videos */}
      <div className="px-4 pt-3 pb-1" style={{ borderTop: "1px solid var(--cg-border-subtle)" }}>
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: "var(--cg-text-muted)" }}
        >
          Shared by Circles
        </span>
      </div>
      <div className="px-2 pb-3">
        {circleVideos.length === 0 ? (
          <div className="px-2 py-4 text-center">
            <span className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
              No shared videos yet
            </span>
          </div>
        ) : (
          circleVideos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              isActive={activeVideo?.id === video.id}
              onClick={() => setActiveVideo(video)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function VideoCard({
  video,
  isActive,
  onClick,
}: {
  video: VideoItem;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-2 py-2 rounded-lg transition-colors text-left"
      style={{
        backgroundColor: isActive ? "var(--cg-accent-bg)" : "transparent",
      }}
      onMouseEnter={(e) => {
        if (!isActive)
          (e.currentTarget as HTMLElement).style.backgroundColor = "var(--cg-bg-card-hover)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor = isActive
          ? "var(--cg-accent-bg)"
          : "transparent";
      }}
    >
      {/* Thumbnail */}
      <div
        className="rounded-lg flex items-center justify-center shrink-0"
        style={{
          width: 56,
          height: 36,
          backgroundColor: "var(--cg-bg-primary)",
          border: "1px solid var(--cg-border-subtle)",
        }}
      >
        <Film style={{ width: 18, height: 18, color: "var(--cg-text-muted)" }} />
      </div>

      <div className="flex-1 min-w-0">
        <span
          className="text-sm font-medium truncate block"
          style={{ color: isActive ? "var(--cg-accent)" : "var(--cg-text-primary)" }}
        >
          {video.title}
        </span>
        {video.duration && (
          <span className="text-[10px]" style={{ color: "var(--cg-text-muted)" }}>
            {video.duration}
          </span>
        )}
      </div>

      {isActive && (
        <div className="shrink-0">
          <Play
            style={{ width: 16, height: 16, color: "var(--cg-accent)" }}
          />
        </div>
      )}
    </button>
  );
}
