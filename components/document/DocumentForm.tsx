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
  Select,
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

export interface DocumentFormProps {
  onSubmit: (data: FormData) => void;
  onReset?: () => void;
  isPending: boolean;
  hasDocument: boolean;
  fileBase64?: string;
  error?: string;
}

export const DocumentForm: React.FC<DocumentFormProps> = ({
  onSubmit,
  onReset,
  isPending,
  hasDocument,
  fileBase64,
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
      model: "",
      companyName: "",
      ceoName: "",
      releasedBy: "",
      documentDate: "",
    },
  });

  const selectedModel = watch("model");

  // Re-validate companyName when model changes to clear errors for model_2
  React.useEffect(() => {
    if (selectedModel) {
      trigger("companyName");
    }
  }, [selectedModel, trigger]);

  const handleReset = () => {
    reset();
    setLogoFile(null);
    onReset?.();
  };

  const handleFormSubmit = (data: ModelFormData) => {
    const formData = new FormData();
    formData.append("model", data.model);
    if (data.companyName) formData.append("name", data.companyName);
    formData.append("ceo_name", data.ceoName);
    formData.append("releasedBy", data.releasedBy);
    formData.append("doc_date", data.documentDate);
    if (logoFile) {
      formData.append("logo", logoFile);
    }
    onSubmit(formData);
  };

  const handleDownload = () => {
    if (fileBase64) {
      const byteCharacters = atob(fileBase64);
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
      a.download = `document-${Date.now()}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    }
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
            label="Template Model"
            name="model"
            required
            error={errors.model?.message}
            description="Select the document template to use"
          >
            <Select
              options={MODEL_TEMPLATES}
              value={selectedModel}
              onChange={(value) => setValue("model", value)}
              placeholder="Select a template..."
              hasError={!!errors.model}
            />
          </FormField>

          {/* Selected Model Info */}
          {selectedModel && (
            <div className="rounded-xl bg-blue-50 p-4 border border-blue-100">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="info">Selected</Badge>
                <span className="font-medium text-blue-900">
                  {MODEL_TEMPLATES.find((m) => m.id === selectedModel)?.name}
                </span>
              </div>
              <p className="text-sm text-blue-700">
                {
                  MODEL_TEMPLATES.find((m) => m.id === selectedModel)
                    ?.description
                }
              </p>
            </div>
          )}

          {/* Company Name */}
          {MODEL_TEMPLATES.find((m) => m.id === selectedModel)?.file ===
          "model_2.docx" ? (
            <></>
          ) : (
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
            {isPending ? "Generating..." : "Generate Document"}
          </Button>

          {hasDocument && (
            <div className="flex w-full gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleDownload}
                leftIcon={<Download className="h-5 w-5" />}
              >
                Download
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
