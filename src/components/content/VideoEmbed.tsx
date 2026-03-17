"use client";

interface VideoEmbedProps {
  title: string;
  url: string;
  thumbnailUrl?: string | null;
}

function getYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?#]+)/
  );
  return match?.[1] || null;
}

export function VideoEmbed({ title, url, thumbnailUrl }: VideoEmbedProps) {
  const youtubeId = getYouTubeId(url);

  if (youtubeId) {
    return (
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid var(--cg-border)" }}
      >
        <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}`}
            title={title}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>
        <div className="p-3" style={{ backgroundColor: "var(--cg-bg-card)" }}>
          <h4 className="text-sm font-medium" style={{ color: "var(--cg-text-primary)" }}>
            {title}
          </h4>
        </div>
      </div>
    );
  }

  // Fallback for non-YouTube videos
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-xl overflow-hidden transition-all"
      style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
    >
      {thumbnailUrl && (
        <img src={thumbnailUrl} alt="" className="w-full h-40 object-cover" />
      )}
      <div className="p-3">
        <h4 className="text-sm font-medium" style={{ color: "var(--cg-text-primary)" }}>
          {title}
        </h4>
      </div>
    </a>
  );
}
