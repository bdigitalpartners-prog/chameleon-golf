"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  Plus,
  X,
  Pin,
  Lock,
  MessageSquare,
  ArrowLeft,
  Send,
} from "lucide-react";

const CATEGORIES = [
  { key: "", label: "All" },
  { key: "CONDITIONS", label: "Conditions" },
  { key: "EVENTS", label: "Events" },
  { key: "DINING", label: "Dining" },
  { key: "PRO_SHOP", label: "Pro Shop" },
  { key: "GENERAL", label: "General" },
  { key: "TIPS", label: "Tips" },
];

interface ThreadData {
  id: string;
  title: string;
  category: string;
  isPinned: boolean;
  isLocked: boolean;
  replyCount: number;
  lastReplyAt: string | null;
  createdAt: string;
  author: { id: string; name: string; image: string | null };
  _count: { replies: number };
}

interface ReplyData {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; name: string; image: string | null };
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function CircleDiscussionsTab({
  circleId,
  isAdmin,
}: {
  circleId: string;
  isAdmin: boolean;
}) {
  const [threads, setThreads] = useState<ThreadData[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Thread detail state
  const [selectedThread, setSelectedThread] = useState<ThreadData | null>(null);
  const [replies, setReplies] = useState<ReplyData[]>([]);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [replyPage, setReplyPage] = useState(1);
  const [replyTotalPages, setReplyTotalPages] = useState(1);

  // Form state
  const [form, setForm] = useState({
    title: "",
    content: "",
    category: "GENERAL",
  });

  useEffect(() => {
    if (!selectedThread) fetchThreads();
  }, [circleId, category, page]);

  const fetchThreads = () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "15" });
    if (category) params.set("category", category);
    fetch(`/api/circles/${circleId}/threads?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setThreads(data.threads ?? []);
        setTotalPages(data.totalPages ?? 1);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const fetchReplies = (threadId: string, p: number = 1) => {
    setRepliesLoading(true);
    fetch(`/api/circles/${circleId}/threads/${threadId}?page=${p}&limit=20`)
      .then((r) => r.json())
      .then((data) => {
        setReplies(data.replies ?? []);
        setReplyTotalPages(data.totalPages ?? 1);
      })
      .catch(console.error)
      .finally(() => setRepliesLoading(false));
  };

  const openThread = (thread: ThreadData) => {
    setSelectedThread(thread);
    setReplyPage(1);
    fetchReplies(thread.id, 1);
  };

  const handleCreate = async () => {
    if (!form.title || !form.content) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/circles/${circleId}/threads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create thread");
      setShowForm(false);
      setForm({ title: "", content: "", category: "GENERAL" });
      fetchThreads();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async () => {
    if (!replyContent || !selectedThread) return;
    setReplySubmitting(true);
    try {
      const res = await fetch(
        `/api/circles/${circleId}/threads/${selectedThread.id}/replies`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: replyContent }),
        }
      );
      if (res.ok) {
        setReplyContent("");
        fetchReplies(selectedThread.id, replyPage);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReplySubmitting(false);
    }
  };

  const handleTogglePin = async (threadId: string, isPinned: boolean) => {
    try {
      await fetch(`/api/circles/${circleId}/threads/${threadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: !isPinned }),
      });
      fetchThreads();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleLock = async (threadId: string, isLocked: boolean) => {
    try {
      await fetch(`/api/circles/${circleId}/threads/${threadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isLocked: !isLocked }),
      });
      fetchThreads();
    } catch (err) {
      console.error(err);
    }
  };

  // Thread detail view
  if (selectedThread) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => {
            setSelectedThread(null);
            fetchThreads();
          }}
          className="flex items-center gap-1 text-sm"
          style={{ color: "var(--cg-text-muted)" }}
        >
          <ArrowLeft className="h-4 w-4" /> Back to Discussions
        </button>

        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
        >
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {selectedThread.isPinned && (
                  <Pin className="h-3 w-3" style={{ color: "var(--cg-accent)" }} />
                )}
                {selectedThread.isLocked && (
                  <Lock className="h-3 w-3" style={{ color: "var(--cg-status-warning, #f59e0b)" }} />
                )}
                <h3 className="font-semibold" style={{ color: "var(--cg-text-primary)" }}>
                  {selectedThread.title}
                </h3>
              </div>
              <p className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
                {selectedThread.author.name} ·{" "}
                <span
                  className="rounded-full px-1.5 py-0.5"
                  style={{ backgroundColor: "var(--cg-bg-tertiary)" }}
                >
                  {selectedThread.category.replace("_", " ")}
                </span>{" "}
                · {timeAgo(selectedThread.createdAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Replies */}
        {repliesLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--cg-accent)" }} />
          </div>
        ) : (
          <div className="space-y-2">
            {replies.map((reply) => (
              <div
                key={reply.id}
                className="rounded-xl p-3"
                style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
                    style={{ backgroundColor: "var(--cg-bg-tertiary)" }}
                  >
                    {reply.author.image ? (
                      <img src={reply.author.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
                        {reply.author.name?.[0]}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-medium" style={{ color: "var(--cg-text-primary)" }}>
                    {reply.author.name}
                  </span>
                  <span className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
                    {timeAgo(reply.createdAt)}
                  </span>
                </div>
                <p className="text-sm pl-8" style={{ color: "var(--cg-text-secondary)" }}>
                  {reply.content}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Reply pagination */}
        {replyTotalPages > 1 && (
          <div className="flex justify-center gap-2">
            <button
              onClick={() => {
                const p = Math.max(1, replyPage - 1);
                setReplyPage(p);
                fetchReplies(selectedThread.id, p);
              }}
              disabled={replyPage <= 1}
              className="rounded-lg px-3 py-1.5 text-sm disabled:opacity-50"
              style={{ backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-text-secondary)" }}
            >
              Previous
            </button>
            <span className="flex items-center text-sm" style={{ color: "var(--cg-text-muted)" }}>
              Page {replyPage} of {replyTotalPages}
            </span>
            <button
              onClick={() => {
                const p = Math.min(replyTotalPages, replyPage + 1);
                setReplyPage(p);
                fetchReplies(selectedThread.id, p);
              }}
              disabled={replyPage >= replyTotalPages}
              className="rounded-lg px-3 py-1.5 text-sm disabled:opacity-50"
              style={{ backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-text-secondary)" }}
            >
              Next
            </button>
          </div>
        )}

        {/* Reply input */}
        {!selectedThread.isLocked && (
          <div className="flex gap-2">
            <input
              type="text"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write a reply..."
              className="flex-1 rounded-lg px-3 py-2 text-sm"
              style={{ backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-text-primary)", border: "1px solid var(--cg-border)" }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleReply();
                }
              }}
            />
            <button
              onClick={handleReply}
              disabled={replySubmitting || !replyContent}
              className="rounded-lg px-3 py-2 disabled:opacity-50"
              style={{ backgroundColor: "var(--cg-accent)", color: "var(--cg-text-inverse)" }}
            >
              {replySubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        )}

        {selectedThread.isLocked && (
          <div className="flex items-center justify-center gap-2 py-3 text-sm" style={{ color: "var(--cg-text-muted)" }}>
            <Lock className="h-4 w-4" /> This thread is locked
          </div>
        )}
      </div>
    );
  }

  // Thread list view
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold" style={{ color: "var(--cg-text-primary)" }}>
          Discussions
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium"
          style={{ backgroundColor: "var(--cg-accent)", color: "var(--cg-text-inverse)" }}
        >
          {showForm ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
          {showForm ? "Cancel" : "New Thread"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg p-3 text-sm" style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "var(--cg-status-error, #ef4444)" }}>
          {error}
        </div>
      )}

      {/* Category tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => {
              setCategory(c.key);
              setPage(1);
            }}
            className="flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-all"
            style={{
              backgroundColor: category === c.key ? "var(--cg-accent-bg)" : "var(--cg-bg-tertiary)",
              color: category === c.key ? "var(--cg-accent)" : "var(--cg-text-muted)",
              border: `1px solid ${category === c.key ? "var(--cg-accent)" : "transparent"}`,
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Create form */}
      {showForm && (
        <div
          className="rounded-xl p-4 space-y-3"
          style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
        >
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Thread title"
            className="w-full rounded-lg px-3 py-2 text-sm"
            style={{ backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-text-primary)", border: "1px solid var(--cg-border)" }}
          />
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full rounded-lg px-3 py-2 text-sm"
            style={{ backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-text-primary)", border: "1px solid var(--cg-border)" }}
          >
            {CATEGORIES.filter((c) => c.key).map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
          <textarea
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="What's on your mind?"
            rows={3}
            className="w-full rounded-lg px-3 py-2 text-sm resize-none"
            style={{ backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-text-primary)", border: "1px solid var(--cg-border)" }}
          />
          <button
            onClick={handleCreate}
            disabled={submitting || !form.title || !form.content}
            className="w-full rounded-lg py-2 text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: "var(--cg-accent)", color: "var(--cg-text-inverse)" }}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Create Thread"}
          </button>
        </div>
      )}

      {/* Thread list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--cg-accent)" }} />
        </div>
      ) : threads.length === 0 ? (
        <div
          className="rounded-xl p-8 text-center"
          style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
        >
          <MessageSquare className="mx-auto h-10 w-10 mb-2" style={{ color: "var(--cg-text-muted)" }} />
          <p className="text-sm" style={{ color: "var(--cg-text-muted)" }}>
            No discussions yet. Start one!
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {threads.map((thread) => (
            <div
              key={thread.id}
              className="rounded-xl p-3 cursor-pointer hover:opacity-90 transition-all"
              style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
              onClick={() => openThread(thread)}
            >
              <div className="flex items-start gap-3">
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden mt-0.5"
                  style={{ backgroundColor: "var(--cg-bg-tertiary)" }}
                >
                  {thread.author.image ? (
                    <img src={thread.author.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs font-medium" style={{ color: "var(--cg-text-muted)" }}>
                      {thread.author.name?.[0]}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {thread.isPinned && (
                      <Pin className="h-3 w-3 flex-shrink-0" style={{ color: "var(--cg-accent)" }} />
                    )}
                    {thread.isLocked && (
                      <Lock className="h-3 w-3 flex-shrink-0" style={{ color: "var(--cg-status-warning, #f59e0b)" }} />
                    )}
                    <h4 className="text-sm font-semibold truncate" style={{ color: "var(--cg-text-primary)" }}>
                      {thread.title}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className="text-xs rounded-full px-1.5 py-0.5"
                      style={{ backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-text-muted)" }}
                    >
                      {thread.category.replace("_", " ")}
                    </span>
                    <span className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
                      {thread.author.name}
                    </span>
                    <span className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
                      · {thread._count?.replies ?? thread.replyCount} replies
                    </span>
                    {thread.lastReplyAt && (
                      <span className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
                        · {timeAgo(thread.lastReplyAt)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Admin actions */}
                {isAdmin && (
                  <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleTogglePin(thread.id, thread.isPinned)}
                      className="rounded p-1"
                      style={{ color: thread.isPinned ? "var(--cg-accent)" : "var(--cg-text-muted)" }}
                      title={thread.isPinned ? "Unpin" : "Pin"}
                    >
                      <Pin className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleToggleLock(thread.id, thread.isLocked)}
                      className="rounded p-1"
                      style={{ color: thread.isLocked ? "var(--cg-status-warning, #f59e0b)" : "var(--cg-text-muted)" }}
                      title={thread.isLocked ? "Unlock" : "Lock"}
                    >
                      <Lock className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="rounded-lg px-3 py-1.5 text-sm disabled:opacity-50"
            style={{ backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-text-secondary)" }}
          >
            Previous
          </button>
          <span className="flex items-center text-sm" style={{ color: "var(--cg-text-muted)" }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="rounded-lg px-3 py-1.5 text-sm disabled:opacity-50"
            style={{ backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-text-secondary)" }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
