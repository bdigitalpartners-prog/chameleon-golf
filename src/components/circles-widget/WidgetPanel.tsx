"use client";

import { X, MessageSquare, Users, MapPin, Play } from "lucide-react";

const TABS = [
  { key: "messages", label: "Messages", icon: MessageSquare },
  { key: "circles", label: "Circles", icon: Users },
  { key: "course", label: "This Course", icon: MapPin },
  { key: "video", label: "Video", icon: Play },
] as const;

export type TabKey = (typeof TABS)[number]["key"];

interface WidgetPanelProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  onClose: () => void;
  children: React.ReactNode;
}

export function WidgetPanel({ activeTab, onTabChange, onClose, children }: WidgetPanelProps) {
  return (
    <div
      className="fixed flex flex-col overflow-hidden cw-slide-up"
      style={{
        bottom: 188,
        right: 24,
        width: 380,
        height: 600,
        maxHeight: "80vh",
        zIndex: 9998,
        backgroundColor: "var(--cg-bg-secondary)",
        border: "1px solid var(--cg-border)",
        borderRadius: 16,
        boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid var(--cg-border)" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: "var(--cg-accent)" }}
          />
          <span
            className="font-semibold text-sm"
            style={{ color: "var(--cg-text-primary)" }}
          >
            Circles Social
          </span>
        </div>
        <button
          onClick={onClose}
          className="flex items-center justify-center rounded-lg transition-colors"
          style={{
            width: 32,
            height: 32,
            color: "var(--cg-text-muted)",
          }}
        >
          <X style={{ width: 18, height: 18 }} />
        </button>
      </div>

      {/* Tab bar */}
      <div
        className="flex shrink-0"
        style={{ borderBottom: "1px solid var(--cg-border)" }}
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className="flex-1 flex flex-col items-center gap-1 py-2.5 transition-colors relative"
              style={{
                color: isActive ? "var(--cg-text-primary)" : "var(--cg-text-muted)",
              }}
            >
              <Icon style={{ width: 18, height: 18 }} />
              <span className="text-[10px] font-medium">{tab.label}</span>
              {isActive && (
                <span
                  className="absolute bottom-0 left-2 right-2"
                  style={{
                    height: 2,
                    backgroundColor: "var(--cg-accent)",
                    borderRadius: 1,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">{children}</div>
    </div>
  );
}
