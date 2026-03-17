"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { WidgetLauncher } from "./WidgetLauncher";
import { WidgetPanel, type TabKey } from "./WidgetPanel";
import { MessagesTab } from "./MessagesTab";
import { CirclesTab } from "./CirclesTab";
import { CourseTab } from "./CourseTab";
import { VideoTab } from "./VideoTab";
import { ChatView } from "./ChatView";
import { WidgetToast } from "./WidgetToast";
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

  // Poll unread count
  const fetchUnread = useCallback(async () => {
    try {
      const res = await fetch("/api/messages/unread");
      if (res.ok) {
        const data = await res.json();
        const newCount = data.unreadCount ?? 0;

        // Show toast if unread increased and widget is closed
        if (!isOpen && newCount > prevUnreadRef.current && newCount > 0) {
          // In a real implementation, we'd fetch the latest unread message
          // For now, show a generic toast
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
  }, [isOpen]);

  useEffect(() => {
    if (!session) return;
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, [session, fetchUnread]);

  // Don't render for unauthenticated users
  if (!session) return null;

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
      {/* Toast notification — only when widget is closed */}
      {!isOpen && toast && (
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

      {/* Launcher FAB */}
      <WidgetLauncher
        isOpen={isOpen}
        unreadCount={unreadCount}
        onClick={handleToggle}
      />
    </>
  );
}
