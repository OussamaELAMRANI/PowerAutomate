"use client";
"use no memo";

import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  modelFormSchema,
  ModelFormData,
  MODEL_TEMPLATES,
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
  Badge,
  DatePicker,
} from "@/components/ui";
import {
  FileText,
  Building2,
  User,
  UserCheck,
  Sparkles,
  Download,
  RotateCcw,
} from "lucide-react";
import type { GeneratedDocument } from "@/app/actions/send-model-entries";

export interface DocumentFormProps {
  onSubmit: (data: FormData) => void;
  onReset?: () => void;
  isPending: boolean;
  hasDocument: boolean;
  documents?: GeneratedDocument[];
  error?: string;
}

export const DocumentForm: React.FC<DocumentFormProps> = ({
  onSubmit,
  onReset,
  isPending,
  hasDocument,
  documents,
  error,
}) => {
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    reset,
    trigger,
    formState: { errors },
  } = useForm<ModelFormData>({
    resolver: zodResolver(modelFormSchema),
    mode: "onChange",
    defaultValues: {
      models: [],
      companyName: "",
      ceoName: "",
      releasedBy: "",
      documentDate: "",
    },
  });

  const selectedModels = watch("models");

  // Re-validate companyName when models change to clear errors
  React.useEffect(() => {
    if (selectedModels && selectedModels.length > 0) {
      trigger("companyName");
    }
  }, [selectedModels, trigger]);

  const handleReset = () => {
    reset();
    setLogoFile(null);
    onReset?.();
  };

  const handleFormSubmit = (data: ModelFormData) => {
    const formData = new FormData();
    formData.append("models", JSON.stringify(data.models));
    if (data.companyName) formData.append("name", data.companyName);
    formData.append("ceo_name", data.ceoName);
    formData.append("releasedBy", data.releasedBy);
    formData.append("doc_date", data.documentDate);
    if (logoFile) {
      formData.append("logo", logoFile);
    }
    onSubmit(formData);
  };

  const handleDownload = (doc?: GeneratedDocument) => {
    const base64ToDownload = doc?.fileBase64 || documents?.[0]?.fileBase64;
    const modelName = doc?.modelName || documents?.[0]?.modelName || "document";

    if (base64ToDownload) {
      const byteCharacters = atob(base64ToDownload);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${modelName
        .replace(/\s+/g, "-")
        .toLowerCase()}-${Date.now()}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleDownloadAll = () => {
    documents?.forEach((doc) => handleDownload(doc));
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
              Fill in the details to generate your document
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <CardContent className="space-y-5">
          {/* Model Selection */}
          <FormField
            label="Template Models"
            name="models"
            required
            error={errors.models?.message}
            description="Select one or more document templates"
          >
            <MultiSelect
              options={MODEL_TEMPLATES}
              value={selectedModels}
              onChange={(value) => setValue("models", value)}
              placeholder="Select templates..."
              hasError={!!errors.models}
            />
          </FormField>

          {/* Selected Models Info */}
          {selectedModels.length > 0 && (
            <div className="rounded-xl bg-blue-50 p-4 border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="info">{selectedModels.length} Selected</Badge>
              </div>
              <div className="space-y-2">
                {selectedModels.map((modelId) => {
                  const model = MODEL_TEMPLATES.find((m) => m.id === modelId);
                  return model ? (
                    <div key={modelId} className="text-sm text-blue-700">
                      <span className="font-medium">{model.name}</span>
                      {model.description && (
                        <span className="text-blue-600">
                          {" "}
                          - {model.description}
                        </span>
                      )}
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {/* Company Name - only show if model_1 is selected */}
          {selectedModels.includes("model_1") && (
            <FormField
              label="Company Name"
              name="companyName"
              required
              error={errors.companyName?.message}
            >
              <Input
                {...register("companyName")}
                placeholder="Enter company name"
                leftIcon={<Building2 className="h-5 w-5" />}
                hasError={!!errors.companyName}
              />
            </FormField>
          )}

          {/* CEO Name */}
          <FormField
            label="CEO Name"
            name="ceoName"
            required
            error={errors.ceoName?.message}
          >
            <Input
              {...register("ceoName")}
              placeholder="Enter CEO name"
              leftIcon={<User className="h-5 w-5" />}
              hasError={!!errors.ceoName}
            />
          </FormField>

          {/* Released By */}
          <FormField
            label="Released By"
            name="releasedBy"
            required
            error={errors.releasedBy?.message}
          >
            <Input
              {...register("releasedBy")}
              placeholder="Enter department or person"
              leftIcon={<UserCheck className="h-5 w-5" />}
              hasError={!!errors.releasedBy}
            />
          </FormField>

          {/* Document Date */}
          <FormField
            label="Document Date"
            name="documentDate"
            required
            error={errors.documentDate?.message}
          >
            <Controller
              name="documentDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select document date"
                  hasError={!!errors.documentDate}
                />
              )}
            />
          </FormField>

          {/* Logo Upload */}
          <FormField
            label="Company Logo"
            name="logo"
            description="Optional: Upload your company logo"
          >
            <FileDropzone
              onFileSelect={setLogoFile}
              value={logoFile}
              accept={{ "image/*": [".png", ".jpg", ".jpeg", ".svg"] }}
              placeholder="Drop your logo here"
              description="PNG, JPG, or SVG up to 5MB"
            />
          </FormField>

          {/* Error Display */}
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex-col gap-3 ">
          <Button
            type="submit"
            isLoading={isPending}
            className="w-full cursor-pointer"
            size="lg"
            leftIcon={<Sparkles className="h-5 w-5" />}
          >
            {isPending
              ? "Generating..."
              : `Generate ${
                  selectedModels.length > 1 ? "Documents" : "Document"
                }`}
          </Button>

          {hasDocument && documents && documents.length > 0 && (
            <div className="flex w-full gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleDownloadAll}
                leftIcon={<Download className="h-5 w-5" />}
              >
                Download {documents.length > 1 ? "All" : ""}
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
              className="w-full  cursor-pointer"
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
