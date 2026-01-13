import { z } from "zod";

export const modelFormSchema = z.object({
  model: z.string().min(1, "Please select a model template"),
  companyName: z
    .string()
    .min(2, "Company name must be at least 2 characters")
    .max(100, "Company name must be less than 100 characters"),
  ceoName: z
    .string()
    .min(2, "CEO name must be at least 2 characters")
    .max(100, "CEO name must be less than 100 characters"),
  releasedBy: z
    .string()
    .min(2, "Released by must be at least 2 characters")
    .max(100, "Released by must be less than 100 characters"),
  documentDate: z.string().min(1, "Please select a date"),
});

export type ModelFormData = z.infer<typeof modelFormSchema>;

// Available model templates
export const MODEL_TEMPLATES = [
  {
    id: "model_1",
    name: "Model 1 - Template 1",
    description: "with the company name",
    file: "model_1.docx",
  },
  {
    id: "model_2",
    name: "Model 2 - Tempate 2",
    description: "without company name",
    file: "model_2.docx",
    disabled: false,
  },
] as const;

export type ModelTemplate = (typeof MODEL_TEMPLATES)[number];
