"use client";

import { useState, useCallback, useEffect } from "react";
import { Toast, setToastHandler } from "./Toast";

export function ToastProvider() {
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info"; visible: boolean }>({
    message: "",
    type: "success",
    visible: false,
  });

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type, visible: true });
  }, []);

  useEffect(() => {
    setToastHandler(showToast);
    return () => setToastHandler(() => {});
  }, [showToast]);

  return (
    <Toast
      message={toast.message}
      type={toast.type}
      visible={toast.visible}
      onClose={() => setToast((prev) => ({ ...prev, visible: false }))}
    />
  );
}
