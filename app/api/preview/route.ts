import { NextRequest, NextResponse } from "next/server";

const documentStore = new Map<
  string,
  { data: Buffer; timestamp: number; contentType: string }
>();

function cleanupOldDocuments() {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  for (const [key, value] of documentStore.entries()) {
    if (value.timestamp < fiveMinutesAgo) {
      documentStore.delete(key);
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { base64, id } = body;

    if (!base64 || !id) {
      return NextResponse.json(
        { error: "Missing base64 or id" },
        { status: 400 }
      );
    }

    cleanupOldDocuments();

    const buffer = Buffer.from(base64, "base64");

    // Store the document
    documentStore.set(id, {
      data: buffer,
      timestamp: Date.now(),
      contentType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Error storing document:", error);
    return NextResponse.json(
      { error: "Failed to store document" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const doc = documentStore.get(id);

    if (!doc) {
      return NextResponse.json(
        { error: "Document not found or expired" },
        { status: 404 }
      );
    }

    // Return the document with proper headers - convert Buffer to Uint8Array
    return new NextResponse(new Uint8Array(doc.data), {
      headers: {
        "Content-Type": doc.contentType,
        "Content-Disposition": `inline; filename="preview-${id}.docx"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error retrieving document:", error);
    return NextResponse.json(
      { error: "Failed to retrieve document" },
      { status: 500 }
    );
  }
}
