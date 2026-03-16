"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { Bell, Check, Loader2 } from "lucide-react";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  actionUrl: string | null;
  read: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close panel on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Fetch notifications
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications?limit=10");
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Poll for unread count
  useEffect(() => {
    if (!session) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [session]);

  const handleOpen = () => {
    setOpen((prev) => !prev);
    if (!open) fetchNotifications();
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications/mark-all-read", { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = (notif: NotificationItem) => {
    if (!notif.read) markAsRead(notif.id);
    if (notif.actionUrl) window.location.href = notif.actionUrl;
    setOpen(false);
  };

  if (!session) return null;

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay}d ago`;
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleOpen}
        className="relative rounded-lg p-2 transition-colors"
        style={{ color: "var(--cg-text-secondary)" }}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
            style={{ backgroundColor: "var(--cg-error, #ef4444)" }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 rounded-xl shadow-xl overflow-hidden z-50"
          style={{
            backgroundColor: "var(--cg-bg-card)",
            border: "1px solid var(--cg-border)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: "1px solid var(--cg-border)" }}
          >
            <h3
              className="text-sm font-semibold"
              style={{ color: "var(--cg-text-primary)" }}
            >
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs font-medium transition-colors"
                style={{ color: "var(--cg-accent)" }}
              >
                <Check className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="flex justify-center py-6">
                <Loader2
                  className="h-5 w-5 animate-spin"
                  style={{ color: "var(--cg-accent)" }}
                />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell
                  className="mx-auto h-8 w-8"
                  style={{ color: "var(--cg-text-muted)" }}
                />
                <p
                  className="mt-2 text-sm"
                  style={{ color: "var(--cg-text-muted)" }}
                >
                  No notifications yet
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className="w-full text-left px-4 py-3 transition-colors"
                  style={{
                    backgroundColor: notif.read
                      ? "transparent"
                      : "var(--cg-accent-bg)",
                    borderBottom: "1px solid var(--cg-border-subtle)",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      "var(--cg-bg-card-hover)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = notif.read
                      ? "transparent"
                      : "var(--cg-accent-bg)")
                  }
                >
                  <div className="flex items-start gap-2">
                    {!notif.read && (
                      <span
                        className="mt-1.5 h-2 w-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: "var(--cg-accent)" }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium truncate"
                        style={{ color: "var(--cg-text-primary)" }}
                      >
                        {notif.title}
                      </p>
                      {notif.body && (
                        <p
                          className="text-xs mt-0.5 line-clamp-2"
                          style={{ color: "var(--cg-text-muted)" }}
                        >
                          {notif.body}
                        </p>
                      )}
                      <p
                        className="text-xs mt-1"
                        style={{ color: "var(--cg-text-muted)" }}
                      >
                        {formatTime(notif.createdAt)}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
