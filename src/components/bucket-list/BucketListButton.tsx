"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { useBucketList } from "@/contexts/BucketListContext";
import { showToast } from "@/components/ui/Toast";

interface BucketListButtonProps {
  courseId: number;
  courseName?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function BucketListButton({
  courseId,
  courseName,
  size = "md",
  showLabel = false,
  className = "",
}: BucketListButtonProps) {
  const { isOnBucketList, toggleBucketList } = useBucketList();
  const isActive = isOnBucketList(courseId);
  const [animating, setAnimating] = useState(false);

  const sizeMap = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-6 w-6" };
  const paddingMap = { sm: "p-1.5", md: "p-2", lg: "p-2.5" };

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAnimating(true);
    await toggleBucketList(courseId);
    const name = courseName ? ` "${courseName}"` : "";
    if (!isActive) {
      showToast(`Added${name} to Bucket List`);
    } else {
      showToast(`Removed${name} from Bucket List`, "info");
    }
    setTimeout(() => setAnimating(false), 600);
  };

  return (
    <button
      onClick={handleClick}
      className={`group/heart rounded-full transition-all duration-200 ${paddingMap[size]} ${className}`}
      style={{
        backgroundColor: isActive ? "rgba(0, 230, 118, 0.15)" : "rgba(0, 0, 0, 0.4)",
        backdropFilter: "blur(8px)",
      }}
      title={isActive ? "Remove from Bucket List" : "Add to Bucket List"}
    >
      <Heart
        className={`${sizeMap[size]} transition-all duration-300 ${
          animating ? "scale-125" : "scale-100"
        }`}
        style={{
          color: isActive ? "var(--cg-accent)" : "white",
          fill: isActive ? "var(--cg-accent)" : "transparent",
          filter: animating && !isActive ? "none" : animating ? "drop-shadow(0 0 6px var(--cg-accent))" : "none",
        }}
      />
      {showLabel && (
        <span
          className="ml-1.5 text-sm font-medium"
          style={{ color: isActive ? "var(--cg-accent)" : "var(--cg-text-secondary)" }}
        >
          {isActive ? "On Bucket List" : "Bucket List"}
        </span>
      )}
    </button>
  );
}
