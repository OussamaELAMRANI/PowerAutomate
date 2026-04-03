import { NextRequest, NextResponse } from "next/server";
import { validateFolderName } from "@/lib/sanitize";
import {
  utapi,
  buildCustomId,
  listTemplateFiles,
  VALID_CATEGORIES,
} from "@/lib/uploadthing";

import { UTFile } from "uploadthing/server";

export async function POST(request: NextRequest) {
  try {
    const { category, folderName } = await request.json();

    if (!category || !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: "Category must be 'roles', 'appointments', or 'standard-models'" },
        { status: 400 }
      );
    }

    const validation = validateFolderName(folderName);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const safeName = validation.sanitized!;
    const prefix = `${category}/${safeName}/`;

    // Check if folder already exists (has any files or placeholder)
    const allFiles = await listTemplateFiles();
    const exists = allFiles.some((f) => f.customId?.startsWith(prefix));
    if (exists) {
      return NextResponse.json(
        { error: "A folder with this name already exists" },
        { status: 409 }
      );
    }

    // Upload a tiny placeholder to mark the folder as existing
    const customId = buildCustomId(category, safeName, ".folder");
    const placeholder = new UTFile([" "], ".folder", {
      type: "text/plain",
      customId,
    });

    const result = await utapi.uploadFiles(placeholder);
    if (result.error) {
      return NextResponse.json({ error: "Failed to create folder" }, { status: 500 });
    }

    return NextResponse.json({
      message: `Folder "${folderName}" created successfully`,
      id: safeName,
    });
  } catch (error) {
    console.error("Create folder error:", error);
    return NextResponse.json(
      { error: "Failed to create folder" },
      { status: 500 }
    );
  }
}