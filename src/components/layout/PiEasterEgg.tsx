"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

const GREEN = "#4ADE80";

export function PiEasterEgg() {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Pi trigger */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Founding Advisory"
        className="transition-all duration-200 cursor-pointer select-none"
        style={{
          color: GREEN,
          fontSize: "14px",
          lineHeight: 1,
          opacity: 0.6,
          background: "none",
          border: "none",
          padding: "2px 4px",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = "1";
          e.currentTarget.style.textShadow = `0 0 8px ${GREEN}, 0 0 16px rgba(74, 222, 128, 0.4)`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = "0.6";
          e.currentTarget.style.textShadow = "none";
        }}
      >
        π
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            animation: "piFadeIn 0.25s ease-out",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div
            className="relative w-full max-w-md rounded-xl p-6 sm:p-8"
            style={{
              backgroundColor: "var(--cg-bg-secondary, #111111)",
              border: "1px solid var(--cg-border, #262626)",
              animation: "piScaleIn 0.25s ease-out",
            }}
          >
            {/* Close button */}
            <button
              onClick={close}
              aria-label="Close"
              className="absolute top-4 right-4 transition-colors cursor-pointer"
              style={{
                color: "var(--cg-text-muted, #666666)",
                background: "none",
                border: "none",
                fontSize: "18px",
                lineHeight: 1,
                padding: "4px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--cg-text-primary, #f5f5f5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--cg-text-muted, #666666)";
              }}
            >
              ✕
            </button>

            {/* Header */}
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--cg-text-primary, #f5f5f5)" }}>
              <span style={{ color: GREEN }}>π</span>
              <span style={{ color: "var(--cg-text-muted, #666666)", fontWeight: 300 }}> | </span>
              You Found It.
            </h2>

            {/* Body */}
            <p
              className="text-sm leading-relaxed mb-6"
              style={{ color: "var(--cg-text-secondary, #a3a3a3)" }}
            >
              This platform is in Founding Advisory mode. You&apos;ve been invited to pressure-test
              golfEQUALIZER before launch — the scoring engine, the course intelligence, the
              experience. Nothing is final. Everything is open. Tell us what this should become.
            </p>

            {/* CTA */}
            <Link
              href="/feedback"
              onClick={close}
              className="inline-block w-full text-center rounded-lg px-5 py-3 text-sm font-semibold transition-all duration-200"
              style={{
                backgroundColor: GREEN,
                color: "#0a0a0a",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#22c55e";
                e.currentTarget.style.boxShadow = `0 0 20px rgba(74, 222, 128, 0.3)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = GREEN;
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              Share Your Recommendations &rarr;
            </Link>
          </div>
        </div>
      )}

      {/* Keyframe animations */}
      <style jsx global>{`
        @keyframes piFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes piScaleIn {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </>
  );
}
