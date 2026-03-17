"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  visible: boolean;
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type = "success", visible, onClose, duration = 3000 }: ToastProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(onClose, 300);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onClose]);

  if (!visible && !show) return null;

  const bgColor = type === "success"
    ? "var(--cg-accent)"
    : type === "error"
    ? "var(--cg-error, #ef4444)"
    : "var(--cg-bg-card)";

  return (
    <div
      className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 rounded-lg px-4 py-3 shadow-xl transition-all duration-300"
      style={{
        backgroundColor: bgColor,
        color: "var(--cg-text-inverse)",
        transform: show ? "translateY(0)" : "translateY(120%)",
        opacity: show ? 1 : 0,
      }}
    >
      <span className="text-sm font-medium">{message}</span>
      <button onClick={() => { setShow(false); setTimeout(onClose, 300); }} className="opacity-70 hover:opacity-100">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

let toastCallback: ((msg: string, type?: "success" | "error" | "info") => void) | null = null;

export function setToastHandler(fn: (msg: string, type?: "success" | "error" | "info") => void) {
  toastCallback = fn;
}

export function showToast(msg: string, type?: "success" | "error" | "info") {
  toastCallback?.(msg, type);
}
