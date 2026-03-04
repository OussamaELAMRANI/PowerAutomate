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
} from "lucide-react";

interface TemplateFolder {
  id: string;
  name: string;
  documents: { id: string; name: string; fileName: string }[];
}

interface TemplatesData {
  roles: TemplateFolder[];
  appointments: TemplateFolder[];
}

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

  const [newRoleName, setNewRoleName] = useState("");
  const [newAppointmentName, setNewAppointmentName] = useState("");
  const [showNewRole, setShowNewRole] = useState(false);
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Search state
  const [roleSearch, setRoleSearch] = useState("");
  const [appointmentSearch, setAppointmentSearch] = useState("");

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch("/api/templates");
      const data = await res.json();
      setTemplates({
        roles: data.roles || [],
        appointments: data.appointments || [],
      });
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

  // Client-side validate then upload
  const handleFilesUpload = async (
    files: FileList | File[],
    category: "roles" | "appointments",
    folderName: string
  ) => {
    const fileArray = Array.from(files);
    const errors: string[] = [];
    const validFiles: File[] = [];

    for (const file of fileArray) {
      // 1. Extension check
      if (!file.name.toLowerCase().endsWith(".docx")) {
        errors.push(`"${file.name}" — only .docx Word documents are allowed`);
        continue;
      }
      // 2. MIME type check
      const validMimes = [
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/octet-stream", // Some browsers report this
      ];
      if (file.type && !validMimes.includes(file.type)) {
        errors.push(`"${file.name}" — invalid file type (${file.type})`);
        continue;
      }
      // 3. Filename sanitization
      const nameCheck = validateFileName(file.name);
      if (!nameCheck.valid) {
        errors.push(`"${file.name}" — ${nameCheck.error}`);
        continue;
      }
      // 4. Size check
      const sizeCheck = validateFileSize(file.size);
      if (!sizeCheck.valid) {
        errors.push(`"${file.name}" — ${sizeCheck.error}`);
        continue;
      }
      // 5. Magic bytes check (DOCX = PK zip)
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
    setUploading(uploadKey);

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
        const failedFiles = data.results?.filter(
          (r: any) => r.status === "error"
        );
        if (failedFiles?.length > 0) {
          setToast({
            message: failedFiles
              .map((f: any) => `${f.name}: ${f.error}`)
              .join(". "),
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
      setUploading(null);
    }
  };

  const handleDeleteFile = async (
    category: "roles" | "appointments",
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

  const handleDeleteFolder = async (
    category: "roles" | "appointments",
    folderName: string
  ) => {
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

  const handleCreateFolder = async (
    category: "roles" | "appointments",
    name: string
  ) => {
    const validation = validateFolderName(name);
    if (!validation.valid) {
      setToast({
        message: validation.error || "Invalid name",
        type: "error",
      });
      return;
    }
    try {
      const res = await fetch("/api/uploads/folder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, folderName: name }),
      });
      if (res.ok) {
        setToast({
          message: `Folder "${name}" created`,
          type: "success",
        });
        await fetchTemplates();
        if (category === "roles") {
          setNewRoleName("");
          setShowNewRole(false);
        } else {
          setNewAppointmentName("");
          setShowNewAppointment(false);
        }
      } else {
        const data = await res.json();
        setToast({
          message: data.error || "Failed to create folder",
          type: "error",
        });
      }
    } catch {
      setToast({ message: "Failed to create folder", type: "error" });
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
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-3 text-gray-500">Loading templates...</span>
            </div>
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
                        {templates.roles.length} role
                        {templates.roles.length !== 1 ? "s" : ""}
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
                        uploading={uploading === `roles-${role.id}`}
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
                    {filteredRoles.length === 0 && (
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
                        {templates.appointments.length} appointment
                        {templates.appointments.length !== 1 ? "s" : ""}
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
                          handleCreateFolder(
                            "appointments",
                            newAppointmentName
                          );
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
                        uploading={uploading === `appointments-${appt.id}`}
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
                    {filteredAppointments.length === 0 && (
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

// ========================================================
// Template Island — flicker-free drag & drop per folder
// ========================================================
interface TemplateIslandProps {
  folder: TemplateFolder;
  category: "roles" | "appointments";
  accentColor: "blue" | "emerald";
  uploading: boolean;
  deleting: string | null;
  onUpload: (files: FileList | File[]) => void;
  onDeleteFile: (fileName: string) => void;
  onDeleteFolder: () => void;
}

function TemplateIsland({
  folder,
  category,
  accentColor,
  uploading,
  deleting,
  onUpload,
  onDeleteFile,
  onDeleteFolder,
}: TemplateIslandProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  // Use a counter to prevent flickering:
  // dragenter increments, dragleave decrements.
  // Only show overlay when counter > 0.
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (dragCounterRef.current === 1) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current === 0) {
      setIsDragOver(false);
    }
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
      if (files.length > 0) {
        onUpload(files);
      }
    },
    [onUpload]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files);
      e.target.value = "";
    }
  };

  const c =
    accentColor === "blue"
      ? {
          border: "border-blue-200",
          borderDrag: "border-blue-400 bg-blue-50/60",
          icon: "text-blue-500",
          badge: "bg-blue-100 text-blue-700",
        }
      : {
          border: "border-emerald-200",
          borderDrag: "border-emerald-400 bg-emerald-50/60",
          icon: "text-emerald-500",
          badge: "bg-emerald-100 text-emerald-700",
        };

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
          ? `${c.borderDrag} scale-[1.02] shadow-xl ring-2 ring-offset-2 ${accentColor === "blue" ? "ring-blue-300" : "ring-emerald-300"}`
          : `${c.border} hover:shadow-xl`
      )}
    >
      {/* Drag overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/90 backdrop-blur-sm pointer-events-none">
          <div className="text-center">
            <Upload
              className={`mx-auto h-10 w-10 ${c.icon} animate-bounce`}
            />
            <p className="mt-2 text-sm font-semibold text-gray-700">
              Drop .docx files here
            </p>
          </div>
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
            {folder.documents.length}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer disabled:opacity-50"
            title="Upload files"
          >
            {uploading ? (
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

      {/* Document List */}
      <div className="max-h-52 overflow-y-auto custom-scrollbar">
        {folder.documents.length > 0 ? (
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

      {/* Hidden file input — accept only .docx */}
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
