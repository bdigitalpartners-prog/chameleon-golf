"use client";

import { BookOpen, ShoppingCart } from "lucide-react";

interface BookCardProps {
  title: string;
  authors: string[];
  coverImageUrl?: string | null;
  yearPublished?: number | null;
  description?: string | null;
  amazonUrl?: string | null;
  bookshopUrl?: string | null;
}

export function BookCard({ title, authors, coverImageUrl, yearPublished, description, amazonUrl, bookshopUrl }: BookCardProps) {
  return (
    <div
      className="flex gap-4 rounded-xl p-4"
      style={{
        backgroundColor: "var(--cg-bg-card)",
        border: "1px solid var(--cg-border)",
      }}
    >
      {coverImageUrl ? (
        <img
          src={coverImageUrl}
          alt={title}
          className="h-32 w-24 rounded-lg object-cover flex-shrink-0"
        />
      ) : (
        <div
          className="h-32 w-24 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "var(--cg-bg-secondary)" }}
        >
          <BookOpen className="h-8 w-8" style={{ color: "var(--cg-text-muted)" }} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm" style={{ color: "var(--cg-text-primary)" }}>
          {title}
        </h4>
        <p className="text-xs mt-0.5" style={{ color: "var(--cg-text-muted)" }}>
          {authors.join(", ")}
          {yearPublished && ` (${yearPublished})`}
        </p>
        {description && (
          <p className="text-xs mt-2 line-clamp-3" style={{ color: "var(--cg-text-secondary)" }}>
            {description}
          </p>
        )}
        <div className="flex gap-2 mt-3">
          {amazonUrl && (
            <a
              href={amazonUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                backgroundColor: "var(--cg-accent)",
                color: "var(--cg-text-inverse, #000)",
              }}
            >
              <ShoppingCart className="h-3 w-3" />
              Amazon
            </a>
          )}
          {bookshopUrl && (
            <a
              href={bookshopUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                backgroundColor: "var(--cg-bg-tertiary)",
                color: "var(--cg-text-secondary)",
                border: "1px solid var(--cg-border)",
              }}
            >
              <ShoppingCart className="h-3 w-3" />
              Bookshop
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
