"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession, signIn } from "next-auth/react";
import { WidgetLauncher } from "./WidgetLauncher";
import { WidgetPanel, type TabKey } from "./WidgetPanel";
import { MessagesTab } from "./MessagesTab";
import { CirclesTab } from "./CirclesTab";
import { CourseTab } from "./CourseTab";
import { VideoTab } from "./VideoTab";
import { ChatView } from "./ChatView";
import { WidgetToast } from "./WidgetToast";
import { LogIn } from "lucide-react";
import "./widget-styles.css";

interface ToastData {
  senderName: string;
  senderImage: string | null;
  message: string;
  conversationId: string;
}

export function CirclesSocialWidget() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("messages");
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toast, setToast] = useState<ToastData | null>(null);
  const prevUnreadRef = useRef(0);

  // Poll unread count (only when authenticated)
  const fetchUnread = useCallback(async () => {
    if (!session) return;
    try {
      const res = await fetch("/api/messages/unread");
      if (res.ok) {
        const data = await res.json();
        const newCount = data.unreadCount ?? 0;

        // Show toast if unread increased and widget is closed
        if (!isOpen && newCount > prevUnreadRef.current && newCount > 0) {
          setToast({
            senderName: "New message",
            senderImage: null,
            message: "You have a new message",
            conversationId: "",
          });
        }

        prevUnreadRef.current = newCount;
        setUnreadCount(newCount);
      }
    } catch {
      // Silently ignore polling failures
    }
  }, [isOpen, session]);

  useEffect(() => {
    if (!session) return;
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, [session, fetchUnread]);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
    if (!isOpen) {
      setActiveChatId(null);
      setToast(null);
    }
  };

  const handleOpenChat = (conversationId: string) => {
    setActiveChatId(conversationId);
  };

  const handleBackFromChat = () => {
    setActiveChatId(null);
  };

  const handleToastOpen = (conversationId: string) => {
    setToast(null);
    setIsOpen(true);
    if (conversationId) {
      setActiveChatId(conversationId);
    }
  };

  const renderTabContent = () => {
    // If user is not authenticated, show sign-in prompt
    if (!session) {
      return (
        <div
          className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center"
          style={{ color: "var(--cg-text-secondary)" }}
        >
          <div
            className="flex items-center justify-center rounded-full"
            style={{
              width: 64,
              height: 64,
              backgroundColor: "var(--cg-accent)",
              opacity: 0.15,
            }}
          >
            <LogIn style={{ width: 32, height: 32, color: "var(--cg-accent)", opacity: 1 }} />
          </div>
          <h3
            className="text-lg font-semibold"
            style={{ color: "var(--cg-text-primary)" }}
          >
            Join the Conversation
          </h3>
          <p className="text-sm" style={{ color: "var(--cg-text-muted)", lineHeight: 1.5 }}>
            Sign in to message other golfers, join Circles, and connect with the community.
          </p>
          <button
            onClick={() => signIn()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-200"
            style={{
              backgroundColor: "var(--cg-accent)",
              color: "var(--cg-text-inverse)",
            }}
          >
            <LogIn style={{ width: 16, height: 16 }} />
            Sign In
          </button>
        </div>
      );
    }

    if (activeChatId) {
      return <ChatView conversationId={activeChatId} onBack={handleBackFromChat} />;
    }

    switch (activeTab) {
      case "messages":
        return <MessagesTab onOpenChat={handleOpenChat} />;
      case "circles":
        return <CirclesTab />;
      case "course":
        return <CourseTab />;
      case "video":
        return <VideoTab />;
      default:
        return null;
    }
  };

  return (
    <>
      {/* Toast notification — only when widget is closed and authenticated */}
      {!isOpen && toast && session && (
        <WidgetToast
          senderName={toast.senderName}
          senderImage={toast.senderImage}
          message={toast.message}
          conversationId={toast.conversationId}
          onOpen={handleToastOpen}
          onDismiss={() => setToast(null)}
        />
      )}

      {/* Widget panel */}
      {isOpen && (
        <WidgetPanel
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setActiveChatId(null);
          }}
          onClose={() => setIsOpen(false)}
        >
          {renderTabContent()}
        </WidgetPanel>
      )}

      {/* Launcher FAB — always visible */}
      <WidgetLauncher
        isOpen={isOpen}
        unreadCount={unreadCount}
        onClick={handleToggle}
      />
    </>
  );
}
