"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, X } from "lucide-react";

export interface ToastProps {
  message: string;
  type?: "success" | "error";
  duration?: number;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = "success",
  duration = 4000,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setIsVisible(true));

    const timer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(onClose, 300);
  };

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-[100] flex items-center gap-3 rounded-xl border px-5 py-4 shadow-2xl transition-all duration-300",
        isVisible && !isLeaving
          ? "translate-x-0 opacity-100"
          : "translate-x-full opacity-0",
        type === "success"
          ? "border-green-200 bg-white text-green-800"
          : "border-red-200 bg-white text-red-800"
      )}
    >
      {type === "success" ? (
        <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
      ) : (
        <XCircle className="h-5 w-5 shrink-0 text-red-500" />
      )}
      <div>
        <p className="text-sm font-semibold">
          {type === "success" ? "Success!" : "Error!"}
        </p>
        <p className="text-xs text-gray-600">{message}</p>
      </div>
      <button
        onClick={handleClose}
        className="ml-2 rounded-lg p-1 hover:bg-gray-100 transition-colors cursor-pointer"
      >
        <X className="h-4 w-4 text-gray-400" />
      </button>
    </div>
  );
};

Toast.displayName = "Toast";
