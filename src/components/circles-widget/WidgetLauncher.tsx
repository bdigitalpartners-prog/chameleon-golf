"use client";

import { MessageCircle, X } from "lucide-react";

interface WidgetLauncherProps {
  isOpen: boolean;
  unreadCount: number;
  onClick: () => void;
}

export function WidgetLauncher({ isOpen, unreadCount, onClick }: WidgetLauncherProps) {
  return (
    <button
      onClick={onClick}
      className="fixed flex items-center justify-center rounded-full transition-all duration-300"
      style={{
        bottom: 120,
        right: 24,
        width: 56,
        height: 56,
        zIndex: 9999,
        backgroundColor: isOpen ? "var(--cg-bg-tertiary)" : "var(--cg-accent)",
        color: isOpen ? "var(--cg-text-primary)" : "var(--cg-text-inverse)",
        boxShadow: isOpen
          ? "0 4px 16px rgba(0,0,0,0.4)"
          : "0 4px 16px rgba(34, 197, 94, 0.3), 0 2px 8px rgba(0,0,0,0.3)",
      }}
    >
      {/* Pulse ring — only visible when closed and has unread */}
      {!isOpen && unreadCount > 0 && (
        <span
          className="cw-pulse-ring absolute inset-[-4px] rounded-full pointer-events-none"
          style={{ border: "2px solid var(--cg-accent)" }}
        />
      )}

      {/* Icon transition */}
      <span className="relative flex items-center justify-content-center">
        <MessageCircle
          className="transition-all duration-300"
          style={{
            width: 24,
            height: 24,
            opacity: isOpen ? 0 : 1,
            transform: isOpen ? "rotate(90deg) scale(0.5)" : "rotate(0deg) scale(1)",
            position: isOpen ? "absolute" : "relative",
          }}
        />
        <X
          className="transition-all duration-300"
          style={{
            width: 24,
            height: 24,
            opacity: isOpen ? 1 : 0,
            transform: isOpen ? "rotate(0deg) scale(1)" : "rotate(-90deg) scale(0.5)",
            position: isOpen ? "relative" : "absolute",
          }}
        />
      </span>

      {/* Unread badge */}
      {!isOpen && unreadCount > 0 && (
        <span
          className="cw-badge-animate absolute flex items-center justify-center text-white font-bold"
          style={{
            top: -4,
            right: -4,
            minWidth: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: "var(--cg-error)",
            fontSize: 12,
            padding: "0 6px",
            border: "2px solid var(--cg-bg-primary)",
          }}
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );
}
