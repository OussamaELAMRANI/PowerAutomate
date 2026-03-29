"use server";

import sizeOf from "image-size";
import { TemplateData, TemplateHandler } from "easy-template-x";
import JSZip from "jszip";
import {
  listTemplateFiles,
  fetchTemplateBuffer,
  parseCustomId,
  utapi,
} from "@/lib/uploadthing";

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

    const excludedJson = formData.get("excludedDocIds") as string;
    const excludedDocIds: Set<string> = new Set(
      excludedJson ? JSON.parse(excludedJson) : []
    );

    const logoFile = formData.get("logo") as File | null;
    const docVersion = (formData.get("docVersion") as string) || "";
    const createdBy = (formData.get("createdBy") as string) || "";
    const approvedBy = (formData.get("approvedBy") as string) || "";
    const docDate = (formData.get("docDate") as string) || "";
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

    const templateData: TemplateData = {
      Logo: logoData
        ? { _type: "image", source: logoData, format: imageMimeType, width: finalWidth, height: finalHeight }
        : "",
      DocVersion: docVersion,
      CreatedBy: createdBy,
      ApprovedBy: approvedBy,
      DocDate: docDate,
      CompanyName: companyName,
      CompanyStreet: companyStreet,
      CompanyZip: companyZip,
      CompanyCity: companyCity,
      CompanyCountry: companyCountry,
      CompanyAddressLine: companyAddressLine,
    };

    // Build a lookup: 3-segment logical path → ufsUrl
    // (e.g. "standard-models/folder/file.docx" → url)
    // customIds are now 4-segment ("…/timestamp"), so we key by the parsed path.
    const allFiles = await listTemplateFiles();
    const keys = allFiles
      .filter((f) => f.customId?.startsWith("standard-models/"))
      .map((f) => f.key);

    let urlMap = new Map<string, string>(); // key → ufsUrl
    if (keys.length > 0) {
      const { data } = await utapi.getFileUrls(keys);
      data.forEach(({ key, url }) => urlMap.set(key, url));
    }

    // logical path ("category/folder/file") → ufsUrl
    const templateUrlMap = new Map<string, string>();
    for (const f of allFiles) {
      const parsed = parseCustomId(f.customId);
      if (parsed?.category === "standard-models") {
        const url = urlMap.get(f.key);
        if (url) {
          templateUrlMap.set(
            `${parsed.category}/${parsed.folderName}/${parsed.fileName}`,
            url
          );
        }
      }
    }

    const handler = new TemplateHandler();
    const zip = new JSZip();
    const generatedDocuments: GeneratedDocument[] = [];

    for (const folderId of selectedFolders) {
      // Collect .docx files for this folder using the parsed logical path
      const folderFiles = allFiles
        .map((f) => parseCustomId(f.customId))
        .filter(
          (p): p is NonNullable<typeof p> =>
            p?.category === "standard-models" &&
            p.folderName === folderId &&
            p.fileName.endsWith(".docx")
        )
        // de-duplicate: keep one entry per fileName (re-uploads create new timestamps)
        .filter(
          (p, i, arr) => arr.findIndex((x) => x.fileName === p.fileName) === i
        );

      if (folderFiles.length === 0) {
        return { success: false, error: `Folder "${folderId}" not found or empty` };
      }

      const folderName = folderId
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

      const zipFolder = zip.folder(folderName);

      for (const { fileName } of folderFiles) {
        const docId = `${folderId}-${fileName.replace(".docx", "")}`;
        if (excludedDocIds.has(docId)) continue;

        const logicalPath = `standard-models/${folderId}/${fileName}`;
        const url = templateUrlMap.get(logicalPath);
        if (!url) {
          return { success: false, error: `Template not found: ${logicalPath}` };
        }

        try {
          const templateBuffer = await fetchTemplateBuffer(url);
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