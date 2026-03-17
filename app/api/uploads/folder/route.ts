import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { validateFolderName } from "@/lib/sanitize";

const TEMPLATES_DIR = path.join(process.cwd(), "templates");

/**
 * POST /api/uploads/folder
 * Creates an empty folder under roles or appointments.
 */
export async function POST(request: NextRequest) {
  try {
    const { category, folderName } = await request.json();

    if (!category || !["roles", "appointments", "standard-models"].includes(category)) {
      return NextResponse.json(
        { error: "Category must be 'roles' or 'appointments'" },
        { status: 400 }
      );
    }

    const validation = validateFolderName(folderName);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const safeName = validation.sanitized!;
    const targetDir = path.join(TEMPLATES_DIR, category, safeName);

    // Path traversal check
    const resolved = path.resolve(targetDir);
    if (!resolved.startsWith(path.resolve(TEMPLATES_DIR))) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    if (fs.existsSync(targetDir)) {
      return NextResponse.json(
        { error: "A folder with this name already exists" },
        { status: 409 }
      );
    }

    fs.mkdirSync(targetDir, { recursive: true });

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
