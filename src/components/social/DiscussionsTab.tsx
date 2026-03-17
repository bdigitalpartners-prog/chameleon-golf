"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  MessageSquare,
  Pin,
  Lock,
  Plus,
  ArrowLeft,
  Loader2,
  Send,
  Trash2,
  ChevronDown,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ThreadCategory =
  | "CONDITIONS"
  | "EVENTS"
  | "DINING"
  | "PRO_SHOP"
  | "GENERAL"
  | "TIPS";

interface ThreadAuthor {
  id: string;
  name: string;
  image?: string | null;
}

interface Thread {
  id: string;
  title: string;
  category: ThreadCategory;
  isPinned: boolean;
  isLocked: boolean;
  author: ThreadAuthor;
  replyCount: number;
  lastReplyAt: string | null;
  createdAt: string;
}

interface Reply {
  id: string;
  content: string;
  author: ThreadAuthor;
  createdAt: string;
}

interface ThreadDetail extends Thread {
  content?: string;
}

interface ThreadsResponse {
  threads: Thread[];
  total: number;
  page: number;
  limit: number;
}

interface RepliesResponse {
  replies: Reply[];
  total: number;
  page: number;
  limit: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const CATEGORY_LABELS: Record<ThreadCategory, string> = {
  CONDITIONS: "Conditions",
  EVENTS: "Events",
  DINING: "Dining",
  PRO_SHOP: "Pro Shop",
  GENERAL: "General",
  TIPS: "Tips",
};

const CATEGORY_COLORS: Record<ThreadCategory, string> = {
  CONDITIONS: "#22c55e",
  EVENTS: "#8b5cf6",
  DINING: "#f59e0b",
  PRO_SHOP: "#3b82f6",
  GENERAL: "#6b7280",
  TIPS: "#ec4899",
};

const FILTER_TABS: { label: string; value: ThreadCategory | null }[] = [
  { label: "All", value: null },
  { label: "Conditions", value: "CONDITIONS" },
  { label: "Events", value: "EVENTS" },
  { label: "Dining", value: "DINING" },
  { label: "Pro Shop", value: "PRO_SHOP" },
  { label: "General", value: "GENERAL" },
  { label: "Tips", value: "TIPS" },
];

const THREADS_PER_PAGE = 20;
const REPLIES_PER_PAGE = 20;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function Avatar({
  src,
  name,
  size = 32,
}: {
  src?: string | null;
  name: string;
  size?: number;
}) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        style={{ borderRadius: "50%", objectFit: "cover" }}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: "var(--cg-accent)",
        color: "var(--cg-text-inverse)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.4,
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function CategoryBadge({ category }: { category: ThreadCategory }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 9999,
        fontSize: 11,
        fontWeight: 600,
        color: "#fff",
        backgroundColor: CATEGORY_COLORS[category],
        lineHeight: "18px",
        whiteSpace: "nowrap",
      }}
    >
      {CATEGORY_LABELS[category]}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface DiscussionsTabProps {
  circleId: string;
  isAdmin: boolean;
  currentUserId?: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function DiscussionsTab({
  circleId,
  isAdmin,
  currentUserId,
}: DiscussionsTabProps) {
  /* ---------- state: list view ---------- */
  const [activeCategory, setActiveCategory] = useState<ThreadCategory | null>(
    null,
  );
  const [threads, setThreads] = useState<Thread[]>([]);
  const [totalThreads, setTotalThreads] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ---------- state: detail view ---------- */
  const [selectedThread, setSelectedThread] = useState<ThreadDetail | null>(
    null,
  );
  const [replies, setReplies] = useState<Reply[]>([]);
  const [repliesTotal, setRepliesTotal] = useState(0);
  const [repliesPage, setRepliesPage] = useState(1);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);

  /* ---------- state: new thread form ---------- */
  const [showNewThread, setShowNewThread] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<ThreadCategory>("GENERAL");
  const [newContent, setNewContent] = useState("");
  const [newThreadSubmitting, setNewThreadSubmitting] = useState(false);

  /* ---------------------------------------------------------------- */
  /*  Fetch thread list                                                */
  /* ---------------------------------------------------------------- */

  const fetchThreads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(THREADS_PER_PAGE),
      });
      if (activeCategory) params.set("category", activeCategory);
      const res = await fetch(
        `/api/circles/${circleId}/threads?${params.toString()}`,
      );
      if (!res.ok) throw new Error("Failed to load threads");
      const data: ThreadsResponse = await res.json();
      setThreads(data.threads);
      setTotalThreads(data.total);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [circleId, activeCategory, page]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  /* reset page when category changes */
  useEffect(() => {
    setPage(1);
  }, [activeCategory]);

  /* ---------------------------------------------------------------- */
  /*  Fetch replies for selected thread                                */
  /* ---------------------------------------------------------------- */

  const fetchReplies = useCallback(
    async (threadId: string, p: number) => {
      setRepliesLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(p),
          limit: String(REPLIES_PER_PAGE),
        });
        const res = await fetch(
          `/api/circles/${circleId}/threads/${threadId}/replies?${params.toString()}`,
        );
        if (!res.ok) throw new Error("Failed to load replies");
        const data: RepliesResponse = await res.json();
        setReplies(data.replies);
        setRepliesTotal(data.total);
      } catch {
        /* silently fail; user can retry */
      } finally {
        setRepliesLoading(false);
      }
    },
    [circleId],
  );

  const openThread = (thread: Thread) => {
    setSelectedThread(thread);
    setRepliesPage(1);
    setReplies([]);
    setReplyContent("");
    fetchReplies(thread.id, 1);
  };

  const closeThread = () => {
    setSelectedThread(null);
    setReplies([]);
  };

  /* ---------------------------------------------------------------- */
  /*  Submit reply                                                     */
  /* ---------------------------------------------------------------- */

  const submitReply = async () => {
    if (!selectedThread || !replyContent.trim()) return;
    setReplySubmitting(true);
    try {
      const res = await fetch(
        `/api/circles/${circleId}/threads/${selectedThread.id}/replies`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: replyContent.trim() }),
        },
      );
      if (!res.ok) throw new Error("Failed to post reply");
      setReplyContent("");
      fetchReplies(selectedThread.id, repliesPage);
      /* update reply count locally */
      setSelectedThread((prev) =>
        prev ? { ...prev, replyCount: prev.replyCount + 1 } : prev,
      );
    } catch {
      /* could show toast */
    } finally {
      setReplySubmitting(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Admin actions                                                    */
  /* ---------------------------------------------------------------- */

  const togglePin = async () => {
    if (!selectedThread) return;
    try {
      const res = await fetch(
        `/api/circles/${circleId}/threads/${selectedThread.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isPinned: !selectedThread.isPinned }),
        },
      );
      if (!res.ok) throw new Error("Failed to update thread");
      setSelectedThread((prev) =>
        prev ? { ...prev, isPinned: !prev.isPinned } : prev,
      );
    } catch {
      /* silent */
    }
  };

  const toggleLock = async () => {
    if (!selectedThread) return;
    try {
      const res = await fetch(
        `/api/circles/${circleId}/threads/${selectedThread.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isLocked: !selectedThread.isLocked }),
        },
      );
      if (!res.ok) throw new Error("Failed to update thread");
      setSelectedThread((prev) =>
        prev ? { ...prev, isLocked: !prev.isLocked } : prev,
      );
    } catch {
      /* silent */
    }
  };

  const deleteThread = async () => {
    if (!selectedThread) return;
    try {
      const res = await fetch(
        `/api/circles/${circleId}/threads/${selectedThread.id}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("Failed to delete thread");
      closeThread();
      fetchThreads();
    } catch {
      /* silent */
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Create new thread                                                */
  /* ---------------------------------------------------------------- */

  const submitNewThread = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    setNewThreadSubmitting(true);
    try {
      const res = await fetch(`/api/circles/${circleId}/threads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          category: newCategory,
          content: newContent.trim(),
        }),
      });
      if (!res.ok) throw new Error("Failed to create thread");
      setNewTitle("");
      setNewContent("");
      setNewCategory("GENERAL");
      setShowNewThread(false);
      setPage(1);
      fetchThreads();
    } catch {
      /* silent */
    } finally {
      setNewThreadSubmitting(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Pagination helpers                                               */
  /* ---------------------------------------------------------------- */

  const totalPages = Math.max(1, Math.ceil(totalThreads / THREADS_PER_PAGE));
  const totalReplyPages = Math.max(
    1,
    Math.ceil(repliesTotal / REPLIES_PER_PAGE),
  );

  /* ---------------------------------------------------------------- */
  /*  Sorted threads: pinned first                                     */
  /* ---------------------------------------------------------------- */

  const sortedThreads = [...threads].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  /* ================================================================ */
  /*  Render: Thread Detail                                            */
  /* ================================================================ */

  if (selectedThread) {
    const canDelete =
      isAdmin || selectedThread.author.id === currentUserId;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Back button */}
        <button
          onClick={closeThread}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "none",
            border: "none",
            color: "var(--cg-accent)",
            cursor: "pointer",
            padding: 0,
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          <ArrowLeft size={16} /> Back to threads
        </button>

        {/* Thread header */}
        <div
          style={{
            backgroundColor: "var(--cg-bg-card)",
            border: "1px solid var(--cg-border)",
            borderRadius: 12,
            padding: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "wrap",
                  marginBottom: 8,
                }}
              >
                {selectedThread.isPinned && (
                  <Pin size={14} style={{ color: "var(--cg-accent)" }} />
                )}
                {selectedThread.isLocked && (
                  <Lock
                    size={14}
                    style={{ color: "var(--cg-text-muted)" }}
                  />
                )}
                <h2
                  style={{
                    margin: 0,
                    fontSize: 18,
                    fontWeight: 700,
                    color: "var(--cg-text-primary)",
                  }}
                >
                  {selectedThread.title}
                </h2>
                <CategoryBadge category={selectedThread.category} />
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                  color: "var(--cg-text-secondary)",
                }}
              >
                <Avatar
                  src={selectedThread.author.image}
                  name={selectedThread.author.name}
                  size={24}
                />
                <span style={{ fontWeight: 500 }}>
                  {selectedThread.author.name}
                </span>
                <span style={{ color: "var(--cg-text-muted)" }}>
                  {timeAgo(selectedThread.createdAt)}
                </span>
              </div>
            </div>

            {/* Admin / author actions */}
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              {isAdmin && (
                <>
                  <button
                    onClick={togglePin}
                    title={
                      selectedThread.isPinned ? "Unpin thread" : "Pin thread"
                    }
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "6px 10px",
                      borderRadius: 8,
                      border: "1px solid var(--cg-border)",
                      background: selectedThread.isPinned
                        ? "var(--cg-accent-bg)"
                        : "var(--cg-bg-secondary)",
                      color: selectedThread.isPinned
                        ? "var(--cg-accent)"
                        : "var(--cg-text-secondary)",
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                  >
                    <Pin size={14} />
                    {selectedThread.isPinned ? "Unpin" : "Pin"}
                  </button>
                  <button
                    onClick={toggleLock}
                    title={
                      selectedThread.isLocked
                        ? "Unlock thread"
                        : "Lock thread"
                    }
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "6px 10px",
                      borderRadius: 8,
                      border: "1px solid var(--cg-border)",
                      background: selectedThread.isLocked
                        ? "var(--cg-accent-bg)"
                        : "var(--cg-bg-secondary)",
                      color: selectedThread.isLocked
                        ? "var(--cg-accent)"
                        : "var(--cg-text-secondary)",
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                  >
                    <Lock size={14} />
                    {selectedThread.isLocked ? "Unlock" : "Lock"}
                  </button>
                </>
              )}
              {canDelete && (
                <button
                  onClick={deleteThread}
                  title="Delete thread"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "6px 10px",
                    borderRadius: 8,
                    border: "1px solid var(--cg-border)",
                    background: "var(--cg-bg-secondary)",
                    color: "var(--cg-status-error, #ef4444)",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Replies */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {repliesLoading && replies.length === 0 ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: 32,
              }}
            >
              <Loader2
                size={24}
                style={{
                  color: "var(--cg-accent)",
                  animation: "spin 1s linear infinite",
                }}
              />
            </div>
          ) : replies.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: 32,
                color: "var(--cg-text-muted)",
                fontSize: 14,
              }}
            >
              No replies yet. Be the first to respond!
            </div>
          ) : (
            replies.map((reply) => (
              <div
                key={reply.id}
                style={{
                  backgroundColor: "var(--cg-bg-card)",
                  border: "1px solid var(--cg-border)",
                  borderRadius: 10,
                  padding: 16,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <Avatar
                    src={reply.author.image}
                    name={reply.author.name}
                    size={28}
                  />
                  <span
                    style={{
                      fontWeight: 600,
                      fontSize: 13,
                      color: "var(--cg-text-primary)",
                    }}
                  >
                    {reply.author.name}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--cg-text-muted)",
                    }}
                  >
                    {timeAgo(reply.createdAt)}
                  </span>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: "var(--cg-text-secondary)",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {reply.content}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Reply pagination */}
        {totalReplyPages > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 8,
            }}
          >
            <button
              disabled={repliesPage <= 1}
              onClick={() => {
                const p = repliesPage - 1;
                setRepliesPage(p);
                fetchReplies(selectedThread.id, p);
              }}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: "1px solid var(--cg-border)",
                background: "var(--cg-bg-secondary)",
                color: "var(--cg-text-secondary)",
                cursor: repliesPage <= 1 ? "not-allowed" : "pointer",
                opacity: repliesPage <= 1 ? 0.5 : 1,
                fontSize: 13,
              }}
            >
              Prev
            </button>
            <span
              style={{ fontSize: 13, color: "var(--cg-text-muted)" }}
            >
              {repliesPage} / {totalReplyPages}
            </span>
            <button
              disabled={repliesPage >= totalReplyPages}
              onClick={() => {
                const p = repliesPage + 1;
                setRepliesPage(p);
                fetchReplies(selectedThread.id, p);
              }}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: "1px solid var(--cg-border)",
                background: "var(--cg-bg-secondary)",
                color: "var(--cg-text-secondary)",
                cursor:
                  repliesPage >= totalReplyPages
                    ? "not-allowed"
                    : "pointer",
                opacity: repliesPage >= totalReplyPages ? 0.5 : 1,
                fontSize: 13,
              }}
            >
              Next
            </button>
          </div>
        )}

        {/* Reply form or locked notice */}
        {selectedThread.isLocked ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: 16,
              borderRadius: 10,
              backgroundColor: "var(--cg-bg-tertiary)",
              color: "var(--cg-text-muted)",
              fontSize: 14,
            }}
          >
            <Lock size={16} />
            This thread is locked
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "flex-end",
            }}
          >
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write a reply..."
              rows={3}
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 10,
                border: "1px solid var(--cg-border)",
                backgroundColor: "var(--cg-bg-card)",
                color: "var(--cg-text-primary)",
                fontSize: 14,
                resize: "vertical",
                fontFamily: "inherit",
                outline: "none",
              }}
            />
            <button
              onClick={submitReply}
              disabled={replySubmitting || !replyContent.trim()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 42,
                height: 42,
                borderRadius: 10,
                border: "none",
                backgroundColor: "var(--cg-accent)",
                color: "var(--cg-text-inverse)",
                cursor:
                  replySubmitting || !replyContent.trim()
                    ? "not-allowed"
                    : "pointer",
                opacity:
                  replySubmitting || !replyContent.trim() ? 0.5 : 1,
                flexShrink: 0,
              }}
            >
              {replySubmitting ? (
                <Loader2
                  size={18}
                  style={{ animation: "spin 1s linear infinite" }}
                />
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>
        )}

        {/* Spinner keyframes */}
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  /* ================================================================ */
  /*  Render: Thread List                                              */
  /* ================================================================ */

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Category filter tabs */}
      <div
        style={{
          display: "flex",
          gap: 6,
          overflowX: "auto",
          paddingBottom: 4,
          WebkitOverflowScrolling: "touch",
          msOverflowStyle: "none",
          scrollbarWidth: "none",
        }}
      >
        {FILTER_TABS.map((tab) => {
          const isActive = activeCategory === tab.value;
          return (
            <button
              key={tab.label}
              onClick={() => setActiveCategory(tab.value)}
              style={{
                padding: "6px 14px",
                borderRadius: 9999,
                border: isActive
                  ? "1px solid var(--cg-accent)"
                  : "1px solid var(--cg-border)",
                backgroundColor: isActive
                  ? "var(--cg-accent)"
                  : "var(--cg-bg-secondary)",
                color: isActive
                  ? "var(--cg-text-inverse)"
                  : "var(--cg-text-secondary)",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 500,
                whiteSpace: "nowrap",
                flexShrink: 0,
                transition: "all 0.15s ease",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* New thread toggle + form */}
      <div>
        <button
          onClick={() => setShowNewThread((v) => !v)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 16px",
            borderRadius: 10,
            border: "none",
            backgroundColor: "var(--cg-accent)",
            color: "var(--cg-text-inverse)",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {showNewThread ? (
            <ChevronDown size={16} />
          ) : (
            <Plus size={16} />
          )}
          New Thread
        </button>

        {showNewThread && (
          <div
            style={{
              marginTop: 12,
              backgroundColor: "var(--cg-bg-card)",
              border: "1px solid var(--cg-border)",
              borderRadius: 12,
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Thread title"
              style={{
                padding: 10,
                borderRadius: 8,
                border: "1px solid var(--cg-border)",
                backgroundColor: "var(--cg-bg-tertiary)",
                color: "var(--cg-text-primary)",
                fontSize: 14,
                outline: "none",
                fontFamily: "inherit",
              }}
            />
            <select
              value={newCategory}
              onChange={(e) =>
                setNewCategory(e.target.value as ThreadCategory)
              }
              style={{
                padding: 10,
                borderRadius: 8,
                border: "1px solid var(--cg-border)",
                backgroundColor: "var(--cg-bg-tertiary)",
                color: "var(--cg-text-primary)",
                fontSize: 14,
                outline: "none",
                fontFamily: "inherit",
              }}
            >
              {(Object.keys(CATEGORY_LABELS) as ThreadCategory[]).map(
                (cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]}
                  </option>
                ),
              )}
            </select>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="What would you like to discuss?"
              rows={4}
              style={{
                padding: 10,
                borderRadius: 8,
                border: "1px solid var(--cg-border)",
                backgroundColor: "var(--cg-bg-tertiary)",
                color: "var(--cg-text-primary)",
                fontSize: 14,
                resize: "vertical",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
            <button
              onClick={submitNewThread}
              disabled={
                newThreadSubmitting ||
                !newTitle.trim() ||
                !newContent.trim()
              }
              style={{
                alignSelf: "flex-end",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 20px",
                borderRadius: 10,
                border: "none",
                backgroundColor: "var(--cg-accent)",
                color: "var(--cg-text-inverse)",
                cursor:
                  newThreadSubmitting ||
                  !newTitle.trim() ||
                  !newContent.trim()
                    ? "not-allowed"
                    : "pointer",
                opacity:
                  newThreadSubmitting ||
                  !newTitle.trim() ||
                  !newContent.trim()
                    ? 0.5
                    : 1,
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {newThreadSubmitting ? (
                <Loader2
                  size={16}
                  style={{ animation: "spin 1s linear infinite" }}
                />
              ) : (
                <Send size={16} />
              )}
              Post Thread
            </button>
          </div>
        )}
      </div>

      {/* Thread list content */}
      {loading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: 48,
          }}
        >
          <Loader2
            size={28}
            style={{
              color: "var(--cg-accent)",
              animation: "spin 1s linear infinite",
            }}
          />
        </div>
      ) : error ? (
        <div
          style={{
            textAlign: "center",
            padding: 48,
            color: "var(--cg-status-error, #ef4444)",
            fontSize: 14,
          }}
        >
          {error}
        </div>
      ) : sortedThreads.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: 48,
            color: "var(--cg-text-muted)",
            fontSize: 14,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          <MessageSquare size={32} style={{ opacity: 0.4 }} />
          No threads yet. Start a discussion!
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {sortedThreads.map((thread) => (
            <button
              key={thread.id}
              onClick={() => openThread(thread)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                width: "100%",
                padding: 14,
                borderRadius: 10,
                border: "1px solid var(--cg-border)",
                backgroundColor: "var(--cg-bg-card)",
                cursor: "pointer",
                textAlign: "left",
                transition: "background-color 0.15s ease",
              }}
            >
              {/* Left: icons + title block */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    flexWrap: "wrap",
                    marginBottom: 4,
                  }}
                >
                  {thread.isPinned && (
                    <Pin
                      size={14}
                      style={{
                        color: "var(--cg-accent)",
                        flexShrink: 0,
                      }}
                    />
                  )}
                  {thread.isLocked && (
                    <Lock
                      size={14}
                      style={{
                        color: "var(--cg-text-muted)",
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <span
                    style={{
                      fontWeight: 600,
                      fontSize: 14,
                      color: "var(--cg-text-primary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {thread.title}
                  </span>
                  <CategoryBadge category={thread.category} />
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 12,
                    color: "var(--cg-text-muted)",
                  }}
                >
                  <Avatar
                    src={thread.author.image}
                    name={thread.author.name}
                    size={20}
                  />
                  <span>{thread.author.name}</span>
                </div>
              </div>

              {/* Right: reply count + last reply */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: 4,
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 12,
                    color: "var(--cg-text-secondary)",
                  }}
                >
                  <MessageSquare size={13} />
                  {thread.replyCount}
                </div>
                {thread.lastReplyAt && (
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--cg-text-muted)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {timeAgo(thread.lastReplyAt)}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 8,
          }}
        >
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              border: "1px solid var(--cg-border)",
              background: "var(--cg-bg-secondary)",
              color: "var(--cg-text-secondary)",
              cursor: page <= 1 ? "not-allowed" : "pointer",
              opacity: page <= 1 ? 0.5 : 1,
              fontSize: 13,
            }}
          >
            Prev
          </button>
          <span style={{ fontSize: 13, color: "var(--cg-text-muted)" }}>
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              border: "1px solid var(--cg-border)",
              background: "var(--cg-bg-secondary)",
              color: "var(--cg-text-secondary)",
              cursor: page >= totalPages ? "not-allowed" : "pointer",
              opacity: page >= totalPages ? 0.5 : 1,
              fontSize: 13,
            }}
          >
            Next
          </button>
        </div>
      )}

      {/* Spinner keyframes */}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export default DiscussionsTab;
