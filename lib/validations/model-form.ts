import { z } from "zod";

// Base schema with companyName conditionally required based on models
export const modelFormSchema = z
  .object({
    models: z.array(z.string()).min(1, "Please select at least one template"),
    companyName: z.string().optional(),
    ceoName: z
      .string()
      .min(2, "CEO name must be at least 2 characters")
      .max(100, "CEO name must be less than 100 characters"),
    releasedBy: z
      .string()
      .min(2, "Released by must be at least 2 characters")
      .max(100, "Released by must be less than 100 characters"),
    documentDate: z.string().min(1, "Please select a date"),
  })
  .superRefine((data, ctx) => {
    // Company name is required if model_1 is selected
    if (data.models.includes("model_1")) {
      if (!data.companyName || data.companyName.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Company name must be at least 2 characters",
          path: ["companyName"],
        });
      }
    }
  });

// Form input type
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
    name: "Model 2 - Template 2",
    description: "without the company name",
    file: "model_2.docx",
    disabled: false,
  },
] as const;

export type ModelTemplate = (typeof MODEL_TEMPLATES)[number];
