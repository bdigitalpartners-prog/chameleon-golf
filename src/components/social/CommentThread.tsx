"use client";

import { useState, useEffect } from "react";
import { Loader2, MessageCircle, Reply, Trash2 } from "lucide-react";
import { MentionInput } from "./MentionInput";
import Link from "next/link";

interface Author {
  id: string;
  name: string;
  image: string | null;
}

interface CommentData {
  id: string;
  content: string;
  author: Author;
  createdAt: string;
  parentId: string | null;
  replies?: CommentData[];
}

interface CommentThreadProps {
  postId: string;
  commentCount: number;
  currentUserId?: string;
}

function renderContentWithMentions(content: string) {
  const parts = content.split(/(@\[([^\]]+)\]\(([^)]+)\))/);
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < parts.length) {
    if (i + 3 < parts.length && parts[i + 1]?.startsWith("@[")) {
      elements.push(parts[i]); // text before
      elements.push(
        <Link
          key={i}
          href={`/profile/${parts[i + 3]}`}
          className="font-medium"
          style={{ color: "var(--cg-accent)" }}
        >
          @{parts[i + 2]}
        </Link>
      );
      i += 4;
    } else {
      elements.push(parts[i]);
      i++;
    }
  }
  return elements;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString();
}

function SingleComment({
  comment,
  postId,
  currentUserId,
  onReply,
  onDeleted,
  isReply = false,
}: {
  comment: CommentData;
  postId: string;
  currentUserId?: string;
  onReply: (parentId: string) => void;
  onDeleted: () => void;
  isReply?: boolean;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments/${comment.id}`, { method: "DELETE" });
      if (res.ok) onDeleted();
    } catch {
      // ignore
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={`flex gap-2 ${isReply ? "ml-8" : ""}`}>
      <Link href={`/profile/${comment.author.id}`}>
        <div
          className="h-7 w-7 rounded-full flex-shrink-0 overflow-hidden"
          style={{ backgroundColor: "var(--cg-bg-tertiary)" }}
        >
          {comment.author.image ? (
            <img src={comment.author.image} alt="" className="h-full w-full object-cover" />
          ) : (
            <div
              className="h-full w-full flex items-center justify-center text-xs"
              style={{ color: "var(--cg-text-muted)" }}
            >
              {comment.author.name?.[0] ?? "?"}
            </div>
          )}
        </div>
      </Link>
      <div className="flex-1 min-w-0">
        <div
          className="rounded-lg px-3 py-2"
          style={{ backgroundColor: "var(--cg-bg-secondary)" }}
        >
          <div className="flex items-center gap-2">
            <Link
              href={`/profile/${comment.author.id}`}
              className="text-xs font-semibold"
              style={{ color: "var(--cg-text-primary)" }}
            >
              {comment.author.name}
            </Link>
            <span className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
              {timeAgo(comment.createdAt)}
            </span>
          </div>
          <p className="text-sm mt-0.5" style={{ color: "var(--cg-text-secondary)" }}>
            {renderContentWithMentions(comment.content)}
          </p>
        </div>
        <div className="flex items-center gap-3 mt-1 ml-2">
          {!isReply && (
            <button
              onClick={() => onReply(comment.id)}
              className="flex items-center gap-1 text-xs transition-colors"
              style={{ color: "var(--cg-text-muted)" }}
            >
              <Reply className="h-3 w-3" /> Reply
            </button>
          )}
          {currentUserId === comment.author.id && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1 text-xs transition-colors"
              style={{ color: "var(--cg-text-muted)" }}
            >
              <Trash2 className="h-3 w-3" /> Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function CommentThread({ postId, commentCount, currentUserId }: CommentThreadProps) {
  const [expanded, setExpanded] = useState(false);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [localCount, setLocalCount] = useState(commentCount);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`);
      const data = await res.json();
      setComments(data.comments ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (expanded) fetchComments();
  }, [expanded, postId]);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim(), parentId: replyTo }),
      });
      if (res.ok) {
        setNewComment("");
        setReplyTo(null);
        setLocalCount((c) => c + 1);
        fetchComments();
      }
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all"
        style={{ color: "var(--cg-text-muted)" }}
      >
        <MessageCircle className="h-4 w-4" />
        {localCount > 0 && <span>{localCount}</span>}
      </button>

      {expanded && (
        <div
          className="mt-3 space-y-3 rounded-xl p-3"
          style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border-subtle)" }}
        >
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--cg-accent)" }} />
            </div>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id}>
                  <SingleComment
                    comment={comment}
                    postId={postId}
                    currentUserId={currentUserId}
                    onReply={(parentId) => setReplyTo(parentId)}
                    onDeleted={() => {
                      setLocalCount((c) => Math.max(0, c - 1));
                      fetchComments();
                    }}
                  />
                  {/* Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {comment.replies.map((reply) => (
                        <SingleComment
                          key={reply.id}
                          comment={reply}
                          postId={postId}
                          currentUserId={currentUserId}
                          onReply={() => setReplyTo(comment.id)}
                          onDeleted={() => {
                            setLocalCount((c) => Math.max(0, c - 1));
                            fetchComments();
                          }}
                          isReply
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {comments.length === 0 && (
                <p className="text-center text-xs py-2" style={{ color: "var(--cg-text-muted)" }}>
                  No comments yet. Be the first!
                </p>
              )}
            </div>
          )}

          {/* Comment input */}
          <div className="space-y-2">
            {replyTo && (
              <div className="flex items-center gap-2 text-xs" style={{ color: "var(--cg-text-muted)" }}>
                <Reply className="h-3 w-3" />
                Replying to comment
                <button onClick={() => setReplyTo(null)} className="underline">
                  Cancel
                </button>
              </div>
            )}
            <div className="flex gap-2">
              <div className="flex-1">
                <MentionInput
                  value={newComment}
                  onChange={setNewComment}
                  placeholder={replyTo ? "Write a reply..." : "Write a comment..."}
                  rows={1}
                />
              </div>
              <button
                onClick={handleSubmit}
                disabled={!newComment.trim() || submitting}
                className="self-end rounded-lg px-3 py-2 text-sm font-medium transition-all disabled:opacity-40"
                style={{ backgroundColor: "var(--cg-accent)", color: "var(--cg-text-inverse)" }}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
