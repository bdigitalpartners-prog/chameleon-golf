"use client";

import { useState } from "react";

interface FistBumpButtonProps {
  postId: string;
  initialCount: number;
  initialBumped: boolean;
  recentBumpers?: { id: string; name: string; image: string | null }[];
}

export function FistBumpButton({
  postId,
  initialCount,
  initialBumped,
  recentBumpers = [],
}: FistBumpButtonProps) {
  const [bumped, setBumped] = useState(initialBumped);
  const [count, setCount] = useState(initialCount);
  const [animating, setAnimating] = useState(false);

  const toggle = async () => {
    // Optimistic update
    const wasBumped = bumped;
    setBumped(!wasBumped);
    setCount((c) => (wasBumped ? Math.max(0, c - 1) : c + 1));

    setAnimating(true);
    setTimeout(() => setAnimating(false), 300);

    try {
      const res = await fetch(`/api/posts/${postId}/fistbump`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setBumped(data.fistBumped);
        setCount(data.count);
      } else {
        // Revert on error
        setBumped(wasBumped);
        setCount((c) => (wasBumped ? c + 1 : Math.max(0, c - 1)));
      }
    } catch {
      setBumped(wasBumped);
      setCount((c) => (wasBumped ? c + 1 : Math.max(0, c - 1)));
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggle}
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all"
        style={{
          backgroundColor: bumped ? "var(--cg-accent-bg)" : "transparent",
          color: bumped ? "var(--cg-accent)" : "var(--cg-text-muted)",
          transform: animating ? "scale(1.15)" : "scale(1)",
        }}
      >
        <span
          className="text-base"
          style={{
            transition: "transform 0.3s ease",
            display: "inline-block",
            transform: animating ? "scale(1.3)" : "scale(1)",
          }}
        >
          👊
        </span>
        {count > 0 && <span>{count}</span>}
      </button>

      {/* Avatar strip of recent bumpers */}
      {recentBumpers.length > 0 && (
        <div className="flex -space-x-1.5">
          {recentBumpers.slice(0, 3).map((u) => (
            <div
              key={u.id}
              className="h-5 w-5 rounded-full border overflow-hidden flex-shrink-0"
              style={{ borderColor: "var(--cg-bg-card)", backgroundColor: "var(--cg-bg-tertiary)" }}
              title={u.name}
            >
              {u.image ? (
                <img src={u.image} alt="" className="h-full w-full object-cover" />
              ) : (
                <div
                  className="h-full w-full flex items-center justify-center text-[8px]"
                  style={{ color: "var(--cg-text-muted)" }}
                >
                  {u.name?.[0]}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
