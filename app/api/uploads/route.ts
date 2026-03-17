import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { validateFileName, validateFolderName } from "@/lib/sanitize";

const TEMPLATES_DIR = path.join(process.cwd(), "templates");

/**
 * POST /api/uploads
 * Uploads .docx files to a role or appointment folder.
 * Expects multipart/form-data with:
 *   - category: "roles" | "appointments"
 *   - folderName: the role/appointment name
 *   - files: one or more .docx files
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const category = formData.get("category") as string;
    const folderName = formData.get("folderName") as string;
    const files = formData.getAll("files") as File[];

    // Validate category
    if (!category || !["roles", "appointments", "standard-models"].includes(category)) {
      return NextResponse.json(
        { error: "Category must be 'roles' or 'appointments'" },
        { status: 400 }
      );
    }

    // Validate folder name
    const folderValidation = validateFolderName(folderName);
    if (!folderValidation.valid) {
      return NextResponse.json(
        { error: `Invalid folder name: ${folderValidation.error}` },
        { status: 400 }
      );
    }

    // Validate files
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    const safeFolderName = folderValidation.sanitized!;
    const targetDir = path.join(TEMPLATES_DIR, category, safeFolderName);

    // Verify the resolved path is still inside templates dir (belt-and-suspenders)
    const resolvedTarget = path.resolve(targetDir);
    if (!resolvedTarget.startsWith(path.resolve(TEMPLATES_DIR))) {
      return NextResponse.json(
        { error: "Invalid path detected" },
        { status: 400 }
      );
    }

    // Create directory if needed
    fs.mkdirSync(targetDir, { recursive: true });

    const results: { name: string; status: "ok" | "error"; error?: string }[] = [];

    for (const file of files) {
      // Validate filename
      const nameValidation = validateFileName(file.name);
      if (!nameValidation.valid) {
        results.push({
          name: file.name,
          status: "error",
          error: nameValidation.error,
        });
        continue;
      }

      // Validate size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        results.push({
          name: file.name,
          status: "error",
          error: "File exceeds 10MB limit",
        });
        continue;
      }

      if (file.size === 0) {
        results.push({
          name: file.name,
          status: "error",
          error: "File is empty",
        });
        continue;
      }

      // Validate DOCX magic bytes
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer.slice(0, 4));
      if (
        bytes[0] !== 0x50 ||
        bytes[1] !== 0x4b ||
        bytes[2] !== 0x03 ||
        bytes[3] !== 0x04
      ) {
        results.push({
          name: file.name,
          status: "error",
          error: "Not a valid .docx file",
        });
        continue;
      }

      const safeFileName = nameValidation.sanitized!;
      const filePath = path.join(targetDir, safeFileName);

      // Final path check
      const resolvedFile = path.resolve(filePath);
      if (!resolvedFile.startsWith(path.resolve(TEMPLATES_DIR))) {
        results.push({
          name: file.name,
          status: "error",
          error: "Invalid path detected",
        });
        continue;
      }

      // Write file
      fs.writeFileSync(filePath, Buffer.from(buffer));
      results.push({ name: safeFileName, status: "ok" });
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

/**
 * DELETE /api/uploads
 * Deletes a specific file or an entire folder.
 * Body: { category, folderName, fileName? }
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, folderName, fileName } = body;

    if (!category || !["roles", "appointments", "standard-models"].includes(category)) {
      return NextResponse.json(
        { error: "Invalid category" },
        { status: 400 }
      );
    }

    const folderValidation = validateFolderName(folderName);
    if (!folderValidation.valid) {
      return NextResponse.json(
        { error: `Invalid folder name: ${folderValidation.error}` },
        { status: 400 }
      );
    }

    const safeFolderName = folderValidation.sanitized!;

    if (fileName) {
      // Delete a specific file
      const fileValidation = validateFileName(fileName);
      if (!fileValidation.valid) {
        return NextResponse.json(
          { error: `Invalid file name: ${fileValidation.error}` },
          { status: 400 }
        );
      }
      const filePath = path.join(
        TEMPLATES_DIR,
        category,
        safeFolderName,
        fileValidation.sanitized!
      );

      const resolved = path.resolve(filePath);
      if (!resolved.startsWith(path.resolve(TEMPLATES_DIR))) {
        return NextResponse.json({ error: "Invalid path" }, { status: 400 });
      }

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return NextResponse.json({ message: "File deleted" });
      }
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    } else {
      // Delete entire folder
      const folderPath = path.join(TEMPLATES_DIR, category, safeFolderName);
      const resolved = path.resolve(folderPath);
      if (!resolved.startsWith(path.resolve(TEMPLATES_DIR))) {
        return NextResponse.json({ error: "Invalid path" }, { status: 400 });
      }

      if (fs.existsSync(folderPath)) {
        fs.rmSync(folderPath, { recursive: true, force: true });
        return NextResponse.json({ message: "Folder deleted" });
      }
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Failed to process deletion" },
      { status: 500 }
    );
  }
}
