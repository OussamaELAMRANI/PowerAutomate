"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, hasError, leftIcon, rightIcon, ...props }, ref) => {
    return (
      <div className="relative">
        {leftIcon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <span className="text-gray-400">{leftIcon}</span>
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            "block w-full rounded-xl border bg-white px-4 py-3 text-gray-900 shadow-sm transition-all duration-200",
            "placeholder:text-gray-400",
            "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20",
            "disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500",
            hasError
              ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
              : "border-gray-200 hover:border-gray-300",
            leftIcon && "pl-10",
            rightIcon && "pr-10",
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <span className="text-gray-400">{rightIcon}</span>
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
