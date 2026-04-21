"use server";

import { TemplateData, TemplateHandler } from "easy-template-x";
import JSZip from "jszip";
import sizeOf from "image-size";
import type {
  Employee,
  GlobalProperties,
  Role,
  Appointment,
} from "@/lib/types/employee";
import {
  listTemplateFiles,
  fetchTemplateBuffer,
  parseCustomId,
  utapi,
} from "@/lib/uploadthing";

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
  appointments: Appointment[],
): Promise<GenerateEmployeeDocsState> {
  try {
    if (!employees || employees.length === 0) {
      return { success: false, error: "No employees provided" };
    }

    // Build URL map for all template files up front (one API round-trip)
    const allFiles = await listTemplateFiles();
    const templateFiles = allFiles.filter(
      (f) =>
        f.customId?.startsWith("roles/") ||
        f.customId?.startsWith("appointments/"),
    );
    const keys = templateFiles.map((f) => f.key);

    let urlMap = new Map<string, string>(); // key → url
    if (keys.length > 0) {
      const { data } = await utapi.getFileUrls(keys);
      data.forEach(({ key, url }) => urlMap.set(key, url));
    }

    // logical path ("category/folder/file") → url
    // customIds are 4-segment ("…/timestamp"), so key by the parsed 3-segment path.
    const templateUrlMap = new Map<string, string>();
    for (const f of templateFiles) {
      const parsed = parseCustomId(f.customId);
      const url = urlMap.get(f.key);
      if (parsed && url) {
        templateUrlMap.set(
          `${parsed.category}/${parsed.folderName}/${parsed.fileName}`,
          url,
        );
      }
    }

    const zip = new JSZip();
    const handler = new TemplateHandler();
    const currentDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    let logoData = null;
    let imageMimeType = "image/png";
    let finalWidth = 0;
    let finalHeight = 0;

    if (globalProps.companyLogo) {
      // "data:image/png;base64,..."
      const [prefix, base64] = globalProps.companyLogo.split(",");
      if (prefix && base64) {
        const match = prefix.match(/data:(image\/\w+);base64/);
        if (match) {
          imageMimeType = match[1];
        }
        logoData = Buffer.from(base64, "base64");

        try {
          const dimensions = sizeOf(logoData);
          const originalWidth = dimensions.width || 100;
          const originalHeight = dimensions.height || 100;
          const MAX_WIDTH = 150;
          const MAX_HEIGHT = 60;
          const scale = Math.min(
            MAX_WIDTH / originalWidth,
            MAX_HEIGHT / originalHeight,
          );
          finalWidth = Math.round(originalWidth * scale);
          finalHeight = Math.round(originalHeight * scale);
        } catch (err) {
          console.error("Error sizing logo:", err);
        }
      }
    }

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
        Logo: logoData
          ? {
              _type: "image",
              source: logoData,
              format: imageMimeType,
              width: finalWidth,
              height: finalHeight,
            }
          : "",
        FullName: employee.fullName,
        Birthday: formatDisplayDate(employee.birthday),
        StartDate: formatDisplayDate(employee.startDate),
        RoleName: role.name,
        RoleType: employee.roleType || "",
        TrainingHours: employee.trainingHours || "",
        GuardIDNumber: employee.guardIDNumber || "",
        EmployeeIDNumber: employee.employeeIDNumber || "",
        currentDate,
        CompanyName: globalProps.companyName || "",
        CompanyEmail: globalProps.companyEmail || "",
        CompanyAddress: globalProps.companyAddress || "",
        DocVersion: globalProps.documentVersion || "",
        DocDate: globalProps.documentDate || "",
        CreatedBy: globalProps.createdBy || "",
        ApprovedBy: globalProps.approvedBy || "",
      };

      // Process selected role documents
      const roleFolder = employeeFolder.folder(role.name);
      if (roleFolder) {
        const selectedRoleDocs = role.documents.filter((doc) =>
          employee.selectedRoleDocIds.includes(doc.id),
        );
        for (const doc of selectedRoleDocs) {
          const customId = `roles/${role.id}/${doc.fileName}`;
          const url = templateUrlMap.get(customId);
          if (!url) {
            return {
              success: false,
              error: `Template not found: ${customId}`,
            };
          }
          try {
            const templateBuffer = await fetchTemplateBuffer(url);
            const processedDoc = await handler.process(
              templateBuffer,
              templateData,
            );
            roleFolder.file(doc.fileName, processedDoc);
          } catch (err) {
            console.error(
              `Error processing role template ${doc.fileName}:`,
              err,
            );
            return {
              success: false,
              error: `Failed to process template "${doc.fileName}" for role "${role.name}"`,
            };
          }
        }
      }

      // Process selected appointment documents
      for (const appointmentId of employee.appointmentIds) {
        const appointment = appointments.find((a) => a.id === appointmentId);
        if (!appointment) continue;

        const appointmentFolder = employeeFolder.folder(appointment.name);
        if (!appointmentFolder) continue;

        const selectedAppDocs = appointment.documents.filter((doc) =>
          employee.selectedAppointmentDocIds.includes(doc.id),
        );
        for (const doc of selectedAppDocs) {
          const customId = `appointments/${appointment.id}/${doc.fileName}`;
          const url = templateUrlMap.get(customId);
          if (!url) {
            return {
              success: false,
              error: `Template not found: ${customId}`,
            };
          }
          try {
            const templateBuffer = await fetchTemplateBuffer(url);
            const processedDoc = await handler.process(
              templateBuffer,
              templateData,
            );
            appointmentFolder.file(doc.fileName, processedDoc);
          } catch (err) {
            console.error(
              `Error processing appointment template ${doc.fileName}:`,
              err,
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

    return { success: true, zipBase64, timestamp: Date.now() };
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
