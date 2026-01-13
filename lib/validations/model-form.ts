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
    name: "Model 1 - Standard Document",
    description: "Basic company document template with logo support",
    file: "model_1.docx",
  },
  {
    id: "model_2",
    name: "Model 2 - Extended Template",
    description: "Extended document with additional sections",
    file: "model_2.docx",
    disabled: true,
  },
] as const;

export type ModelTemplate = (typeof MODEL_TEMPLATES)[number];
