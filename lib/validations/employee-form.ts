import { z } from "zod";

export const employeeFormSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must be less than 100 characters"),
  birthday: z.string().min(1, "Please select a birthday"),
  startDate: z.string().min(1, "Please select a start date"),
  roleId: z.string().min(1, "Please select a role"),
  appointmentIds: z.array(z.string()),
  // New optional fields
  roleType: z.string().optional(),
  trainingHours: z.string().optional(),
  guardIDNumber: z.string().optional(),
  employeeIDNumber: z.string().optional(),
  useGuardAsEmployeeId: z.boolean().optional(),
});

export type EmployeeFormData = z.infer<typeof employeeFormSchema>;

export const globalPropertiesSchema = z.object({
  companyName: z.string().optional(),
  companyEmail: z.string().optional(),
  companyAddress: z.string().optional(),
  companyLogo: z.string().optional(),
  documentVersion: z.string().optional(),
  documentDate: z.string().optional(),
  createdBy: z.string().optional(),
  approvedBy: z.string().optional(),
});

export type GlobalPropertiesFormData = z.infer<typeof globalPropertiesSchema>;
