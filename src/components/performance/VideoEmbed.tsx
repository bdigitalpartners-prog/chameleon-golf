"use client";

export function VideoEmbed({ url }: { url: string }) {
  // Extract YouTube video ID
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?#]+)/
  );
  const videoId = match?.[1];
  if (!videoId) return null;

  return (
    <div className="relative w-full overflow-hidden rounded-xl" style={{ paddingBottom: "56.25%" }}>
      <iframe
        className="absolute inset-0 h-full w-full"
        src={`https://www.youtube-nocookie.com/embed/${videoId}`}
        title="Video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{ border: "1px solid var(--cg-border)" }}
      />
    </div>
  );
}
