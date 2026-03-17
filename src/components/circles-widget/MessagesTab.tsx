"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, MessageSquare, Loader2 } from "lucide-react";
import { formatRelativeTime, stringToColor, getInitials } from "./hooks";

interface Participant {
  id: string;
  name: string | null;
  image: string | null;
}

interface ConversationItem {
  id: string;
  type: string;
  title: string | null;
  updatedAt: string;
  participants: Participant[];
  lastMessage: { content: string; createdAt: string; senderId: string } | null;
  unreadCount: number;
}

interface MessagesTabProps {
  onOpenChat: (conversationId: string) => void;
}

export function MessagesTab({ onOpenChat }: MessagesTabProps) {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchConversations = useCallback(async () => {
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : "";
      const res = await fetch(`/api/messages/conversations${params}`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations ?? []);
      }
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(fetchConversations, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchConversations, search]);

  // Poll every 10s
  useEffect(() => {
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3">
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{ backgroundColor: "var(--cg-bg-tertiary)" }}
        >
          <Search
            style={{ width: 16, height: 16, color: "var(--cg-text-muted)", flexShrink: 0 }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="bg-transparent border-none outline-none text-sm flex-1"
            style={{ color: "var(--cg-text-primary)" }}
          />
        </div>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2
              className="animate-spin"
              style={{ width: 24, height: 24, color: "var(--cg-accent)" }}
            />
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <MessageSquare
              style={{ width: 40, height: 40, color: "var(--cg-text-muted)" }}
            />
            <span className="text-sm" style={{ color: "var(--cg-text-muted)" }}>
              No conversations yet
            </span>
          </div>
        ) : (
          conversations.map((conv) => {
            const otherParticipant = conv.participants[0];
            const displayName = conv.title || otherParticipant?.name || "Unknown";
            const initials = getInitials(displayName);
            const avatarColor = stringToColor(displayName);

            return (
              <button
                key={conv.id}
                onClick={() => onOpenChat(conv.id)}
                className="w-full flex items-center gap-3 px-4 py-3 transition-colors text-left"
                style={{
                  borderBottom: "1px solid var(--cg-border-subtle)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "var(--cg-bg-card-hover)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                }}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  {otherParticipant?.image ? (
                    <img
                      src={otherParticipant.image}
                      alt=""
                      className="rounded-full"
                      style={{ width: 40, height: 40, objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      className="rounded-full flex items-center justify-center text-sm font-semibold text-white"
                      style={{ width: 40, height: 40, backgroundColor: avatarColor }}
                    >
                      {initials}
                    </div>
                  )}
                  {/* Online dot */}
                  <span
                    className="absolute rounded-full"
                    style={{
                      width: 10,
                      height: 10,
                      bottom: 0,
                      right: 0,
                      backgroundColor: "var(--cg-accent)",
                      border: "2px solid var(--cg-bg-secondary)",
                    }}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span
                      className="text-sm font-medium truncate"
                      style={{
                        color: conv.unreadCount > 0
                          ? "var(--cg-text-primary)"
                          : "var(--cg-text-secondary)",
                      }}
                    >
                      {displayName}
                    </span>
                    <span
                      className="text-[10px] shrink-0 ml-2"
                      style={{ color: "var(--cg-text-muted)" }}
                    >
                      {conv.lastMessage
                        ? formatRelativeTime(conv.lastMessage.createdAt)
                        : ""}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span
                      className="text-xs truncate"
                      style={{ color: "var(--cg-text-muted)" }}
                    >
                      {conv.lastMessage?.content || "No messages yet"}
                    </span>
                    {conv.unreadCount > 0 && (
                      <span
                        className="shrink-0 ml-2 flex items-center justify-center text-white font-bold"
                        style={{
                          minWidth: 20,
                          height: 20,
                          borderRadius: 10,
                          fontSize: 10,
                          padding: "0 6px",
                          backgroundColor: "var(--cg-accent)",
                        }}
                      >
                        {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
