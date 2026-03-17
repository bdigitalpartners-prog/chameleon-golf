"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, X, MapPin, Star } from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  courseId: number | null;
  matchScore: number | null;
  isRead: boolean;
  isDismissed: boolean;
  createdAt: string;
}

export default function ProactiveNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/ai/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch (error) {
      console.error("Failed to fetch AI notifications:", error);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Poll every 5 minutes for new notifications
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close panel when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleDismiss = async (notificationId: string) => {
    try {
      const res = await fetch("/api/ai/notifications/dismiss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });
      if (!res.ok) return;

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to dismiss notification:", error);
    }
  };

  const handleGenerateRecommendations = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/ai/generate-recommendations", {
        method: "POST",
      });
      if (res.ok) {
        await fetchNotifications();
      }
    } catch (error) {
      console.error("Failed to generate recommendations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "new_course_match":
        return <MapPin className="h-4 w-4 text-green-400 flex-shrink-0" />;
      case "handicap_update":
        return <Star className="h-4 w-4 text-yellow-400 flex-shrink-0" />;
      default:
        return <Bell className="h-4 w-4 text-blue-400 flex-shrink-0" />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div ref={panelRef} className="relative">
      {/* Bell Button with Badge */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#111111] border border-gray-800 transition-colors hover:border-gray-600"
        aria-label="AI Notifications"
      >
        <Bell className="h-5 w-5 text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-12 z-50 w-80 rounded-xl bg-[#111111] border border-gray-800 shadow-2xl overflow-hidden sm:w-96">
          {/* Panel Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <h3 className="text-sm font-semibold text-white">
              AI Recommendations
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleGenerateRecommendations}
                disabled={isLoading}
                className="text-xs text-green-400 hover:text-green-300 transition-colors disabled:opacity-50"
              >
                {isLoading ? "Generating..." : "Refresh"}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-gray-800 transition-colors"
                aria-label="Close notifications"
              >
                <X className="h-3.5 w-3.5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <Bell className="h-8 w-8 text-gray-600 mb-2" />
                <p className="text-sm text-gray-400">
                  No recommendations yet
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  We'll suggest courses based on your profile
                </p>
                <button
                  onClick={handleGenerateRecommendations}
                  disabled={isLoading}
                  className="mt-3 rounded-lg bg-green-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-green-500 transition-colors disabled:opacity-50"
                >
                  {isLoading ? "Generating..." : "Generate Now"}
                </button>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-gray-800 last:border-b-0 transition-colors hover:bg-gray-900 ${
                    !notification.isRead ? "bg-gray-900/50" : ""
                  }`}
                >
                  <div className="mt-0.5">
                    {getTypeIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-white truncate">
                        {notification.title}
                      </p>
                      <button
                        onClick={() => handleDismiss(notification.id)}
                        className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full hover:bg-gray-800 transition-colors"
                        aria-label="Dismiss notification"
                      >
                        <X className="h-3 w-3 text-gray-500" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {notification.matchScore && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-green-400">
                          <Star className="h-3 w-3" />
                          {Math.round(notification.matchScore)} match
                        </span>
                      )}
                      <span className="text-[10px] text-gray-500">
                        {formatTime(notification.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
