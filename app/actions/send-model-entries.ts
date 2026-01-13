"use server";
import sizeOf from "image-size"; // <--- Import this
import { TemplateData, TemplateHandler } from "easy-template-x";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

// Server-side validation schema
const serverFormSchema = z
  .object({
    model: z.string().min(1, "Model is required"),
    name: z.string().optional().nullable(),
    ceo_name: z.string().min(2, "CEO name is required"),
    releasedBy: z.string().min(2, "Released by is required"),
    doc_date: z.string().min(1, "Date is required"),
  })
  .superRefine((data, ctx) => {
    // Company name is required only for model_1
    if (data.model === "model_1") {
      if (!data.name || data.name.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Company name must be at least 2 characters",
          path: ["name"],
        });
      }
    }
  });

export type GenerateState = {
  success: boolean;
  fileBase64?: string;
  error?: string;
  timestamp?: string | number;
};

export async function generateDocument(
  prevState: GenerateState,
  formData: FormData
): Promise<GenerateState> {
  try {
    const rawData = {
      model: formData.get("model") as string,
      name: (formData.get("name") as string) || "",
      ceo_name: formData.get("ceo_name") as string,
      releasedBy: formData.get("releasedBy") as string,
      doc_date: formData.get("doc_date") as string,
    };

    const validationResult = serverFormSchema.safeParse(rawData);
    if (!validationResult.success) {
      const errorMessages = validationResult.error.issues
        .map((issue) => issue.message)
        .join(", ");
      return { success: false, error: errorMessages };
    }

    const { model, name, ceo_name, releasedBy, doc_date } =
      validationResult.data;
    const logoFile = formData.get("logo") as File | null;

    const templateFileName = `${model}.docx`;
    const templatePath = path.join(
      process.cwd(),
      "templates",
      templateFileName
    );

    console.log({ model, name, ceo_name, releasedBy, doc_date });

    let templateBuffer: Buffer;
    try {
      templateBuffer = await readFile(templatePath);
    } catch {
      return {
        success: false,
        error: `Template "${templateFileName}" not found. Please ensure the template exists in the templates folder.`,
      };
    }

    let logoData = null;
    let imageMimeType = "image/png";
    let finalWidth = 0;
    let finalHeight = 0;

    if (logoFile && logoFile.size > 0) {
      const arrayBuffer = await logoFile.arrayBuffer();
      logoData = Buffer.from(arrayBuffer);

      const supportedMimeTypes = [
        "image/png",
        "image/jpeg",
        "image/gif",
        "image/bmp",
        "image/svg+xml",
      ];

      if (supportedMimeTypes.includes(logoFile.type)) {
        imageMimeType = logoFile.type;
      } else {
        imageMimeType = "image/png";
      }

      // Get image dimensions only if logo is provided
      const dimensions = sizeOf(logoData);
      const originalWidth = dimensions.width || 100;
      const originalHeight = dimensions.height || 100;

      // Define Header Constraints (The max space available in your DOCX table)
      const MAX_WIDTH = 150; // pixels (approx 4cm)
      const MAX_HEIGHT = 60; // pixels (approx 1.5cm)

      // Calculate Scale Ratio (Contain logic)
      const widthRatio = MAX_WIDTH / originalWidth;
      const heightRatio = MAX_HEIGHT / originalHeight;
      const scale = Math.min(widthRatio, heightRatio);

      finalWidth = Math.round(originalWidth * scale);
      finalHeight = Math.round(originalHeight * scale);
    }

    // Data Object for Replacement
    const data: TemplateData = {
      name: name || "",
      ceo_name,
      releasedBy,
      doc_date,
      logo: logoData
        ? {
            _type: "image",
            source: logoData,
            format: imageMimeType,
            width: finalWidth,
            height: finalHeight,
          }
        : "",
    };

    // 5. Process the Template
    const handler = new TemplateHandler();
    const docBlob = await handler.process(templateBuffer, data);

    // 6. Convert result to Base64
    const buffer = Buffer.from(docBlob);
    const base64 = buffer.toString("base64");

    return {
      success: true,
      fileBase64: base64,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error("Error generating doc:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to generate document",
    };
  }
}
