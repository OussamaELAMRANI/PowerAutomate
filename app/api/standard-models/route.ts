import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

/**
 * GET /api/standard-models
 * Scans templates/standard-models/ to discover all model folders and their sub-documents.
 */
export async function GET() {
  try {
    const modelsDir = path.join(process.cwd(), "templates", "standard-models");

    if (!fs.existsSync(modelsDir)) {
      return NextResponse.json({ folders: [] });
    }

    const entries = fs.readdirSync(modelsDir, { withFileTypes: true });
    const folders: {
      id: string;
      name: string;
      documents: { id: string; name: string; fileName: string }[];
    }[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const folderPath = path.join(modelsDir, entry.name);
      const files = fs
        .readdirSync(folderPath)
        .filter((f) => f.endsWith(".docx"));
      const documents = files.map((fileName) => ({
        id: `${entry.name}-${fileName.replace(".docx", "")}`,
        name: formatName(fileName.replace(".docx", "")),
        fileName,
      }));
      folders.push({
        id: entry.name,
        name: formatName(entry.name),
        documents,
      });
    }

    return NextResponse.json({ folders });
  } catch (error) {
    console.error("Error scanning standard models:", error);
    return NextResponse.json(
      { error: "Failed to scan standard models" },
      { status: 500 }
    );
  }
}

function formatName(slug: string): string {
  return slug
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
