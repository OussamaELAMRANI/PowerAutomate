import { z } from "zod";

export const employeeFormSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must be less than 100 characters"),
  birthday: z
    .string()
    .min(1, "Please select a birthday"),
  startDate: z
    .string()
    .min(1, "Please select a start date"),
  trainingDuration: z
    .string()
    .min(1, "Please select a training duration"),
  roleId: z
    .string()
    .min(1, "Please select a role"),
  appointmentIds: z
    .array(z.string()),
});

export type EmployeeFormData = z.infer<typeof employeeFormSchema>;

export const globalPropertiesSchema = z.object({
  companyName: z.string().optional(),
  companyEmail: z.string().optional(),
  companyAddress: z.string().optional(),
});

export type GlobalPropertiesFormData = z.infer<typeof globalPropertiesSchema>;
