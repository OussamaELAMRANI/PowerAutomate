"use client";

import React, { useCallback, useState } from "react";
import { useDropzone, Accept } from "react-dropzone";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Upload, X, Image as ImageIcon, FileIcon } from "lucide-react";

export interface FileDropzoneProps {
  accept?: Accept;
  maxSize?: number;
  onFileSelect: (file: File | null) => void;
  value?: File | null;
  hasError?: boolean;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  description?: string;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  accept = { "image/*": [".png", ".jpg", ".jpeg", ".gif", ".svg"] },
  maxSize,
  onFileSelect,
  value,
  hasError,
  disabled,
  className,
  placeholder = "Drop your file here, or click to browse",
  description = "PNG, JPG, GIF, or SVG",
}) => {
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        onFileSelect(file);

        // Create preview for images
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setPreview(reader.result as string);
          };
          reader.readAsDataURL(file);
        }
      }
    },
    [onFileSelect]
  );

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelect(null);
    setPreview(null);
  };

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept,
      maxSize,
      disabled,
      multiple: false,
    });

  const isImage = value?.type.startsWith("image/");

  return (
    <div
      {...getRootProps()}
      className={cn(
        "group relative cursor-pointer rounded-xl border-2 border-dashed p-6 transition-all duration-200",
        isDragActive && "border-blue-400 bg-blue-50",
        isDragReject && "border-red-400 bg-red-50",
        hasError && "border-red-300 bg-red-50",
        !isDragActive &&
          !isDragReject &&
          !hasError &&
          "border-gray-200 bg-gray-50/50 hover:border-blue-400 hover:bg-blue-50/50",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      <input {...getInputProps()} />

      {value ? (
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Preview */}
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-white sm:h-16 sm:w-16">
            {isImage && preview ? (
              <Image
                src={preview}
                alt="Preview"
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <FileIcon className="h-8 w-8 text-gray-400" />
              </div>
            )}
          </div>

          {/* File info */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">
              {value.name}
            </p>
            <p className="text-xs text-gray-500">
              {(value.size / 1024).toFixed(1)} KB
            </p>
          </div>

          {/* Remove button */}
          <button
            type="button"
            onClick={removeFile}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600 transition-colors hover:bg-red-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 transition-colors group-hover:bg-blue-200">
            {isDragActive ? (
              <Upload className="h-6 w-6" />
            ) : (
              <ImageIcon className="h-6 w-6" />
            )}
          </div>
          <p className="text-sm font-medium text-gray-700">
            {isDragActive ? "Drop the file here..." : placeholder}
          </p>
          <p className="mt-1 text-xs text-gray-500">{description}</p>
        </div>
      )}
    </div>
  );
};

FileDropzone.displayName = "FileDropzone";
