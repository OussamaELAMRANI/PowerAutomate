"use server";

import { TemplateData, TemplateHandler } from "easy-template-x";
import { readFile } from "node:fs/promises";
import path from "node:path";

export type GenerateState = {
  success: boolean;
  fileBase64?: string;
  error?: string;
  timestamp?: string | number;
};

export async function generateDocument(
  prevState: GenerateState,
  formData: FormData
): Promise<GenerateState> {
  try {
    // 1. Extract data from FormData
    const name = formData.get("name") as string;
    const ceo = formData.get("ceo_name") as string;
    const releasedBy = formData.get("releasedBy") as string;
    const date = formData.get("doc_date") as string;
    const logoFile = formData.get("logo") as File;

    // 2. Load the DOCX Template
    // In Next.js, we resolve the path relative to the project root
    const templatePath = path.join(process.cwd(), "templates", "model_1.docx");
    const templateBuffer = await readFile(templatePath);
    console.log(templatePath);
    // 3. Prepare Image Data (if uploaded)
    let logoData = null;
    if (logoFile && logoFile.size > 0) {
      const arrayBuffer = await logoFile.arrayBuffer();
      logoData = Buffer.from(arrayBuffer); // Convert to Node Buffer
    }

    // 4. Data Object for Replacement
    // Keys match the {placeholder} in your DOCX
    const data: TemplateData = {
      name,
      ceo,
      releasedBy,
      date,
      logo: logoData
        ? {
            _type: "image",
            source: logoData,
            format: logoFile.type,
            height:100,
            weight:100,
            align:"right"
          }
        : "",
    };

    // 5. Process the Template
    const handler = new TemplateHandler();
    const docBlob = await handler.process(templateBuffer, data);

    // 6. Convert result to Base64 to send back to client
    // easy-template-x returns a Blob, we convert it to Buffer then Base64
    const buffer = Buffer.from(docBlob);
    const base64 = buffer.toString("base64");

    return {
      success: true,
      fileBase64: base64,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error("Error generating doc:", error);
    return { success: false, error: "Failed to generate document" };
  }
}
