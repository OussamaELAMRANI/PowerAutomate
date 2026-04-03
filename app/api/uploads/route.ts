import { NextRequest, NextResponse } from "next/server";
import { validateFileName, validateFolderName } from "@/lib/sanitize";
import {
  utapi,
  buildPathPrefix,
  listTemplateFiles,
  uploadTemplateFile,
  buildCustomId,
  VALID_CATEGORIES,
} from "@/lib/uploadthing";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const category = formData.get("category") as string;
    const folderName = formData.get("folderName") as string;
    const files = formData.getAll("files") as File[];

    if (!category || !VALID_CATEGORIES.includes(category as never)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    const folderValidation = validateFolderName(folderName);
    if (!folderValidation.valid) {
      return NextResponse.json(
        { error: `Invalid folder name: ${folderValidation.error}` },
        { status: 400 }
      );
    }

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const safeFolderName = folderValidation.sanitized!;
    const results: { name: string; status: "ok" | "error"; error?: string }[] =
      [];

    // Fetch existing files once to check for overwrites
    const existingFiles = await listTemplateFiles();

    for (const file of files) {
      const nameValidation = validateFileName(file.name);
      if (!nameValidation.valid) {
        results.push({ name: file.name, status: "error", error: nameValidation.error });
        continue;
      }

	  // CHECK THE SIZE OF THE UPLOADS
	//   
    //   if (file.size > 10 * 1024 * 1024) {
    //     results.push({ name: file.name, status: "error", error: "File exceeds 10MB limit" });
    //     continue;
    //   }

      if (file.size === 0) {
        results.push({ name: file.name, status: "error", error: "File is empty" });
        continue;
      }

      const buffer = await file.arrayBuffer();

      // Validate DOCX magic bytes (PK zip signature)
      const bytes = new Uint8Array(buffer.slice(0, 4));
      if (
        bytes[0] !== 0x50 ||
        bytes[1] !== 0x4b ||
        bytes[2] !== 0x03 ||
        bytes[3] !== 0x04
      ) {
        results.push({ name: file.name, status: "error", error: "Not a valid .docx file" });
        continue;
      }

      const safeFileName = nameValidation.sanitized!;

      // Delete any "Uploaded" versions of this logical path before re-uploading.
      // We match by prefix (category/folder/filename/) so "Deletion Pending"
      // files are ignored — they already have a stale customId and won't
      // conflict with the fresh timestamped customId we're about to create.
      const prefix = buildPathPrefix(category, safeFolderName, safeFileName);
      const stale = existingFiles.filter((f) => f.customId?.startsWith(prefix));
      if (stale.length > 0) {
        await utapi.deleteFiles(stale.map((f) => f.key));
      }

      const customId = buildCustomId(category, safeFolderName, safeFileName);

      try {
        await uploadTemplateFile(buffer, safeFileName, customId);
        results.push({ name: safeFileName, status: "ok" });
      } catch (err) {
        results.push({
          name: safeFileName,
          status: "error",
          error: err instanceof Error ? err.message : "Upload failed",
        });
      }
    }

    const successCount = results.filter((r) => r.status === "ok").length;
    return NextResponse.json({
      message: `${successCount}/${results.length} files uploaded successfully`,
      results,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to process upload" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, folderName, fileName } = body;

    if (!category || !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    const folderValidation = validateFolderName(folderName);
    if (!folderValidation.valid) {
      return NextResponse.json(
        { error: `Invalid folder name: ${folderValidation.error}` },
        { status: 400 }
      );
    }

    const safeFolderName = folderValidation.sanitized!;

    const allFiles = await listTemplateFiles();

    if (fileName) {
      // Delete a specific file — match all versions by logical path prefix
      const fileValidation = validateFileName(fileName);
      if (!fileValidation.valid) {
        return NextResponse.json(
          { error: `Invalid file name: ${fileValidation.error}` },
          { status: 400 }
        );
      }
      const prefix = buildPathPrefix(category, safeFolderName, fileValidation.sanitized!);
      const targets = allFiles.filter((f) => f.customId?.startsWith(prefix));
      if (targets.length === 0) {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
      }
      await utapi.deleteFiles(targets.map((f) => f.key));
      return NextResponse.json({ message: "File deleted" });
    } else {
      // Delete entire folder: all files whose customId starts with "category/folderName/"
      const prefix = `${category}/${safeFolderName}/`;
      const folderFiles = allFiles.filter((f) => f.customId?.startsWith(prefix));

      if (folderFiles.length === 0) {
        return NextResponse.json({ error: "Folder not found" }, { status: 404 });
      }

      await utapi.deleteFiles(folderFiles.map((f) => f.key));
      return NextResponse.json({ message: "Folder deleted" });
    }
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Failed to process deletion" },
      { status: 500 }
    );
  }
}