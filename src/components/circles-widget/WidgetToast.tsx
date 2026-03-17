"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { stringToColor, getInitials } from "./hooks";

interface WidgetToastProps {
  senderName: string;
  senderImage: string | null;
  message: string;
  conversationId: string;
  onOpen: (conversationId: string) => void;
  onDismiss: () => void;
}

export function WidgetToast({
  senderName,
  senderImage,
  message,
  conversationId,
  onOpen,
  onDismiss,
}: WidgetToastProps) {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    // Animate in
    requestAnimationFrame(() => setVisible(true));

    // Auto-dismiss after 5s
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, 5000);

    // Progress bar
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      setProgress(Math.max(0, 100 - (elapsed / 5000) * 100));
    }, 50);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [onDismiss]);

  return (
    <div
      className="fixed transition-all duration-300"
      style={{
        bottom: 188,
        right: 24,
        width: 320,
        zIndex: 9997,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(100%)",
      }}
    >
      <div
        className="rounded-xl overflow-hidden"
        style={{
          backgroundColor: "var(--cg-bg-card)",
          border: "1px solid var(--cg-border)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
        }}
      >
        {/* Content */}
        <button
          onClick={() => onOpen(conversationId)}
          className="w-full flex items-center gap-3 px-4 py-3 text-left"
        >
          {senderImage ? (
            <img
              src={senderImage}
              alt=""
              className="rounded-full shrink-0"
              style={{ width: 36, height: 36, objectFit: "cover" }}
            />
          ) : (
            <div
              className="rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
              style={{ width: 36, height: 36, backgroundColor: stringToColor(senderName) }}
            >
              {getInitials(senderName)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium block truncate" style={{ color: "var(--cg-text-primary)" }}>
              {senderName}
            </span>
            <span className="text-xs block truncate" style={{ color: "var(--cg-text-secondary)" }}>
              {message}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setVisible(false);
              setTimeout(onDismiss, 300);
            }}
            className="shrink-0 rounded-lg p-1"
            style={{ color: "var(--cg-text-muted)" }}
          >
            <X style={{ width: 14, height: 14 }} />
          </button>
        </button>

        {/* Progress bar */}
        <div
          className="h-0.5 transition-all"
          style={{
            width: `${progress}%`,
            backgroundColor: "var(--cg-accent)",
          }}
        />
      </div>
    </div>
  );
}
