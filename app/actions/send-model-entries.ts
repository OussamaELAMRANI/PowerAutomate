"use server";

import { TemplateData, TemplateHandler } from "easy-template-x";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

// Server-side validation schema
const serverFormSchema = z.object({
  model: z.string().min(1, "Model is required"),
  name: z.string().min(2, "Company name is required"),
  ceo_name: z.string().min(2, "CEO name is required"),
  releasedBy: z.string().min(2, "Released by is required"),
  doc_date: z.string().min(1, "Date is required"),
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
    // 1. Extract and validate data from FormData
    const rawData = {
      model: formData.get("model") as string,
      name: formData.get("name") as string,
      ceo_name: formData.get("ceo_name") as string,
      releasedBy: formData.get("releasedBy") as string,
      doc_date: formData.get("doc_date") as string,
    };

    // Validate using Zod
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

    // 2. Load the DOCX Template based on selected model
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

    // 3. Prepare Image Data (if uploaded)
    let logoData = null;
    let imageMimeType = "image/png";

    if (logoFile && logoFile.size > 0) {
      const arrayBuffer = await logoFile.arrayBuffer();
      logoData = Buffer.from(arrayBuffer);

      // easy-template-x expects MIME types, not file extensions
      // Supported MIME types: image/png, image/jpeg, image/gif, image/bmp, image/svg+xml
      const supportedMimeTypes = [
        "image/png",
        "image/jpeg",
        "image/gif",
        "image/bmp",
        "image/svg+xml",
      ];

      // Use the file's MIME type if supported, otherwise default to image/png
      if (supportedMimeTypes.includes(logoFile.type)) {
        imageMimeType = logoFile.type;
      } else {
        // For unsupported types like webp, use png as fallback
        imageMimeType = "image/png";
      }
    }

    // 4. Data Object for Replacement
    // Configure image with proper dimensions and right alignment
    const data: TemplateData = {
      name,
      ceo_name,
      releasedBy,
      doc_date,
      logo: logoData
        ? {
            _type: "image",
            source: logoData,
            format: imageMimeType,
            width: 120,
            height: 60,
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
