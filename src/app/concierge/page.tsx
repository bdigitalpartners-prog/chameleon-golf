"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Send,
  Sparkles,
  MapPin,
  DollarSign,
  Footprints,
  Globe,
  Loader2,
  MessageSquare,
  ChevronRight,
} from "lucide-react";

interface CourseCard {
  courseId: number;
  name: string;
  location: string;
  style: string;
  accessType: string;
  greenFee: string;
  architect: string;
  walkable: boolean | null;
  logoUrl: string | null;
  numHoles: number | null;
  par: number | null;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  courses?: CourseCard[];
  suggestions?: string[];
  filters_applied?: Record<string, any>;
}

const SUGGESTION_ICONS: Record<string, any> = {
  walk: Footprints,
  dollar: DollarSign,
  waves: Globe,
  globe: Globe,
  sun: Sparkles,
  architect: Sparkles,
  mountain: MapPin,
  map: MapPin,
};

export default function ConciergePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/concierge/suggestions")
      .then((r) => r.json())
      .then((data) => setSuggestions(data.suggestions || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text.trim(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsLoading(true);

      try {
        const res = await fetch("/api/concierge/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text.trim(),
            sessionId: `session-${Date.now()}`,
            conversationId,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to get response");
        }

        if (data.conversationId) setConversationId(data.conversationId);

        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: data.message,
          courses: data.courses,
          suggestions: data.suggestions,
          filters_applied: data.filters_applied,
        };

        setMessages((prev) => [...prev, aiMsg]);
      } catch (err) {
        const errorMsg: ChatMessage = {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: "Sorry, I had trouble processing that request. Please try again.",
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
        inputRef.current?.focus();
      }
    },
    [isLoading, conversationId]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestionClick = (text: string) => {
    sendMessage(text);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-[#222]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#00FF85]/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-[#00FF85]" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">AI Concierge</h1>
            <p className="text-xs text-[#9CA3AF]">
              Natural language course discovery
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {messages.length === 0 ? (
          <WelcomeScreen
            suggestions={suggestions}
            onSuggestionClick={handleSuggestionClick}
          />
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              onSuggestionClick={handleSuggestionClick}
            />
          ))
        )}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#00FF85]/20 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-[#00FF85]" />
            </div>
            <div className="bg-[#111] border border-[#222] rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-[#00FF85] animate-spin" />
                <span className="text-sm text-[#9CA3AF]">
                  Searching courses...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 px-6 py-4 border-t border-[#222]">
        {/* Inline suggestions after messages */}
        {messages.length > 0 && !isLoading && (
          <div className="flex flex-wrap gap-2 mb-3">
            {(
              messages[messages.length - 1]?.suggestions || []
            ).map((s: string, i: number) => (
              <button
                key={i}
                onClick={() => handleSuggestionClick(s)}
                className="text-xs px-3 py-1.5 rounded-full border border-[#333] text-[#9CA3AF] hover:border-[#00FF85]/50 hover:text-[#00FF85] transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me about golf courses..."
            className="flex-1 bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#666] focus:outline-none focus:border-[#00FF85]/50 transition-colors"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 rounded-xl bg-[#00FF85] text-black flex items-center justify-center hover:bg-[#00FF85]/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

function WelcomeScreen({
  suggestions,
  onSuggestionClick,
}: {
  suggestions: any[];
  onSuggestionClick: (text: string) => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-[#00FF85]/10 flex items-center justify-center mb-6">
        <MessageSquare className="w-8 h-8 text-[#00FF85]" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">
        Golf Course Concierge
      </h2>
      <p className="text-[#9CA3AF] mb-8 max-w-md">
        Ask me anything about golf courses. I can help you find courses by
        style, location, price, architect, and more.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
        {suggestions.map((s: any, i: number) => {
          const Icon = SUGGESTION_ICONS[s.icon] || Sparkles;
          return (
            <button
              key={i}
              onClick={() => onSuggestionClick(s.text)}
              className="flex items-center gap-3 text-left p-3 rounded-xl bg-[#111] border border-[#222] hover:border-[#00FF85]/30 transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-[#00FF85]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#00FF85]/20 transition-colors">
                <Icon className="w-4 h-4 text-[#00FF85]" />
              </div>
              <span className="text-sm text-[#9CA3AF] group-hover:text-white transition-colors">
                {s.text}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  onSuggestionClick,
}: {
  message: ChatMessage;
  onSuggestionClick: (text: string) => void;
}) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="bg-[#00FF85] text-black rounded-2xl rounded-br-sm px-4 py-3 max-w-[80%]">
          <p className="text-sm font-medium">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-[#00FF85]/20 flex items-center justify-center flex-shrink-0 mt-1">
        <Sparkles className="w-4 h-4 text-[#00FF85]" />
      </div>
      <div className="flex-1 space-y-3 max-w-[90%]">
        <div className="bg-[#111] border border-[#222] rounded-2xl rounded-tl-sm px-4 py-3">
          <p className="text-sm text-[#e0e0e0] leading-relaxed">
            {message.content}
          </p>
        </div>

        {/* Course Cards */}
        {message.courses && message.courses.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {message.courses.slice(0, 8).map((course) => (
              <MiniCourseCard key={course.courseId} course={course} />
            ))}
          </div>
        )}

        {/* Applied Filters */}
        {message.filters_applied &&
          Object.keys(message.filters_applied).length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(message.filters_applied).map(([key, val]) => {
                if (!val || key === "limit") return null;
                const display = Array.isArray(val) ? val.join(", ") : String(val);
                return (
                  <span
                    key={key}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-[#00FF85]/10 text-[#00FF85] border border-[#00FF85]/20"
                  >
                    {key.replace(/_/g, " ")}: {display}
                  </span>
                );
              })}
            </div>
          )}
      </div>
    </div>
  );
}

function MiniCourseCard({ course }: { course: CourseCard }) {
  return (
    <Link
      href={`/course/${course.courseId}`}
      className="flex items-center gap-3 p-3 rounded-xl bg-[#0d0d0d] border border-[#1a1a1a] hover:border-[#00FF85]/30 transition-colors group"
    >
      {course.logoUrl ? (
        <img
          src={course.logoUrl}
          alt=""
          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-10 h-10 rounded-lg bg-[#1a1a1a] flex items-center justify-center flex-shrink-0">
          <MapPin className="w-4 h-4 text-[#666]" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate group-hover:text-[#00FF85] transition-colors">
          {course.name}
        </p>
        <p className="text-[11px] text-[#9CA3AF] truncate">{course.location}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-[#00FF85] font-medium">
            {course.greenFee}
          </span>
          {course.style && (
            <span className="text-[10px] text-[#666]">{course.style}</span>
          )}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-[#333] group-hover:text-[#00FF85] transition-colors flex-shrink-0" />
    </Link>
  );
}
