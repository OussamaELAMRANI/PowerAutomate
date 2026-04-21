"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Input, DatePicker, FileDropzone } from "@/components/ui";
import {
  ChevronLeft,
  ChevronRight,
  Building2,
  Mail,
  MapPin,
  Settings2,
  User,
  Hash,
} from "lucide-react";
import type { GlobalProperties } from "@/lib/types/employee";

export interface GlobalSidebarProps {
  value: GlobalProperties;
  onChange: (value: GlobalProperties) => void;
  logoFile?: File | null;
  onLogoChange?: (file: File | null) => void;
}

export const GlobalSidebar: React.FC<GlobalSidebarProps> = ({
  value,
  onChange,
  logoFile,
  onLogoChange,
}) => {
  const [isOpen, setIsOpen] = useState(true);

  const handleChange = (field: keyof GlobalProperties, val: string) => {
    onChange({ ...value, [field]: val });
  };

  return (
    <div className="relative flex">
      <div
        className={cn(
          "transition-all duration-300 ease-in-out z-10",
          isOpen ? "w-80 opacity-100" : "w-0 opacity-0"
        )}
      >
        <div className="w-80 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pb-6 scrollbar-hide">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-200/50">
            <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-purple-500/30">
                <Settings2 className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  Global Properties
                </h3>
                <p className="text-xs text-gray-400">Applied to all employees</p>
              </div>
            </div>

            <div className="space-y-4 p-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Company Name
                </label>
                <Input
                  value={value.companyName}
                  onChange={(e) => handleChange("companyName", e.target.value)}
                  placeholder="Acme Corp"
                  leftIcon={<Building2 className="h-4 w-4" />}
                  className="!py-2.5 !text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Company Email
                </label>
                <Input
                  value={value.companyEmail}
                  onChange={(e) => handleChange("companyEmail", e.target.value)}
                  placeholder="info@company.com"
                  leftIcon={<Mail className="h-4 w-4" />}
                  className="!py-2.5 !text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Company Address
                </label>
                <Input
                  value={value.companyAddress}
                  onChange={(e) => handleChange("companyAddress", e.target.value)}
                  placeholder="123 Main St, City"
                  leftIcon={<MapPin className="h-4 w-4" />}
                  className="!py-2.5 !text-sm"
                />
              </div>

              <div className="pt-2 border-t border-gray-100">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 block mb-2">
                  Company Logo
                </label>
                <div className="text-xs text-gray-400 mb-2">Optional — replaces {`{Logo}`} placeholder</div>
                <FileDropzone
                  value={logoFile}
                  onFileSelect={(file) => onLogoChange?.(file)}
                  className="!p-4"
                  placeholder="Drop logo here"
                />
              </div>

              <div className="pt-2 border-t border-gray-100">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Footer Metadata</h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5 ">
                      <label className="text-xs font-medium text-gray-600 block">Doc Version</label>
                      <Input
                        value={value.documentVersion || ""}
                        onChange={(e) => handleChange("documentVersion", e.target.value)}
                        placeholder="v1.0"
                        leftIcon={<Hash className="h-4 w-4" />}
                        className="!py-6 !text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-600 block">Doc Date</label>
                      <DatePicker
                        value={value.documentDate || ""}
                        onChange={(val) => handleChange("documentDate", val)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-600 block">Created By</label>
                    <Input
                      value={value.createdBy || ""}
                      onChange={(e) => handleChange("createdBy", e.target.value)}
                      placeholder="Author name"
                      leftIcon={<User className="h-4 w-4" />}
                      className="!py-2.5 !text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-600 block">Approved By</label>
                    <Input
                      value={value.approvedBy || ""}
                      onChange={(e) => handleChange("approvedBy", e.target.value)}
                      placeholder="Approver name"
                      leftIcon={<User className="h-4 w-4" />}
                      className="!py-2.5 !text-sm"
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "absolute top-6 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white shadow-md transition-all hover:bg-gray-50 hover:shadow-lg cursor-pointer",
          isOpen ? "-right-4" : "-right-4"
        )}
        style={{ left: isOpen ? undefined : "-16px" }}
        title={isOpen ? "Hide sidebar" : "Show sidebar"}
      >
        {isOpen ? (
          <ChevronLeft className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-500" />
        )}
      </button>
    </div>
  );
};

GlobalSidebar.displayName = "GlobalSidebar";
