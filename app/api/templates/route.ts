import { NextResponse } from "next/server";
import { listTemplateFiles, parseCustomId } from "@/lib/uploadthing";

interface ScannedDoc {
  id: string;
  name: string;
  fileName: string;
}

interface ScannedFolder {
  id: string;
  name: string;
  documents: ScannedDoc[];
}

export async function GET() {
  try {
    const files = await listTemplateFiles();

    const folderMap = new Map<string, ScannedFolder>();

    for (const file of files) {
      const parsed = parseCustomId(file.customId);
      if (!parsed) continue;
      if (parsed.category !== "roles" && parsed.category !== "appointments") continue;

      const mapKey = `${parsed.category}/${parsed.folderName}`;

      // Ensure the folder entry exists (even for .folder placeholders)
      if (!folderMap.has(mapKey)) {
        folderMap.set(mapKey, {
          id: parsed.folderName,
          name: formatName(parsed.folderName),
          documents: [],
        });
      }

      if (parsed.fileName === ".folder") continue;
      if (!parsed.fileName.endsWith(".docx")) continue;

      folderMap.get(mapKey)!.documents.push({
        id: `${parsed.folderName}-${parsed.fileName.replace(".docx", "")}`,
        name: formatName(parsed.fileName.replace(".docx", "")),
        fileName: parsed.fileName,
      });
    }

    const roles: ScannedFolder[] = [];
    const appointments: ScannedFolder[] = [];

    for (const [key, folder] of folderMap) {
      const category = key.split("/")[0];
      if (category === "roles") roles.push(folder);
      else appointments.push(folder);
    }

    roles.sort((a, b) => a.name.localeCompare(b.name));
    appointments.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ roles, appointments });
  } catch (error) {
    console.error("Error listing templates:", error);
    return NextResponse.json(
      { error: "Failed to list templates" },
      { status: 500 }
    );
  }
}

function formatName(slug: string): string {
  return slug
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}