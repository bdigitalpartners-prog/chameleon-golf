"use client";

import { useState, useEffect } from "react";
import { ArticleCard } from "@/components/content/ArticleCard";
import { VideoEmbed } from "@/components/content/VideoEmbed";
import { PodcastCard } from "@/components/content/PodcastCard";
import { BookCard } from "@/components/content/BookCard";

interface ContentItem {
  id: number;
  contentType: string;
  title: string;
  url: string;
  thumbnailUrl?: string | null;
  sourceName?: string | null;
  authorName?: string | null;
  publishedAt?: string | null;
  summary?: string | null;
  duration?: string | null;
  isFeatured: boolean;
}

interface BookItem {
  id: number;
  title: string;
  authors: string[];
  coverImageUrl?: string | null;
  yearPublished?: number | null;
  description?: string | null;
  amazonUrl?: string | null;
  bookshopUrl?: string | null;
}

const cardStyle: React.CSSProperties = {
  backgroundColor: "var(--cg-bg-card)",
  border: "1px solid var(--cg-border)",
  borderRadius: "0.75rem",
  padding: "1.5rem",
};

export function ArchitectContentSections({ architectId }: { architectId: number }) {
  const [grouped, setGrouped] = useState<Record<string, ContentItem[]>>({});
  const [books, setBooks] = useState<BookItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/content?architectId=${architectId}`)
        .then((r) => r.json())
        .then((data) => setGrouped(data.grouped || {}))
        .catch(() => {}),
      fetch(`/api/books?architectId=${architectId}`)
        .then((r) => r.json())
        .then((data: BookItem[]) => setBooks(Array.isArray(data) ? data : []))
        .catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [architectId]);

  const hasContent = Object.keys(grouped).length > 0;
  const hasBooks = books.length > 0;

  if (loading) return null;
  if (!hasContent && !hasBooks) return null;

  const sectionLabels: Record<string, string> = {
    article: "Articles",
    video: "Videos",
    podcast: "Podcasts",
    interview: "Interviews",
    course_review: "Course Reviews",
  };

  const sectionOrder = ["video", "article", "podcast", "interview", "course_review"];

  return (
    <>
      {hasContent && (
        <section style={cardStyle} className="mb-6">
          <h2
            className="mb-4 text-lg font-semibold"
            style={{ color: "var(--cg-text-primary)" }}
          >
            Articles &amp; Media
          </h2>
          <div className="space-y-6">
            {sectionOrder
              .filter((type) => grouped[type]?.length > 0)
              .map((type) => (
                <div key={type}>
                  <h3
                    className="mb-3 text-sm font-medium"
                    style={{ color: "var(--cg-text-muted)" }}
                  >
                    {sectionLabels[type] || type}
                  </h3>
                  <div className={type === "video" ? "grid gap-4 md:grid-cols-2" : "space-y-3"}>
                    {grouped[type].map((item) => {
                      if (type === "video") {
                        return <VideoEmbed key={item.id} title={item.title} url={item.url} thumbnailUrl={item.thumbnailUrl} />;
                      }
                      if (type === "podcast") {
                        return (
                          <PodcastCard
                            key={item.id}
                            title={item.title}
                            url={item.url}
                            sourceName={item.sourceName}
                            duration={item.duration}
                            publishedAt={item.publishedAt}
                            summary={item.summary}
                          />
                        );
                      }
                      return (
                        <ArticleCard
                          key={item.id}
                          title={item.title}
                          url={item.url}
                          thumbnailUrl={item.thumbnailUrl}
                          sourceName={item.sourceName}
                          publishedAt={item.publishedAt}
                          summary={item.summary}
                          authorName={item.authorName}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            {/* Render any types not in sectionOrder */}
            {Object.entries(grouped)
              .filter(([type]) => !sectionOrder.includes(type))
              .map(([type, items]) => (
                <div key={type}>
                  <h3
                    className="mb-3 text-sm font-medium"
                    style={{ color: "var(--cg-text-muted)" }}
                  >
                    {sectionLabels[type] || type}
                  </h3>
                  <div className="space-y-3">
                    {items.map((item) => (
                      <ArticleCard
                        key={item.id}
                        title={item.title}
                        url={item.url}
                        thumbnailUrl={item.thumbnailUrl}
                        sourceName={item.sourceName}
                        publishedAt={item.publishedAt}
                        summary={item.summary}
                        authorName={item.authorName}
                      />
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}

      {hasBooks && (
        <section style={cardStyle} className="mb-6">
          <h2
            className="mb-4 text-lg font-semibold"
            style={{ color: "var(--cg-text-primary)" }}
          >
            Bookshelf
          </h2>
          <div className="space-y-3">
            {books.map((book) => (
              <BookCard
                key={book.id}
                title={book.title}
                authors={book.authors}
                coverImageUrl={book.coverImageUrl}
                yearPublished={book.yearPublished}
                description={book.description}
                amazonUrl={book.amazonUrl}
                bookshopUrl={book.bookshopUrl}
              />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
