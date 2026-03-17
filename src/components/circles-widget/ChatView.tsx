"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { ArrowLeft, Send, Loader2, Play } from "lucide-react";
import { formatRelativeTime, stringToColor, getInitials } from "./hooks";
import { useSession } from "next-auth/react";

interface MessageData {
  id: string;
  content: string;
  senderId: string;
  sender: { id: string; name: string | null; image: string | null };
  videoUrl?: string | null;
  videoTitle?: string | null;
  createdAt: string;
}

interface ParticipantData {
  id: string;
  name: string | null;
  image: string | null;
}

interface ChatViewProps {
  conversationId: string;
  onBack: () => void;
}

export function ChatView({ conversationId, onBack }: ChatViewProps) {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;

  const [messages, setMessages] = useState<MessageData[]>([]);
  const [participants, setParticipants] = useState<ParticipantData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");
  const [title, setTitle] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages/conversations/${conversationId}?limit=50`);
      if (res.ok) {
        const data = await res.json();
        // API returns { conversation: { participants, ... }, messages: [...] }
        const msgs = (data.messages ?? []).reverse(); // API returns newest first, we want oldest first
        setMessages(msgs);
        const parts = data.conversation?.participants ?? data.participants ?? [];
        setParticipants(parts);
        setTitle(data.conversation?.title || parts.find((p: any) => p.id !== userId)?.name || "Chat");
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [loading]);

  const handleSend = async () => {
    const content = input.trim();
    if (!content || sending) return;

    setSending(true);
    setInput("");

    // Optimistic update
    const optimistic: MessageData = {
      id: `temp-${Date.now()}`,
      content,
      senderId: userId,
      sender: {
        id: userId,
        name: session?.user?.name || "You",
        image: session?.user?.image || null,
      },
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const res = await fetch(`/api/messages/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const newMsg = await res.json();
        setMessages((prev) =>
          prev.map((m) => (m.id === optimistic.id ? newMsg : m))
        );
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      // Remove optimistic on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setInput(content);
    } finally {
      setSending(false);
    }
  };

  const otherParticipant = participants.find((p) => p.id !== userId) || participants[0];

  return (
    <div className="flex flex-col h-full cw-slide-in-right">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-3 py-3 shrink-0"
        style={{ borderBottom: "1px solid var(--cg-border)" }}
      >
        <button
          onClick={onBack}
          className="flex items-center justify-center rounded-lg transition-colors shrink-0"
          style={{ width: 32, height: 32, color: "var(--cg-text-secondary)" }}
        >
          <ArrowLeft style={{ width: 18, height: 18 }} />
        </button>
        <div className="relative shrink-0">
          {otherParticipant?.image ? (
            <img
              src={otherParticipant.image}
              alt=""
              className="rounded-full"
              style={{ width: 32, height: 32, objectFit: "cover" }}
            />
          ) : (
            <div
              className="rounded-full flex items-center justify-center text-white text-xs font-semibold"
              style={{
                width: 32,
                height: 32,
                backgroundColor: stringToColor(otherParticipant?.name || "?"),
              }}
            >
              {getInitials(otherParticipant?.name)}
            </div>
          )}
          <span
            className="absolute rounded-full"
            style={{
              width: 8,
              height: 8,
              bottom: 0,
              right: 0,
              backgroundColor: "var(--cg-accent)",
              border: "2px solid var(--cg-bg-secondary)",
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium truncate block" style={{ color: "var(--cg-text-primary)" }}>
            {title}
          </span>
          <span className="text-[10px]" style={{ color: "var(--cg-accent)" }}>
            Online
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin" style={{ width: 24, height: 24, color: "var(--cg-accent)" }} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <span className="text-sm" style={{ color: "var(--cg-text-muted)" }}>
              Start a conversation
            </span>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.senderId === userId;
            return (
              <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"} gap-2`}>
                {!isMine && (
                  <div className="shrink-0 self-end">
                    {msg.sender.image ? (
                      <img
                        src={msg.sender.image}
                        alt=""
                        className="rounded-full"
                        style={{ width: 28, height: 28, objectFit: "cover" }}
                      />
                    ) : (
                      <div
                        className="rounded-full flex items-center justify-center text-white text-[10px] font-semibold"
                        style={{
                          width: 28,
                          height: 28,
                          backgroundColor: stringToColor(msg.sender.name || "?"),
                        }}
                      >
                        {getInitials(msg.sender.name)}
                      </div>
                    )}
                  </div>
                )}
                <div
                  className="max-w-[75%] flex flex-col"
                  style={{ alignItems: isMine ? "flex-end" : "flex-start" }}
                >
                  {/* Video embed */}
                  {msg.videoUrl && (
                    <div
                      className="rounded-xl overflow-hidden mb-1"
                      style={{
                        width: "100%",
                        aspectRatio: "16/9",
                        backgroundColor: "var(--cg-bg-primary)",
                        border: "1px solid var(--cg-border-subtle)",
                      }}
                    >
                      <div className="w-full h-full flex items-center justify-center">
                        <Play style={{ width: 24, height: 24, color: "var(--cg-text-muted)" }} />
                      </div>
                    </div>
                  )}

                  {/* Message bubble */}
                  <div
                    className="px-3 py-2 text-sm"
                    style={{
                      backgroundColor: isMine ? "var(--cg-accent)" : "var(--cg-bg-tertiary)",
                      color: isMine ? "var(--cg-text-inverse)" : "var(--cg-text-primary)",
                      borderRadius: isMine
                        ? "16px 16px 4px 16px"
                        : "16px 16px 16px 4px",
                      wordBreak: "break-word",
                    }}
                  >
                    {msg.content}
                  </div>

                  {/* Timestamp */}
                  <span
                    className="text-[9px] mt-0.5 px-1"
                    style={{ color: "var(--cg-text-muted)" }}
                  >
                    {formatRelativeTime(msg.createdAt)}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        className="flex items-center gap-2 px-3 py-3 shrink-0"
        style={{ borderTop: "1px solid var(--cg-border)" }}
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type a message..."
          className="flex-1 bg-transparent border-none outline-none text-sm px-3 py-2 rounded-lg"
          style={{
            backgroundColor: "var(--cg-bg-tertiary)",
            color: "var(--cg-text-primary)",
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          className="flex items-center justify-center rounded-full transition-colors"
          style={{
            width: 36,
            height: 36,
            backgroundColor: input.trim() ? "var(--cg-accent)" : "var(--cg-bg-tertiary)",
            color: input.trim() ? "var(--cg-text-inverse)" : "var(--cg-text-muted)",
          }}
        >
          {sending ? (
            <Loader2 className="animate-spin" style={{ width: 16, height: 16 }} />
          ) : (
            <Send style={{ width: 16, height: 16 }} />
          )}
        </button>
      </div>
    </div>
  );
}
