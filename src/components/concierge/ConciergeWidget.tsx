"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Flag } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi! I'm the GolfEQ Concierge. Ask me about any golf course — rankings, green fees, trip planning, or course comparisons. What can I help you with?",
};

function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export default function ConciergeWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionIdRef = useRef(generateSessionId());

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: "user",
      content: trimmed,
    };

    const assistantMessage: Message = {
      id: `asst_${Date.now()}`,
      role: "assistant",
      content: "",
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput("");
    setIsStreaming(true);

    // Build conversation history (exclude welcome message and the new messages)
    const history = messages
      .filter((m) => m.id !== "welcome")
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const response = await fetch("/api/concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          conversationHistory: history,
          sessionId: sessionIdRef.current,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Request failed" }));
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessage.id
              ? { ...m, content: err.error || "Something went wrong. Please try again." }
              : m
          )
        );
        setIsStreaming(false);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        setIsStreaming(false);
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || !trimmedLine.startsWith("data: ")) continue;

          const data = trimmedLine.slice(6);
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMessage.id
                    ? { ...m, content: m.content + parsed.content }
                    : m
                )
              );
            }
          } catch {
            // Skip malformed chunks
          }
        }
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessage.id
            ? { ...m, content: "Sorry, I couldn't connect to the service. Please try again." }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Chat Panel */}
      <div
        data-concierge-panel
        className={`fixed bottom-20 right-4 z-50 flex flex-col overflow-hidden rounded-2xl shadow-2xl transition-all duration-300 ease-in-out sm:right-6 ${
          isOpen
            ? "pointer-events-auto scale-100 opacity-100"
            : "pointer-events-none scale-95 opacity-0"
        }`}
        style={{
          width: "min(400px, calc(100vw - 2rem))",
          height: "min(500px, calc(100vh - 8rem))",
          backgroundColor: "var(--cg-bg-secondary)",
          border: "1px solid var(--cg-border)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{
            backgroundColor: "var(--cg-bg-tertiary)",
            borderBottom: "1px solid var(--cg-border)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full"
              style={{ backgroundColor: "var(--cg-accent)" }}
            >
              <Flag className="h-4 w-4" style={{ color: "var(--cg-text-inverse)" }} />
            </div>
            <div>
              <h3
                className="text-sm font-semibold leading-tight"
                style={{ color: "var(--cg-text-primary)", fontFamily: "Inter, sans-serif" }}
              >
                GolfEQ Concierge
              </h3>
              <p className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
                Powered by AI &bull; Ask me anything about golf courses
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:opacity-80"
            style={{ backgroundColor: "var(--cg-bg-card)" }}
            aria-label="Close concierge"
          >
            <X className="h-4 w-4" style={{ color: "var(--cg-text-secondary)" }} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  msg.role === "user" ? "rounded-br-md" : "rounded-bl-md"
                }`}
                style={
                  msg.role === "user"
                    ? {
                        backgroundColor: "var(--cg-accent)",
                        color: "var(--cg-text-inverse)",
                      }
                    : {
                        backgroundColor: "var(--cg-bg-card)",
                        color: "var(--cg-text-primary)",
                      }
                }
              >
                {msg.content || <TypingIndicator />}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div
          className="flex items-center gap-2 px-4 py-3 flex-shrink-0"
          style={{
            borderTop: "1px solid var(--cg-border)",
            backgroundColor: "var(--cg-bg-tertiary)",
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about courses, rankings, trips..."
            disabled={isStreaming}
            className="flex-1 rounded-xl px-3.5 py-2 text-sm outline-none placeholder:opacity-50"
            style={{
              backgroundColor: "var(--cg-bg-card)",
              color: "var(--cg-text-primary)",
              border: "1px solid var(--cg-border)",
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl transition-opacity disabled:opacity-30"
            style={{ backgroundColor: "var(--cg-accent)" }}
            aria-label="Send message"
          >
            <Send className="h-4 w-4" style={{ color: "var(--cg-text-inverse)" }} />
          </button>
        </div>

        {/* Powered by Perplexity */}
        <div
          className="flex-shrink-0 px-4 py-1.5 text-center"
          style={{
            backgroundColor: "var(--cg-bg-tertiary)",
            borderTop: "1px solid var(--cg-border-subtle)",
          }}
        >
          <a
            href="https://www.perplexity.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] transition-colors hover:underline"
            style={{ color: "var(--cg-text-muted)" }}
          >
            Powered by Perplexity
          </a>
        </div>
      </div>

      {/* Floating Chat Bubble */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300 hover:scale-105 sm:right-6 ${
          isOpen ? "rotate-0" : ""
        }`}
        style={{
          backgroundColor: "var(--cg-accent)",
          boxShadow: "0 4px 20px rgba(34, 197, 94, 0.3)",
        }}
        aria-label={isOpen ? "Close concierge" : "Open concierge"}
      >
        {isOpen ? (
          <X className="h-6 w-6" style={{ color: "var(--cg-text-inverse)" }} />
        ) : (
          <MessageCircle className="h-6 w-6" style={{ color: "var(--cg-text-inverse)" }} />
        )}
      </button>

      {/* Mobile fullscreen + typing animation */}
      <style jsx global>{`
        @media (max-width: 640px) {
          [data-concierge-panel] {
            bottom: 0 !important;
            right: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            border-radius: 0 !important;
          }
        }

        @keyframes bounce-dot {
          0%,
          80%,
          100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-6px);
          }
        }
      `}</style>
    </>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-1 px-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block h-2 w-2 rounded-full"
          style={{
            backgroundColor: "var(--cg-text-muted)",
            animation: `bounce-dot 1.4s ease-in-out ${i * 0.16}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
