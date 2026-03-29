"use client";
"use no memo";
import React, { useState, useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  modelFormSchema,
  ModelFormData,
} from "@/lib/validations/model-form";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  FormField,
  Input,
  MultiSelect,
  FileDropzone,
  DatePicker,
} from "@/components/ui";
import {
  FileText,
  Building2,
  UserCheck,
  Sparkles,
  Download,
  RotateCcw,
  Hash,
  User,
  MapPin,
  Globe,
  FolderOpen,
} from "lucide-react";

export interface StandardModelFolder {
  id: string;
  name: string;
  documents: { id: string; name: string; fileName: string }[];
}

export interface DocumentFormProps {
  onSubmit: (data: FormData) => void;
  onReset?: () => void;
  isPending: boolean;
  hasDocument: boolean;
  zipBase64?: string;
  error?: string;
  /** Called when user clicks a folder pill */
  onFolderClick?: (folder: StandardModelFolder) => void;
  /** Active folder (highlighted in the list) */
  activeFolderId?: string | null;
  /** Externally managed set of excluded doc IDs */
  excludedDocIds?: Set<string>;
}

export const DocumentForm: React.FC<DocumentFormProps> = ({
  onSubmit,
  onReset,
  isPending,
  hasDocument,
  zipBase64,
  error,
  onFolderClick,
  activeFolderId,
  excludedDocIds,
}) => {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [folders, setFolders] = useState<StandardModelFolder[]>([]);
  const [foldersLoaded, setFoldersLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/standard-models")
      .then((res) => res.json())
      .then((data) => {
        setFolders(data.folders || []);
        setFoldersLoaded(true);
      })
      .catch(() => setFoldersLoaded(true));
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<ModelFormData>({
    resolver: zodResolver(modelFormSchema),
    mode: "onChange",
    defaultValues: {
      folders: [],
      docVersion: "",
      createdBy: "",
      approvedBy: "",
      docDate: "",
      companyName: "",
      companyStreet: "",
      companyZip: "",
      companyCity: "",
      companyCountry: "",
      companyAddressLine: "",
    },
  });

  const selectedFolders = watch("folders");

  const folderOptions = useMemo(
    () => folders.map((f) => ({ id: f.id, name: f.name })),
    [folders]
  );

  const selectedFolderObjects = useMemo(
    () => folders.filter((f) => selectedFolders?.includes(f.id)),
    [folders, selectedFolders]
  );

  // Count included docs (excluding excluded ones)
  const totalDocs = selectedFolderObjects.reduce((acc, f) => {
    const included = f.documents.filter(
      (d) => !excludedDocIds?.has(d.id)
    ).length;
    return acc + included;
  }, 0);

  const handleReset = () => {
    reset();
    setLogoFile(null);
    onReset?.();
  };
  

  const handleFormSubmit = (data: ModelFormData) => {
    const formData = new FormData();
    formData.append("folders", JSON.stringify(data.folders));
    // Pass excluded doc IDs so server can skip them
    if (excludedDocIds && excludedDocIds.size > 0) {
      formData.append(
        "excludedDocIds",
        JSON.stringify(Array.from(excludedDocIds))
      );
    }
	
    formData.append("docVersion", data.docVersion);
    formData.append("createdBy", data.createdBy);
    formData.append("approvedBy", data.approvedBy);
    formData.append("docDate", data.docDate);
    formData.append("companyName", data.companyName);
    if (data.companyStreet) formData.append("companyStreet", data.companyStreet);
    if (data.companyZip) formData.append("companyZip", data.companyZip);
    if (data.companyCity) formData.append("companyCity", data.companyCity);
    if (data.companyCountry)
      formData.append("companyCountry", data.companyCountry);
    if (data.companyAddressLine)
      formData.append("companyAddressLine", data.companyAddressLine);
    if (logoFile) formData.append("logo", logoFile);
	console.log( Array.from(formData))
    onSubmit(formData);
  };

  const handleDownloadZip = () => {
    if (!zipBase64) return;
    const byteCharacters = atob(zipBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: "application/zip" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `standard-models-${Date.now()}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card variant="gradient" className="h-fit sticky top-20 sm:top-24">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 sm:h-12 sm:w-12">
            <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div>
            <CardTitle className="text-lg sm:text-2xl">
              Document Generator
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Select Standard Model folders, fill placeholders, download as ZIP
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <CardContent className="space-y-6">
          {/* ═══ Standard Model Selection ═══ */}
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">
              <FolderOpen className="h-4 w-4 text-blue-500" />
              Standard Models
            </h3>
            <FormField
              label="Select Folders"
              name="folders"
              required
              error={errors.folders?.message}
              description="Choose model folders to process"
            >
              <MultiSelect
                options={folderOptions}
                value={selectedFolders || []}
                onChange={(value) => setValue("folders", value)}
                placeholder={
                  foldersLoaded
                    ? "Select standard model folders..."
                    : "Loading folders..."
                }
                hasError={!!errors.folders}
              />
            </FormField>

            {/* Clickable folder pills */}
            {selectedFolderObjects.length > 0 && (
              <div className="mt-3 space-y-1.5 max-h-44 overflow-y-auto custom-scrollbar">
                {selectedFolderObjects.map((folder) => {
                  const includedCount = folder.documents.filter(
                    (d) => !excludedDocIds?.has(d.id),
                  ).length;
                  const isActive = activeFolderId === folder.id;
                  return (
                    <button
                      key={folder.id}
                      type="button"
                      onClick={() => onFolderClick?.(folder)}
                      className={`flex w-full items-center gap-3 rounded-xl border px-4 py-2.5 transition-all cursor-pointer ${
                        isActive
                          ? "border-blue-400 bg-blue-50 ring-2 ring-blue-200 shadow-md"
                          : "border-blue-100 bg-blue-50/50 hover:border-blue-300 hover:bg-blue-50"
                      }`}
                    >
                      <FolderOpen
                        className={`h-4 w-4 shrink-0 ${
                          isActive ? "text-blue-600" : "text-blue-400"
                        }`}
                      />
                      <span
                        className={`flex-1 text-left text-sm font-medium ${
                          isActive ? "text-blue-800" : "text-gray-700"
                        }`}
                      >
                        {folder.name}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          includedCount < folder.documents.length
                            ? "bg-amber-100 text-amber-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {includedCount}/{folder.documents.length}
                      </span>
                    </button>
                  );
                })}
                <p className="text-xs text-gray-400 pt-1">
                  Click a folder to view & filter its documents →
                </p>
              </div>
            )}
          </div>

          {/* ═══ Header Placeholder ═══ */}
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">
              <FileText className="h-4 w-4 text-purple-500" />
              Header
            </h3>
            <FormField
              label="Company Logo"
              name="logo"
              description="Optional — replaces {Logo} placeholder"
            >
              <FileDropzone
                onFileSelect={setLogoFile}
                value={logoFile}
                accept={{ "image/*": [".png", ".jpg", ".jpeg", ".svg"] }}
                placeholder="Drop your logo here"
                description="PNG, JPG, or SVG up to 5MB"
              />
            </FormField>
          </div>

          {/* ═══ Footer Metadata ═══ */}
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">
              <Hash className="h-4 w-4 text-indigo-500" />
              Footer Metadata
            </h3>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="Document Version"
                  name="docVersion"
                  id="docVersion"
                  required
                  description="{DocVersion} placeholder"
                  error={errors.docVersion?.message}
                >
                  <Input
                    id="docVersion"
                    {...register("docVersion")}
                    placeholder="e.g. v1.0"
                    leftIcon={<Hash className="h-4 w-4" />}
                    hasError={!!errors.docVersion}
                  />
                </FormField>
                <FormField
                  label="Document Date"
                  name="docDate"
                  description="{DocDate} placeholder"
                  required
                  error={errors.docDate?.message}
                >
                  <Controller
                    name="docDate"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select date"
                        hasError={!!errors.docDate}
                      />
                    )}
                  />
                </FormField>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="Created By"
                  name="createdBy"
                  id="createdBy"
                  description="{CreatedBy} placeholder"
                  required
                  error={errors.createdBy?.message}
                >
                  <Input
                    {...register("createdBy")}
                    id="createdBy"
                    placeholder="Author name"
                    leftIcon={<User className="h-4 w-4" />}
                    hasError={!!errors.createdBy}
                  />
                </FormField>
                <FormField
                  label="Approved By"
                  name="approvedBy"
                  id="approvedBy"
                  description="{ApprovedBy} placeholder"
                  required
                  error={errors.approvedBy?.message}
                >
                  <Input
                    {...register("approvedBy")}
                    id="approvedBy"
                    placeholder="Approver name"
                    leftIcon={<UserCheck className="h-4 w-4" />}
                    hasError={!!errors.approvedBy}
                  />
                </FormField>
              </div>
            </div>
          </div>

          {/* ═══ Company Data (Global) ═══ */}
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">
              <Building2 className="h-4 w-4 text-orange-500" />
              Company Data
              <span className="text-[10px] font-medium text-gray-400 normal-case">
                (global)
              </span>
            </h3>
            <div className="space-y-4">
              <FormField
                label="Company Name"
                name="companyName"
                id="companyName"
                description="{CompanyName} placeholder"
                required
                error={errors.companyName?.message}
              >
                <Input
                  {...register("companyName")}
                  id="companyName"
                  placeholder="Acme Corp"
                  leftIcon={<Building2 className="h-4 w-4" />}
                  hasError={!!errors.companyName}
                />
              </FormField>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  description="{companyStreet} placeholder"
                  label="Street"
                  name="companyStreet"
                  id="companyStreet"
                >
                  <Input
                    {...register("companyStreet")}
                    id="companyStreet"
                    placeholder="123 Main Street"
                    leftIcon={<MapPin className="h-4 w-4" />}
                  />
                </FormField>
                <FormField
                  description="{CompanyZip} placeholder"
                  label="ZIP Code"
                  name="companyZip"
                  id="companyZip"
                >
                  <Input
                    id="companyZip"
                    {...register("companyZip")}
                    placeholder="12345"
                  />
                </FormField>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  description="{CompanyCity} placeholder"
                  label="City"
                  name="companyCity"
                  id="companyCity"
                >
                  <Input
                    id="companyCity"
                    {...register("companyCity")}
                    placeholder="Berlin"
                  />
                </FormField>
                <FormField
                  description="{CompanyCountry} placeholder"
                  label="Country"
                  name="companyCountry"
                  id="companyCountry"
                >
                  <Input
                    id="companyCountry"
                    {...register("companyCountry")}
                    placeholder="Germany"
                    leftIcon={<Globe className="h-4 w-4" />}
                  />
                </FormField>
              </div>
              <FormField
                label="Full Address Line"
                name="companyAddressLine"
                id="companyAddressLine"
                description="Combined address (auto-fills {CompanyAddressLine})"
              >
                <Input
                  id="companyAddressLine"
                  {...register("companyAddressLine")}
                  placeholder="123 Main St, 12345 Berlin, Germany"
                />
              </FormField>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex-col gap-3">
          <Button
            type="submit"
            isLoading={isPending}
            className="w-full cursor-pointer"
            size="lg"
            leftIcon={<Sparkles className="h-5 w-5" />}
          >
            {isPending
              ? "Generating..."
              : `Generate ${totalDocs > 0 ? `${totalDocs} Documents` : "Documents"}`}
          </Button>

          {hasDocument && zipBase64 && (
            <div className="flex w-full gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleDownloadZip}
                leftIcon={<Download className="h-5 w-5" />}
              >
                Download ZIP
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="flex-1"
                onClick={handleReset}
                leftIcon={<RotateCcw className="h-5 w-5" />}
              >
                Start Over
              </Button>
            </div>
          )}

          {!hasDocument && (
            <Button
              type="button"
              variant="ghost"
              className="w-full cursor-pointer"
              onClick={handleReset}
              leftIcon={<RotateCcw className="h-4 w-4" />}
            >
              Clear Form
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  );
};

DocumentForm.displayName = "DocumentForm";
