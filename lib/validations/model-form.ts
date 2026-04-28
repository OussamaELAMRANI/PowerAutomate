import { format } from "@formkit/tempo";
import { z } from "zod";

export const modelFormSchema = z.object({
  folders: z
    .array(z.string())
    .min(1, "Please select at least one Standard Model"),
  // Footer Metadata
  docVersion: z
    .string()
    .min(1, "Document version is required")
    .max(50, "Version too long"),
  createdBy: z
    .string()
    .min(2, "Created by must be at least 2 characters")
    .max(100, "Created by too long"),
  approvedBy: z
    .string()
    .min(2, "Approved by must be at least 2 characters")
    .max(100, "Approved by too long"),
  docDate: z.string().transform((val) => {
    return format(val, "DD.MM.YYYY");
  }),
  // Company Data (global)
  companyName: z
    .string()
    .min(1, "Company name is required")
    .max(200, "Company name too long"),
  companyStreet: z.string().optional(),
  companyZip: z.string().optional(),
  companyCity: z.string().optional(),
  companyCountry: z.string().optional(),
  companyAddressLine: z.string().optional(),
});

export type ModelFormData = z.infer<typeof modelFormSchema>;
