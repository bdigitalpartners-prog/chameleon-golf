"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface UserSuggestion {
  id: string;
  name: string;
  image: string | null;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
  autoFocus?: boolean;
}

export function MentionInput({
  value,
  onChange,
  placeholder,
  className = "",
  rows = 3,
  autoFocus = false,
}: MentionInputProps) {
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionStart, setMentionStart] = useState(-1);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const searchUsers = useCallback(async (query: string) => {
    if (query.length < 1) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSuggestions(data.users ?? []);
    } catch {
      setSuggestions([]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    onChange(newValue);

    // Check for @ trigger
    const textBeforeCursor = newValue.slice(0, cursorPos);
    const atIndex = textBeforeCursor.lastIndexOf("@");

    if (atIndex >= 0) {
      const charBefore = atIndex > 0 ? textBeforeCursor[atIndex - 1] : " ";
      const query = textBeforeCursor.slice(atIndex + 1);
      // Only trigger if @ is at start or preceded by whitespace, and no space in query
      if ((charBefore === " " || charBefore === "\n" || atIndex === 0) && !query.includes(" ")) {
        setMentionStart(atIndex);
        setShowSuggestions(true);
        setSelectedIndex(0);
        searchUsers(query);
        return;
      }
    }
    setShowSuggestions(false);
  };

  const insertMention = (user: UserSuggestion) => {
    const before = value.slice(0, mentionStart);
    const textarea = textareaRef.current;
    const cursorPos = textarea?.selectionStart ?? value.length;
    const after = value.slice(cursorPos);
    const mention = `@[${user.name}](${user.id}) `;
    const newValue = before + mention + after;
    onChange(newValue);
    setShowSuggestions(false);

    // Reset cursor position
    setTimeout(() => {
      if (textarea) {
        const pos = before.length + mention.length;
        textarea.selectionStart = pos;
        textarea.selectionEnd = pos;
        textarea.focus();
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter" && showSuggestions) {
      e.preventDefault();
      insertMention(suggestions[selectedIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    }
  }, [value]);

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        autoFocus={autoFocus}
        className={`w-full resize-none rounded-lg px-3 py-2 text-sm outline-none ${className}`}
        style={{
          backgroundColor: "var(--cg-bg-secondary)",
          color: "var(--cg-text-primary)",
          border: "1px solid var(--cg-border)",
        }}
      />
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute left-0 right-0 z-50 mt-1 rounded-lg shadow-lg overflow-hidden"
          style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
        >
          {suggestions.map((user, i) => (
            <button
              key={user.id}
              onClick={() => insertMention(user)}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition-colors"
              style={{
                backgroundColor: i === selectedIndex ? "var(--cg-bg-secondary)" : "transparent",
                color: "var(--cg-text-primary)",
              }}
            >
              <div
                className="h-6 w-6 rounded-full flex-shrink-0 overflow-hidden"
                style={{ backgroundColor: "var(--cg-bg-tertiary)" }}
              >
                {user.image ? (
                  <img src={user.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-xs" style={{ color: "var(--cg-text-muted)" }}>
                    {user.name?.[0] ?? "?"}
                  </div>
                )}
              </div>
              <span>{user.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
