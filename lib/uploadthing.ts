import { UTApi, UTFile } from "uploadthing/server";

export const utapi = new UTApi();

export type TemplateCategory = "roles" | "appointments" | "standard-models";

export const VALID_CATEGORIES: TemplateCategory[] = [
  "roles",
  "appointments",
  "standard-models",
];

/**
 * Build a unique customId: "category/folderName/fileName/{timestamp}"
 *
 * The timestamp suffix ensures every upload gets a fresh customId so
 * re-uploading the same file after deletion never hits UploadThing's
 * customId reservation on "Deletion Pending" files.
 */
export function buildCustomId(
  category: string,
  folderName: string,
  fileName: string
): string {
  return `${category}/${folderName}/${fileName}/${Date.now()}`;
}

/**
 * The 3-segment logical path prefix used to find all versions of a file:
 * "category/folderName/fileName/"
 */
export function buildPathPrefix(
  category: string,
  folderName: string,
  fileName: string
): string {
  return `${category}/${folderName}/${fileName}/`;
}

/**
 * Parse a customId back to its parts.
 * Handles both 3-segment (legacy) and 4-segment (timestamped) formats.
 * Returns null if invalid.
 */
export function parseCustomId(customId: string | null) {
  if (!customId) return null;
  const parts = customId.split("/");
  if (parts.length < 3) return null;
  const [category, folderName, fileName] = parts;
  if (!VALID_CATEGORIES.includes(category as TemplateCategory)) return null;
  return { category: category as TemplateCategory, folderName, fileName };
}

/**
 * List only "Uploaded" template files (excludes "Deletion Pending").
 * Assumes the template library stays below 500 files.
 */
export async function listTemplateFiles() {
  const { files } = await utapi.listFiles({ limit: 500 });
  return files.filter((f) => f.status === "Uploaded");
}

/**
 * Upload a buffer to UploadThing with a timestamped customId.
 * Returns the ufsUrl on success, or throws on failure.
 */
export async function uploadTemplateFile(
  buffer: ArrayBuffer,
  fileName: string,
  customId: string
): Promise<string> {
  const utFile = 
  new UTFile([buffer]
	,fileName, {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    customId,
  });

  const result = await utapi.uploadFiles(utFile);
  
  if (result.error) {
    console.error("[UploadThing] Upload failed:", result.error);
    throw new Error(result.error.message ?? "Upload failed");
  }
  console.log("[UploadThing] Uploaded:", result.data);
  return result.data.ufsUrl;
}

/**
 * Fetch a template file's raw bytes from UploadThing by its ufsUrl.
 */
export async function fetchTemplateBuffer(ufsUrl: string): Promise<Buffer> {
  const res = await fetch(ufsUrl);
  if (!res.ok) throw new Error(`Failed to fetch template (${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}
