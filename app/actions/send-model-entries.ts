"use server";
import sizeOf from "image-size";
import { TemplateData, TemplateHandler } from "easy-template-x";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

// Server-side validation schema
const serverFormSchema = z
  .object({
    models: z.array(z.string()).min(1, "At least one model is required"),
    name: z.string().optional().nullable(),
    ceo_name: z.string().min(2, "CEO name is required"),
    releasedBy: z.string().min(2, "Released by is required"),
    doc_date: z.string().min(1, "Date is required"),
  })
  .superRefine((data, ctx) => {
    // Company name is required if model_1 is selected
    if (data.models.includes("model_1")) {
      if (!data.name || data.name.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Company name must be at least 2 characters",
          path: ["name"],
        });
      }
    }
  });

export interface GeneratedDocument {
  modelId: string;
  modelName: string;
  fileBase64: string;
}

export type GenerateState = {
  success: boolean;
  documents?: GeneratedDocument[];
  error?: string;
  timestamp?: string | number;
};

export async function generateDocument(
  prevState: GenerateState,
  formData: FormData
): Promise<GenerateState> {
  try {
    // Parse models from FormData (sent as JSON string)
    const modelsJson = formData.get("models") as string;
    const models = modelsJson ? JSON.parse(modelsJson) : [];

    const rawData = {
      models,
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

    const {
      models: validatedModels,
      name,
      ceo_name,
      releasedBy,
      doc_date,
    } = validationResult.data;
    const logoFile = formData.get("logo") as File | null;

    // Process logo if provided
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

      const dimensions = sizeOf(logoData);
      const originalWidth = dimensions.width || 100;
      const originalHeight = dimensions.height || 100;

      const MAX_WIDTH = 150;
      const MAX_HEIGHT = 60;

      const widthRatio = MAX_WIDTH / originalWidth;
      const heightRatio = MAX_HEIGHT / originalHeight;
      const scale = Math.min(widthRatio, heightRatio);

      finalWidth = Math.round(originalWidth * scale);
      finalHeight = Math.round(originalHeight * scale);
    }

    // Generate documents for each selected model
    const generatedDocuments: GeneratedDocument[] = [];
    const handler = new TemplateHandler();

    const modelNames: Record<string, string> = {
      model_1: "Model 1",
      model_2: "Model 2",
    };

    for (const model of validatedModels) {
      const templateFileName = `${model}.docx`;
      const templatePath = path.join(
        process.cwd(),
        "templates",
        templateFileName
      );

      let templateBuffer: Buffer;
      try {
        templateBuffer = await readFile(templatePath);
      } catch {
        return {
          success: false,
          error: `Template "${templateFileName}" not found.`,
        };
      }

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

      const docBlob = await handler.process(templateBuffer, data);
      const buffer = Buffer.from(docBlob);
      const base64 = buffer.toString("base64");

      generatedDocuments.push({
        modelId: model,
        modelName: modelNames[model] || model,
        fileBase64: base64,
      });
    }

    return {
      success: true,
      documents: generatedDocuments,
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
