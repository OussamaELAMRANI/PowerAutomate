import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { FileText, Users, Upload } from "lucide-react";

interface NavbarProps {
  className?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ className }) => {
  return (
    <nav
      className={cn(
        "fixed top-0 inset-x-0 z-50 border-b border-gray-200/50 bg-white/80 backdrop-blur-xl w-full",
        className
      )}
      style={{ width: "100vw" }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between sm:h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group sm:gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 transition-transform group-hover:scale-105 sm:h-10 sm:w-10 sm:rounded-xl">
              <h1 className="font-bold">CE</h1>
            </div>
            <span className="text-base font-bold bg-linear-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent sm:text-xl">
              CE Tools
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="hidden text-sm font-medium text-gray-600 transition-colors hover:text-blue-600 lg:block"
            >
              Dashboard
            </Link>
            <Link
              href="/model-creator"
              className="flex items-center gap-1.5 rounded-lg bg-linear-to-r from-blue-600 to-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40 hover:scale-105 sm:gap-2 sm:rounded-xl sm:px-4 sm:py-2 sm:text-sm"
            >
              <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Document Generator</span>
              <span className="sm:hidden">Docs</span>
            </Link>
            <Link
              href="/employee-automation"
              className="flex items-center gap-1.5 rounded-lg bg-linear-to-r from-orange-500 to-orange-600 px-3 py-1.5 text-xs font-medium text-white shadow-lg shadow-orange-500/25 transition-all hover:shadow-orange-500/40 hover:scale-105 sm:gap-2 sm:rounded-xl sm:px-4 sm:py-2 sm:text-sm"
            >
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Employee Generator</span>
              <span className="sm:hidden">Emp</span>
            </Link>
            <Link
              href="/uploads"
              className="flex items-center gap-1.5 rounded-lg bg-linear-to-r from-violet-500 to-purple-600 px-3 py-1.5 text-xs font-medium text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40 hover:scale-105 sm:gap-2 sm:rounded-xl sm:px-4 sm:py-2 sm:text-sm"
            >
              <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Upload Manager</span>
              <span className="sm:hidden">Upload</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

Navbar.displayName = "Navbar";
