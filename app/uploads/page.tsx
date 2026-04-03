"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { Navbar, Footer } from "@/components/layout";
import { Button, Card, CardContent, Input, Badge } from "@/components/ui";
import { Toast } from "@/components/ui/Toast";
import CEBadge from "@/components/ui/CEBadge";
import { cn } from "@/lib/utils";
import {
  validateFileName,
  validateFolderName,
  validateFileSize,
  validateDocxMagic,
} from "@/lib/sanitize";
import {
  Upload,
  Plus,
  Trash2,
  FileText,
  FolderOpen,
  X,
  Shield,
  Briefcase,
  Calendar,
  Loader2,
  Search,
  Layers,
} from "lucide-react";

interface TemplateFolder {
  id: string;
  name: string;
  documents: { id: string; name: string; fileName: string }[];
}

type Category = "roles" | "appointments" | "standard-models";

interface TemplatesData {
  roles: TemplateFolder[];
  appointments: TemplateFolder[];
}

interface PendingFolder {
  key: string;
  category: Category;
  name: string;
}

// ─────────────────────────────────────────────────────────
// Skeleton atoms
// ─────────────────────────────────────────────────────────

function SkeletonLine({
  width = "full",
  height = 3,
  className,
}: {
  width?: string | number;
  height?: number;
  className?: string;
}) {
  const w = typeof width === "number" ? `${width}%` : width === "full" ? "100%" : width;
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-gray-200",
        className
      )}
      style={{ height: `${height * 4}px`, width: w }}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent" />
    </div>
  );
}

function SkeletonCircle({ size = 4 }: { size?: number }) {
  return (
    <div
      className="relative overflow-hidden shrink-0 rounded-full bg-gray-200"
      style={{ width: `${size * 4}px`, height: `${size * 4}px` }}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Skeleton file row (shown while uploading)
// ─────────────────────────────────────────────────────────

function SkeletonFileItem({ index }: { index: number }) {
  const widths = [62, 78, 54, 70, 66];
  const w = widths[index % widths.length];
  return (
    <div
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 animate-fade-in-up"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="relative overflow-hidden h-4 w-4 rounded bg-gray-200 shrink-0">
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent" />
      </div>
      <SkeletonLine width={w} height={3} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Skeleton folder card (shown while creating a folder)
// ─────────────────────────────────────────────────────────

const cardColorMap = {
  blue: {
    border: "border-blue-200",
    bg: "bg-blue-50/40",
    icon: "text-blue-400",
    badge: "bg-blue-100 text-blue-600",
    spinner: "text-blue-500",
    ring: "ring-2 ring-blue-200",
  },
  emerald: {
    border: "border-emerald-200",
    bg: "bg-emerald-50/40",
    icon: "text-emerald-400",
    badge: "bg-emerald-100 text-emerald-600",
    spinner: "text-emerald-500",
    ring: "ring-2 ring-emerald-200",
  },
  violet: {
    border: "border-violet-200",
    bg: "bg-violet-50/40",
    icon: "text-violet-400",
    badge: "bg-violet-100 text-violet-600",
    spinner: "text-violet-500",
    ring: "ring-2 ring-violet-200",
  },
};

function SkeletonFolderCard({
  accentColor,
  name,
}: {
  accentColor: "blue" | "emerald" | "violet";
  name: string;
}) {
  const c = cardColorMap[accentColor];
  return (
    <div
      className={cn(
        "relative rounded-2xl border-2 border-dashed bg-white shadow-lg shadow-gray-200/50 overflow-hidden animate-fade-in-up",
        c.border,
        c.ring
      )}
    >
      {/* Shimmer sweep across the entire card */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      </div>

      {/* Header – mirrors real TemplateIsland header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn("relative overflow-hidden h-5 w-5 rounded shrink-0 bg-gray-200")}>
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent" />
          </div>
          <div className="h-4 rounded-md bg-gray-200 animate-pulse" style={{ width: Math.min(name.length * 8 + 16, 180) }} />
          <div className="relative overflow-hidden h-5 w-6 rounded-full bg-gray-200 shrink-0">
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent" />
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <div className="h-7 w-7 rounded-lg bg-gray-100 animate-pulse" />
          <div className="h-7 w-7 rounded-lg bg-gray-100 animate-pulse" />
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col items-center justify-center gap-3 py-8 px-4">
        <div className={cn("relative flex items-center justify-center h-10 w-10 rounded-xl bg-gray-100")}>
          <Loader2 className={cn("h-5 w-5 animate-spin", c.spinner)} />
        </div>
        <div className="text-center">
          <p className="text-xs font-semibold text-gray-700">
            Creating folder
          </p>
          <p className={cn("mt-0.5 text-xs font-medium truncate max-w-[160px]", c.icon)}>
            "{name}"
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────

export default function UploadsPage() {
  const [templates, setTemplates] = useState<TemplatesData>({
    roles: [],
    appointments: [],
  });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const [standardModels, setStandardModels] = useState<TemplateFolder[]>([]);
  const [newRoleName, setNewRoleName] = useState("");
  const [newAppointmentName, setNewAppointmentName] = useState("");
  const [newModelName, setNewModelName] = useState("");
  const [showNewRole, setShowNewRole] = useState(false);
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [showNewModel, setShowNewModel] = useState(false);

  // uploadingFiles: key (`category-folderId`) → number of files being uploaded
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, number>>({});
  const [deleting, setDeleting] = useState<string | null>(null);

  // Optimistic pending folder cards
  const [pendingFolders, setPendingFolders] = useState<PendingFolder[]>([]);

  // Search state
  const [roleSearch, setRoleSearch] = useState("");
  const [appointmentSearch, setAppointmentSearch] = useState("");
  const [modelSearch, setModelSearch] = useState("");

  const fetchTemplates = useCallback(async () => {
    try {
      const [templatesRes, modelsRes] = await Promise.all([
        fetch("/api/templates"),
        fetch("/api/standard-models"),
      ]);
      const templatesData = await templatesRes.json();
      const modelsData = await modelsRes.json();
      setTemplates({
        roles: templatesData.roles || [],
        appointments: templatesData.appointments || [],
      });
      setStandardModels(modelsData.folders || []);
    } catch {
      setToast({ message: "Failed to load templates", type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Filtered templates
  const filteredRoles = templates.roles.filter(
    (r) =>
      !roleSearch.trim() ||
      r.name.toLowerCase().includes(roleSearch.toLowerCase())
  );
  const filteredAppointments = templates.appointments.filter(
    (a) =>
      !appointmentSearch.trim() ||
      a.name.toLowerCase().includes(appointmentSearch.toLowerCase())
  );
  const filteredModels = standardModels.filter(
    (m) =>
      !modelSearch.trim() ||
      m.name.toLowerCase().includes(modelSearch.toLowerCase())
  );

  // Pending folders per category
  const pendingRoles = pendingFolders.filter((p) => p.category === "roles");
  const pendingAppointments = pendingFolders.filter(
    (p) => p.category === "appointments"
  );
  const pendingModels = pendingFolders.filter(
    (p) => p.category === "standard-models"
  );

  const removePendingFolder = (key: string) =>
    setPendingFolders((prev) => prev.filter((p) => p.key !== key));

  // Client-side validate then upload
  const handleFilesUpload = async (
    files: FileList | File[],
    category: Category,
    folderName: string
  ) => {
    const fileArray = Array.from(files);
    const errors: string[] = [];
    const validFiles: File[] = [];

    for (const file of fileArray) {
      if (!file.name.toLowerCase().endsWith(".docx")) {
        errors.push(`"${file.name}" — only .docx Word documents are allowed`);
        continue;
      }
      const validMimes = [
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/octet-stream",
		"application/wps-office.docx"
      ];
      if (file.type && !validMimes.includes(file.type)) {
        errors.push(`"${file.name}" — invalid file type (${file.type})`);
        continue;
      }
      const nameCheck = validateFileName(file.name);
      if (!nameCheck.valid) {
        errors.push(`"${file.name}" — ${nameCheck.error}`);
        continue;
      }
      const sizeCheck = validateFileSize(file.size);
      if (!sizeCheck.valid) {
        errors.push(`"${file.name}" — ${sizeCheck.error}`);
        continue;
      }
      const buffer = await file.arrayBuffer();
      const magicCheck = validateDocxMagic(buffer);
      if (!magicCheck.valid) {
        errors.push(`"${file.name}" — ${magicCheck.error}`);
        continue;
      }
      validFiles.push(file);
    }

    if (errors.length > 0 && validFiles.length === 0) {
      setToast({ message: errors.join(". "), type: "error" });
      return;
    }
    if (validFiles.length === 0) return;

    const uploadKey = `${category}-${folderName}`;

    // Optimistic: show skeleton file rows immediately
    setUploadingFiles((prev) => ({ ...prev, [uploadKey]: validFiles.length }));

    try {
      const formData = new FormData();
      formData.append("category", category);
      formData.append("folderName", folderName);
      validFiles.forEach((f) => formData.append("files", f));

      const res = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setToast({ message: data.error || "Upload failed", type: "error" });
      } else {
        const failedFiles = data.results?.filter((r: any) => r.status === "error");
        if (failedFiles?.length > 0) {
          setToast({
            message: failedFiles.map((f: any) => `${f.name}: ${f.error}`).join(". "),
            type: "error",
          });
        } else {
          const skippedMsg =
            errors.length > 0
              ? ` (${errors.length} file(s) skipped due to validation)`
              : "";
          setToast({
            message: `${data.message}${skippedMsg}`,
            type: "success",
          });
        }
        await fetchTemplates();
      }
    } catch {
      setToast({ message: "Upload failed unexpectedly", type: "error" });
    } finally {
      setUploadingFiles((prev) => {
        const next = { ...prev };
        delete next[uploadKey];
        return next;
      });
    }
  };

  const handleDeleteFile = async (
    category: Category,
    folderName: string,
    fileName: string
  ) => {
    const key = `${category}-${folderName}-${fileName}`;
    setDeleting(key);
    try {
      const res = await fetch("/api/uploads", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, folderName, fileName }),
      });
      if (res.ok) {
        setToast({ message: "File deleted", type: "success" });
        await fetchTemplates();
      } else {
        const data = await res.json();
        setToast({ message: data.error || "Delete failed", type: "error" });
      }
    } catch {
      setToast({ message: "Delete failed", type: "error" });
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteFolder = async (category: Category, folderName: string) => {
    if (
      !confirm(
        `Delete the entire "${folderName}" folder and all its documents?`
      )
    )
      return;

    setDeleting(`${category}-${folderName}`);
    try {
      const res = await fetch("/api/uploads", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, folderName }),
      });
      if (res.ok) {
        setToast({ message: "Folder deleted", type: "success" });
        await fetchTemplates();
      } else {
        const data = await res.json();
        setToast({ message: data.error || "Delete failed", type: "error" });
      }
    } catch {
      setToast({ message: "Delete failed", type: "error" });
    } finally {
      setDeleting(null);
    }
  };

  const handleCreateFolder = async (category: Category, name: string) => {
    const validation = validateFolderName(name);
    if (!validation.valid) {
      setToast({ message: validation.error || "Invalid name", type: "error" });
      return;
    }

    // Optimistic: hide the form and show skeleton card immediately
    const pendingKey = `${category}-${name}-${Date.now()}`;
    setPendingFolders((prev) => [
      ...prev,
      { key: pendingKey, category, name },
    ]);

    // Hide the input form right away
    if (category === "roles") {
      setNewRoleName("");
      setShowNewRole(false);
    } else if (category === "appointments") {
      setNewAppointmentName("");
      setShowNewAppointment(false);
    } else {
      setNewModelName("");
      setShowNewModel(false);
    }

    try {
      const res = await fetch("/api/uploads/folder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, folderName: name }),
      });
      if (res.ok) {
        setToast({ message: `Folder "${name}" created`, type: "success" });
        await fetchTemplates();
      } else {
        const data = await res.json();
        setToast({
          message: data.error || "Failed to create folder",
          type: "error",
        });
      }
    } catch {
      setToast({ message: "Failed to create folder", type: "error" });
    } finally {
      removePendingFolder(pendingKey);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-blue-50">
      <Navbar />
      <main className="pt-20 pb-8 px-4 sm:pt-24 sm:pb-12">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-2">
              <CEBadge />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl lg:text-4xl">
                  Template Manager
                </h1>
                <p className="mt-1 text-sm text-gray-600 sm:text-base">
                  Upload, organize, and manage document templates for roles and
                  appointments.
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
              <Shield className="h-5 w-5 text-emerald-600 shrink-0" />
              <p className="text-sm text-emerald-700">
                All uploads are validated — only{" "}
                <strong>.docx Word documents</strong> accepted, filenames
                sanitized against injection.
              </p>
            </div>
          </div>

          {loading ? (
            <LoadingGrid />
          ) : (
            <div className="space-y-10">
              {/* ===== ROLES ===== */}
              <section>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        Roles
                      </h2>
                      <p className="text-xs text-gray-500">
                        {templates.roles.length + pendingRoles.length} role
                        {templates.roles.length + pendingRoles.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-52">
                      <Input
                        value={roleSearch}
                        onChange={(e) => setRoleSearch(e.target.value)}
                        placeholder="Search roles..."
                        leftIcon={<Search className="h-4 w-4" />}
                        className="!py-2 !text-sm"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowNewRole(true)}
                      leftIcon={<Plus className="h-4 w-4" />}
                    >
                      New Role
                    </Button>
                  </div>
                </div>

                {showNewRole && (
                  <div className="mb-4 flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50/50 p-4">
                    <Input
                      value={newRoleName}
                      onChange={(e) => setNewRoleName(e.target.value)}
                      placeholder="e.g. Software Engineer"
                      className="!py-2.5"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newRoleName.trim())
                          handleCreateFolder("roles", newRoleName);
                      }}
                    />
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => handleCreateFolder("roles", newRoleName)}
                      disabled={!newRoleName.trim()}
                    >
                      Create
                    </Button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewRole(false);
                        setNewRoleName("");
                      }}
                      className="text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                )}

                <div className="max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
                  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredRoles.map((role) => (
                      <TemplateIsland
                        key={role.id}
                        folder={role}
                        category="roles"
                        accentColor="blue"
                        uploadingCount={uploadingFiles[`roles-${role.id}`] ?? 0}
                        deleting={deleting}
                        onUpload={(files) =>
                          handleFilesUpload(files, "roles", role.id)
                        }
                        onDeleteFile={(fileName) =>
                          handleDeleteFile("roles", role.id, fileName)
                        }
                        onDeleteFolder={() =>
                          handleDeleteFolder("roles", role.id)
                        }
                      />
                    ))}
                    {/* Optimistic skeleton cards for roles being created */}
                    {pendingRoles.map((p) => (
                      <SkeletonFolderCard
                        key={p.key}
                        accentColor="blue"
                        name={p.name}
                      />
                    ))}
                    {filteredRoles.length === 0 && pendingRoles.length === 0 && (
                      <div className="col-span-full rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
                        <Briefcase className="mx-auto h-10 w-10 text-gray-300" />
                        <p className="mt-3 text-sm text-gray-400">
                          {roleSearch
                            ? "No roles match your search."
                            : 'No roles yet. Click "New Role" to create one.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* ===== APPOINTMENTS ===== */}
              <section>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        Appointments / Overlays
                      </h2>
                      <p className="text-xs text-gray-500">
                        {templates.appointments.length + pendingAppointments.length} appointment
                        {templates.appointments.length + pendingAppointments.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-52">
                      <Input
                        value={appointmentSearch}
                        onChange={(e) => setAppointmentSearch(e.target.value)}
                        placeholder="Search appointments..."
                        leftIcon={<Search className="h-4 w-4" />}
                        className="!py-2 !text-sm"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowNewAppointment(true)}
                      leftIcon={<Plus className="h-4 w-4" />}
                    >
                      New Appointment
                    </Button>
                  </div>
                </div>

                {showNewAppointment && (
                  <div className="mb-4 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                    <Input
                      value={newAppointmentName}
                      onChange={(e) => setNewAppointmentName(e.target.value)}
                      placeholder="e.g. Safety Training"
                      className="!py-2.5"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newAppointmentName.trim())
                          handleCreateFolder("appointments", newAppointmentName);
                      }}
                    />
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() =>
                        handleCreateFolder("appointments", newAppointmentName)
                      }
                      disabled={!newAppointmentName.trim()}
                      className="!from-emerald-500 !to-teal-600"
                    >
                      Create
                    </Button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewAppointment(false);
                        setNewAppointmentName("");
                      }}
                      className="text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                )}

                <div className="max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
                  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredAppointments.map((appt) => (
                      <TemplateIsland
                        key={appt.id}
                        folder={appt}
                        category="appointments"
                        accentColor="emerald"
                        uploadingCount={uploadingFiles[`appointments-${appt.id}`] ?? 0}
                        deleting={deleting}
                        onUpload={(files) =>
                          handleFilesUpload(files, "appointments", appt.id)
                        }
                        onDeleteFile={(fileName) =>
                          handleDeleteFile("appointments", appt.id, fileName)
                        }
                        onDeleteFolder={() =>
                          handleDeleteFolder("appointments", appt.id)
                        }
                      />
                    ))}
                    {pendingAppointments.map((p) => (
                      <SkeletonFolderCard
                        key={p.key}
                        accentColor="emerald"
                        name={p.name}
                      />
                    ))}
                    {filteredAppointments.length === 0 && pendingAppointments.length === 0 && (
                      <div className="col-span-full rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
                        <Calendar className="mx-auto h-10 w-10 text-gray-300" />
                        <p className="mt-3 text-sm text-gray-400">
                          {appointmentSearch
                            ? "No appointments match your search."
                            : 'No appointments yet. Click "New Appointment" to create one.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* ===== STANDARD MODELS ===== */}
              <section>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30">
                      <Layers className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        Standard Models
                      </h2>
                      <p className="text-xs text-gray-500">
                        {standardModels.length + pendingModels.length} model
                        {standardModels.length + pendingModels.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-52">
                      <Input
                        value={modelSearch}
                        onChange={(e) => setModelSearch(e.target.value)}
                        placeholder="Search models..."
                        leftIcon={<Search className="h-4 w-4" />}
                        className="!py-2 !text-sm"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowNewModel(true)}
                      leftIcon={<Plus className="h-4 w-4" />}
                    >
                      New Model
                    </Button>
                  </div>
                </div>

                {showNewModel && (
                  <div className="mb-4 flex items-center gap-3 rounded-xl border border-violet-200 bg-violet-50/50 p-4">
                    <Input
                      value={newModelName}
                      onChange={(e) => setNewModelName(e.target.value)}
                      placeholder="e.g. Quality Management"
                      className="!py-2.5"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newModelName.trim())
                          handleCreateFolder("standard-models", newModelName);
                      }}
                    />
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() =>
                        handleCreateFolder("standard-models", newModelName)
                      }
                      disabled={!newModelName.trim()}
                      className="!from-violet-500 !to-purple-600"
                    >
                      Create
                    </Button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewModel(false);
                        setNewModelName("");
                      }}
                      className="text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                )}

                <div className="max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
                  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredModels.map((model) => (
                      <TemplateIsland
                        key={model.id}
                        folder={model}
                        category="standard-models"
                        accentColor="violet"
                        uploadingCount={uploadingFiles[`standard-models-${model.id}`] ?? 0}
                        deleting={deleting}
                        onUpload={(files) =>
                          handleFilesUpload(files, "standard-models", model.id)
                        }
                        onDeleteFile={(fileName) =>
                          handleDeleteFile("standard-models", model.id, fileName)
                        }
                        onDeleteFolder={() =>
                          handleDeleteFolder("standard-models", model.id)
                        }
                      />
                    ))}
                    {pendingModels.map((p) => (
                      <SkeletonFolderCard
                        key={p.key}
                        accentColor="violet"
                        name={p.name}
                      />
                    ))}
                    {filteredModels.length === 0 && pendingModels.length === 0 && (
                      <div className="col-span-full rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
                        <Layers className="mx-auto h-10 w-10 text-gray-300" />
                        <p className="mt-3 text-sm text-gray-400">
                          {modelSearch
                            ? "No models match your search."
                            : 'No standard models yet. Click "New Model" to create one.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      </main>
      <Footer />
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Initial page-load skeleton grid
// ─────────────────────────────────────────────────────────

function LoadingGrid() {
  return (
    <div className="space-y-10">
      {(["blue", "emerald", "violet"] as const).map((color, sectionIdx) => (
        <section key={color}>
          {/* Section header skeleton */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gray-200 animate-pulse" />
              <div className="space-y-1.5">
                <SkeletonLine width={120} height={4} />
                <SkeletonLine width={60} height={2.5} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-9 w-44 rounded-lg bg-gray-200 animate-pulse" />
              <div className="h-9 w-28 rounded-lg bg-gray-200 animate-pulse" />
            </div>
          </div>
          {/* Card grid skeleton */}
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <LoadingFolderCard
                key={i}
                accentColor={color}
                delay={sectionIdx * 120 + i * 80}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function LoadingFolderCard({
  accentColor,
  delay,
}: {
  accentColor: "blue" | "emerald" | "violet";
  delay: number;
}) {
  const borders = { blue: "border-blue-100", emerald: "border-emerald-100", violet: "border-violet-100" };
  return (
    <div
      className={cn(
        "rounded-2xl border-2 border-dashed bg-white shadow-lg shadow-gray-200/50 animate-fade-in-up overflow-hidden",
        borders[accentColor]
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 rounded bg-gray-200 animate-pulse shrink-0" />
          <SkeletonLine width={110} height={3.5} />
          <div className="h-5 w-6 rounded-full bg-gray-200 animate-pulse shrink-0" />
        </div>
        <div className="flex gap-1">
          <div className="h-7 w-7 rounded-lg bg-gray-100 animate-pulse" />
          <div className="h-7 w-7 rounded-lg bg-gray-100 animate-pulse" />
        </div>
      </div>
      {/* File rows */}
      <div className="divide-y divide-gray-50 px-2 py-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2.5">
            <div className="h-4 w-4 rounded bg-gray-200 animate-pulse shrink-0" />
            <SkeletonLine width={[65, 80, 50][i]} height={3} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Template Island — flicker-free drag & drop per folder
// ─────────────────────────────────────────────────────────

interface TemplateIslandProps {
  folder: TemplateFolder;
  category: Category;
  accentColor: "blue" | "emerald" | "violet";
  uploadingCount: number;
  deleting: string | null;
  onUpload: (files: FileList | File[]) => void;
  onDeleteFile: (fileName: string) => void;
  onDeleteFolder: () => void;
}

function TemplateIsland({
  folder,
  category,
  accentColor,
  uploadingCount,
  deleting,
  onUpload,
  onDeleteFile,
  onDeleteFolder,
}: TemplateIslandProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (dragCounterRef.current === 1) setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current === 0) setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setIsDragOver(false);
      const files = e.dataTransfer.files;
      if (files.length > 0) onUpload(files);
    },
    [onUpload]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files);
      e.target.value = "";
    }
  };

  const colorMap = {
    blue: {
      border: "border-blue-200",
      borderDrag: "border-blue-400 bg-blue-50/60",
      icon: "text-blue-500",
      badge: "bg-blue-100 text-blue-700",
      ring: "ring-blue-300",
    },
    emerald: {
      border: "border-emerald-200",
      borderDrag: "border-emerald-400 bg-emerald-50/60",
      icon: "text-emerald-500",
      badge: "bg-emerald-100 text-emerald-700",
      ring: "ring-emerald-300",
    },
    violet: {
      border: "border-violet-200",
      borderDrag: "border-violet-400 bg-violet-50/60",
      icon: "text-violet-500",
      badge: "bg-violet-100 text-violet-700",
      ring: "ring-violet-300",
    },
  };
  const c = colorMap[accentColor];

  const isUploading = uploadingCount > 0;
  const isDeletingFolder = deleting === `${category}-${folder.id}`;

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={cn(
        "relative rounded-2xl border-2 border-dashed bg-white shadow-lg shadow-gray-200/50 transition-all duration-200",
        isDragOver
          ? `${c.borderDrag} scale-[1.02] shadow-xl ring-2 ring-offset-2 ${c.ring}`
          : `${c.border} hover:shadow-xl`
      )}
    >
      {/* Drag overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/90 backdrop-blur-sm pointer-events-none">
          <div className="text-center">
            <Upload className={`mx-auto h-10 w-10 ${c.icon} animate-bounce`} />
            <p className="mt-2 text-sm font-semibold text-gray-700">
              Drop .docx files here
            </p>
          </div>
        </div>
      )}

      {/* Upload shimmer overlay — active while files are uploading */}
      {isUploading && (
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none z-[5]">
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <div className="flex items-center gap-3 min-w-0">
          <FolderOpen className={`h-5 w-5 shrink-0 ${c.icon}`} />
          <h3 className="font-bold text-gray-900 truncate">{folder.name}</h3>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${c.badge}`}
          >
            {folder.documents.length + (isUploading ? uploadingCount : 0)}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer disabled:opacity-50"
            title="Upload files"
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            onClick={onDeleteFolder}
            disabled={isDeletingFolder}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer disabled:opacity-50"
            title="Delete folder"
          >
            {isDeletingFolder ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Document list */}
      <div className="max-h-52 overflow-y-auto custom-scrollbar">
        {folder.documents.length > 0 || isUploading ? (
          <div className="divide-y divide-gray-50 px-2 py-2">
            {folder.documents.map((doc) => {
              const isDeletingFile =
                deleting === `${category}-${folder.id}-${doc.fileName}`;
              return (
                <div
                  key={doc.id}
                  className="group/file flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-gray-50"
                >
                  <FileText className="h-4 w-4 shrink-0 text-gray-400" />
                  <span className="flex-1 text-sm text-gray-700 truncate">
                    {doc.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => onDeleteFile(doc.fileName)}
                    disabled={isDeletingFile}
                    className="rounded p-1 text-gray-300 opacity-0 group-hover/file:opacity-100 hover:bg-red-50 hover:text-red-500 transition-all cursor-pointer disabled:opacity-50"
                    title="Delete file"
                  >
                    {isDeletingFile ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <X className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              );
            })}

            {/* Skeleton file rows for in-progress uploads */}
            {isUploading &&
              Array.from({ length: uploadingCount }).map((_, i) => (
                <SkeletonFileItem key={`skeleton-${i}`} index={i} />
              ))}
          </div>
        ) : (
          <div className="p-6 text-center">
            <Upload className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-2 text-xs text-gray-400">
              Drag & drop .docx files here
            </p>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        multiple
        onChange={handleFileInput}
        className="hidden"
      />
    </div>
  );
}