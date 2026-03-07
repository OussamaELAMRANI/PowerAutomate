"use server";

import sizeOf from "image-size";
import { TemplateData, TemplateHandler } from "easy-template-x";
import { readFile } from "node:fs/promises";
import path from "node:path";
import JSZip from "jszip";

export interface GeneratedDocument {
  modelId: string;
  modelName: string;
  fileBase64: string;
}

export type GenerateState = {
  success: boolean;
  documents?: GeneratedDocument[];
  zipBase64?: string;
  error?: string;
  timestamp?: string | number;
};

export interface StandardModelFolder {
  id: string;
  name: string;
  documents: { id: string; name: string; fileName: string }[];
}

export async function generateDocument(
  prevState: GenerateState,
  formData: FormData
): Promise<GenerateState> {
  try {
    // Parse form data
    const foldersJson = formData.get("folders") as string;
    const selectedFolders: string[] = foldersJson ? JSON.parse(foldersJson) : [];

    if (!selectedFolders || selectedFolders.length === 0) {
      return { success: false, error: "Please select at least one Standard Model folder" };
    }

    // Parse excluded doc IDs for filtering
    const excludedJson = formData.get("excludedDocIds") as string;
    const excludedDocIds: Set<string> = new Set(
      excludedJson ? JSON.parse(excludedJson) : []
    );

    // Header placeholders
    const logoFile = formData.get("logo") as File | null;

    // Footer metadata placeholders
    const docVersion = (formData.get("docVersion") as string) || "";
    const createdBy = (formData.get("createdBy") as string) || "";
    const approvedBy = (formData.get("approvedBy") as string) || "";
    const docDate = (formData.get("docDate") as string) || "";

    // Company data (global) placeholders
    const companyName = (formData.get("companyName") as string) || "";
    const companyStreet = (formData.get("companyStreet") as string) || "";
    const companyZip = (formData.get("companyZip") as string) || "";
    const companyCity = (formData.get("companyCity") as string) || "";
    const companyCountry = (formData.get("companyCountry") as string) || "";
    const companyAddressLine = (formData.get("companyAddressLine") as string) || "";

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
      }

      const dimensions = sizeOf(logoData);
      const originalWidth = dimensions.width || 100;
      const originalHeight = dimensions.height || 100;
      const MAX_WIDTH = 150;
      const MAX_HEIGHT = 60;
      const scale = Math.min(MAX_WIDTH / originalWidth, MAX_HEIGHT / originalHeight);
      finalWidth = Math.round(originalWidth * scale);
      finalHeight = Math.round(originalHeight * scale);
    }

    // Build template data with all placeholder categories
    const templateData: TemplateData = {
      // Header
      Logo: logoData
        ? {
            _type: "image",
            source: logoData,
            format: imageMimeType,
            width: finalWidth,
            height: finalHeight,
          }
        : "",
      // Footer Metadata
      DocVersion: docVersion,
      CreatedBy: createdBy,
      ApprovedBy: approvedBy,
      DocDate: docDate,
      // Company Data (global)
      CompanyName: companyName,
      CompanyStreet: companyStreet,
      CompanyZip: companyZip,
      CompanyCity: companyCity,
      CompanyCountry: companyCountry,
      CompanyAddressLine: companyAddressLine,
    };

    const handler = new TemplateHandler();
    const zip = new JSZip();
    const generatedDocuments: GeneratedDocument[] = [];

    // Process each selected folder
    for (const folderId of selectedFolders) {
      const folderPath = path.join(
        process.cwd(),
        "templates",
        "standard-models",
        folderId
      );

      // Path traversal check
      const resolved = path.resolve(folderPath);
      if (!resolved.startsWith(path.resolve(path.join(process.cwd(), "templates")))) {
        return { success: false, error: "Invalid folder path" };
      }

      // Read all .docx files in the folder
      const { readdirSync } = await import("node:fs");
      let files: string[];
      try {
        files = readdirSync(folderPath).filter((f) => f.endsWith(".docx"));
      } catch {
        return { success: false, error: `Folder "${folderId}" not found` };
      }

      const folderName = folderId
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

      const zipFolder = zip.folder(folderName);

      for (const fileName of files) {
        // Build the doc ID the same way the client does: folderId-fileNameWithoutExtension
        const docId = `${folderId}-${fileName.replace(".docx", "")}`;
        if (excludedDocIds.has(docId)) continue; // Skip excluded docs

        const templatePath = path.join(folderPath, fileName);

        try {
          const templateBuffer = await readFile(templatePath);
          const processedDoc = await handler.process(templateBuffer, templateData);
          zipFolder?.file(fileName, processedDoc);

          generatedDocuments.push({
            modelId: `${folderId}/${fileName}`,
            modelName: `${folderName} - ${fileName.replace(".docx", "")}`,
            fileBase64: Buffer.from(processedDoc).toString("base64"),
          });
        } catch (err) {
          console.error(`Error processing ${fileName}:`, err);
          return {
            success: false,
            error: `Failed to process template "${fileName}" in "${folderName}"`,
          };
        }
      }
    }

    // Generate ZIP
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
    const zipBase64 = zipBuffer.toString("base64");

    return {
      success: true,
      documents: generatedDocuments,
      zipBase64,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error("Error generating doc:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate document",
    };
  }
}
