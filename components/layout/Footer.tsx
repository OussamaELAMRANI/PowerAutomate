import React from "react";
import { cn } from "@/lib/utils";

interface FooterProps {
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({ className }) => {
  return (
    <footer className={cn("border-t border-gray-200 bg-white py-8", className)}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} PowerAutomate. All rights reserved.
          </p>
          <p className="text-sm text-gray-400"></p>
        </div>
      </div>
    </footer>
  );
};

Footer.displayName = "Footer";
