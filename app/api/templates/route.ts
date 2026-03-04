import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

/**
 * Scans the templates directory to dynamically discover
 * all role and appointment documents from the filesystem.
 */
export async function GET() {
  try {
    const templatesDir = path.join(process.cwd(), "templates");

    const roles = scanCategory(path.join(templatesDir, "roles"));
    const appointments = scanCategory(path.join(templatesDir, "appointments"));

    return NextResponse.json({ roles, appointments });
  } catch (error) {
    console.error("Error scanning templates:", error);
    return NextResponse.json(
      { error: "Failed to scan templates" },
      { status: 500 }
    );
  }
}

interface ScannedDoc {
  id: string;
  name: string;
  fileName: string;
}

interface ScannedCategory {
  id: string;
  name: string;
  documents: ScannedDoc[];
}

function scanCategory(categoryDir: string): ScannedCategory[] {
  if (!fs.existsSync(categoryDir)) return [];

  const entries = fs.readdirSync(categoryDir, { withFileTypes: true });
  const results: ScannedCategory[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const folderPath = path.join(categoryDir, entry.name);
    const docs = scanDocuments(folderPath, entry.name);

    results.push({
      id: entry.name,
      name: formatName(entry.name),
      documents: docs,
    });
  }

  return results;
}

function scanDocuments(dir: string, parentId: string): ScannedDoc[] {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".docx"));
  return files.map((fileName) => ({
    id: `${parentId}-${fileName.replace(".docx", "")}`,
    name: formatName(fileName.replace(".docx", "")),
    fileName,
  }));
}

function formatName(slug: string): string {
  return slug
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
