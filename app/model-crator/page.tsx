"use client"
import React, { useActionState, useEffect, useRef } from "react";
import { renderAsync } from 'docx-preview';
import { generateDocument, GenerateState } from "../actions/send-model-entries";

const initialState: GenerateState = {
  success: false,       // We haven't generated anything yet
  fileBase64: undefined, // No file exists yet
  error: undefined,      // No errors yet
};

export default function ModelCratorPage() {
  const [state, formAction, isPending] = useActionState(
    generateDocument,
    initialState
  );
  const previewContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function renderPreview() {
      if (state.success && state.fileBase64 && previewContainerRef.current) {
        try {
          // Convert Base64 back to Blob
          const byteCharacters = atob(state.fileBase64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], {
            type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          });

          // Clear previous content
          previewContainerRef.current.innerHTML = "";

          // Render via docx-preview
          await renderAsync(
            blob,
            previewContainerRef.current,
            previewContainerRef.current,
            {
              className: "docx",
              inWrapper: false,
              ignoreWidth: false,
            }
          );
        } catch (e) {
          console.error("Preview rendering failed", e);
        }
      }
    }

    renderPreview();
  }, [state]); // Re
  return (
    <main className="min-h-screen p-8 bg-gray-50 flex flex-col md:flex-row gap-8">
      {/* Input Form */}
      <div className="w-full md:w-1/3 bg-white p-6 rounded-xl shadow-sm h-fit">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">
          Document Generator
        </h1>

        {/* We use formAction here, provided by the hook */}
        <form action={formAction} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Company Name
            </label>
            <input
              name="name"
              type="text"
              placeholder="Acme Corp"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              CEO Name
            </label>
            <input
              name="ceo"
              type="text"
              placeholder="John Doe"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Released By
            </label>
            <input
              name="releasedBy"
              type="text"
              placeholder="HR Department"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Date
            </label>
            <input
              name="date"
              type="date"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Logo
            </label>
            {/* Note: Alt Text in your DOCX for this image must match {logo} */}
            <input
              name="logo"
              type="file"
              accept="image/*"
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {state.error && (
            <div className="text-red-500 text-sm p-2 bg-red-50 rounded">
              {state.error}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
          >
            {isPending ? "Processing..." : "Generate Preview"}
          </button>
        </form>
      </div>

      {/* Preview Area */}
      <div className="w-full md:w-2/3 bg-gray-200 p-4 rounded-xl shadow-inner overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-700">
            Live Document Preview
          </h2>
        </div>

        <div className="flex-1 overflow-auto bg-gray-200 flex justify-center">
          <div
            ref={previewContainerRef}
            className="bg-white shadow-lg min-h-[800px] w-full max-w-[800px] p-8 origin-top scale-95"
          >
            {/* Empty State */}
            {!state.success && (
              <div className="text-center text-gray-400 mt-20">
                Fill the form and click Generate Preview to render the DOCX.
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
