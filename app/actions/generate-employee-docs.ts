"use server";

import { TemplateData, TemplateHandler } from "easy-template-x";
import { readFile } from "node:fs/promises";
import path from "node:path";
import JSZip from "jszip";
import type { Employee, GlobalProperties, Role, Appointment } from "@/lib/types/employee";

export interface GenerateEmployeeDocsState {
  success: boolean;
  zipBase64?: string;
  error?: string;
  timestamp?: number;
}

export async function generateEmployeeDocs(
  employees: Employee[],
  globalProps: GlobalProperties,
  roles: Role[],
  appointments: Appointment[]
): Promise<GenerateEmployeeDocsState> {
  try {
    if (!employees || employees.length === 0) {
      return { success: false, error: "No employees provided" };
    }

    const zip = new JSZip();
    const handler = new TemplateHandler();
    const currentDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    for (const employee of employees) {
      const role = roles.find((r) => r.id === employee.roleId);
      if (!role) {
        return {
          success: false,
          error: `Role "${employee.roleId}" not found for employee "${employee.fullName}"`,
        };
      }

      const employeeFolder = zip.folder(employee.fullName);
      if (!employeeFolder) continue;

      const formatDisplayDate = (dateStr: string) => {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      };

      const templateData: TemplateData = {
        fullName: employee.fullName,
        birthday: formatDisplayDate(employee.birthday),
        startDate: formatDisplayDate(employee.startDate),
        trainingDuration: employee.trainingDuration,
        roleName: role.name,
        currentDate,
        // Global properties
        companyName: globalProps.companyName || "",
        companyEmail: globalProps.companyEmail || "",
        companyAddress: globalProps.companyAddress || "",
      };

      // Process ONLY selected role documents
      const roleFolder = employeeFolder.folder(role.name);
      if (roleFolder) {
        const selectedRoleDocs = role.documents.filter((doc) =>
          employee.selectedRoleDocIds.includes(doc.id)
        );
        for (const doc of selectedRoleDocs) {
          const templatePath = path.join(
            process.cwd(),
            "templates",
            "roles",
            role.id,
            doc.fileName
          );

          try {
            const templateBuffer = await readFile(templatePath);
            const processedDoc = await handler.process(
              templateBuffer,
              templateData
            );
            roleFolder.file(doc.fileName, processedDoc);
          } catch (err) {
            console.error(
              `Error processing role template ${doc.fileName}:`,
              err
            );
            return {
              success: false,
              error: `Failed to process template "${doc.fileName}" for role "${role.name}"`,
            };
          }
        }
      }

      // Process ONLY selected appointment documents
      for (const appointmentId of employee.appointmentIds) {
        const appointment = appointments.find((a) => a.id === appointmentId);
        if (!appointment) continue;

        const appointmentFolder = employeeFolder.folder(appointment.name);
        if (!appointmentFolder) continue;

        const selectedAppDocs = appointment.documents.filter((doc) =>
          employee.selectedAppointmentDocIds.includes(doc.id)
        );
        for (const doc of selectedAppDocs) {
          const templatePath = path.join(
            process.cwd(),
            "templates",
            "appointments",
            appointment.id,
            doc.fileName
          );

          try {
            const templateBuffer = await readFile(templatePath);
            const processedDoc = await handler.process(
              templateBuffer,
              templateData
            );
            appointmentFolder.file(doc.fileName, processedDoc);
          } catch (err) {
            console.error(
              `Error processing appointment template ${doc.fileName}:`,
              err
            );
            return {
              success: false,
              error: `Failed to process template "${doc.fileName}" for appointment "${appointment.name}"`,
            };
          }
        }
      }
    }

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
    const zipBase64 = zipBuffer.toString("base64");

    return {
      success: true,
      zipBase64,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error("Error generating employee docs:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate employee documents",
    };
  }
}
