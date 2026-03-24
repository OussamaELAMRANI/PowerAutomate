"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

export interface FormFieldProps {
  label: string;
  name: string;
  id?: string;
  error?: string;
  required?: boolean;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  id,
  error,
  required,
  description,
  children,
  className,
}) => {
  return (
    <div className={cn("space-y-2", className)}>
      <label
        htmlFor={id}
        className="flex items-center gap-1 text-sm font-medium text-gray-700"
      >
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {description && <p className="text-xs text-gray-500">{description}</p>}
      {children}
      {error && (
        <div className="flex items-center gap-1.5 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

FormField.displayName = "FormField";
