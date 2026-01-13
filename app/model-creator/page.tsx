"use client";

import React, {
  useActionState,
  useTransition,
  useState,
  useCallback,
} from "react";
import { generateDocument, GenerateState } from "../actions/send-model-entries";
import { Navbar, Footer } from "@/components/layout";
import { DocumentForm, DocumentPreview } from "@/components/document";

const initialState: GenerateState = {
  success: false,
  documents: undefined,
  error: undefined,
};

export default function ModelCreatorPage() {
  const [state, formAction] = useActionState(generateDocument, initialState);
  const [isPending, startTransition] = useTransition();
  const [resetKey, setResetKey] = useState(0);
  const [isReset, setIsReset] = useState(false);

  const handleFormSubmit = (formData: FormData) => {
    setIsReset(false);
    startTransition(() => {
      formAction(formData);
    });
  };

  const handleReset = useCallback(() => {
    setResetKey((prev) => prev + 1);
    setIsReset(true);
  }, []);

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-blue-50">
      <Navbar />

      <main className="pt-20 pb-8 px-4 sm:pt-24 sm:pb-12">
        <div className="mx-auto max-w-7xl">
          {/* Page Header */}
          <div className="mb-6 text-center sm:mb-8">
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl lg:text-4xl">
              Document Creator
            </h1>
            <p className="mt-2 text-sm text-gray-600 sm:text-base lg:text-lg">
              Select templates, fill in your details, and generate your
              documents
            </p>
          </div>

          {/* Main Content - Responsive Grid */}
          <div className="grid gap-6 lg:grid-cols-[380px_1fr] xl:grid-cols-[420px_1fr] lg:gap-8">
            {/* Form Section */}
            <div className="order-1 lg:order-0">
              <DocumentForm
                key={resetKey}
                onSubmit={handleFormSubmit}
                onReset={handleReset}
                isPending={isPending}
                hasDocument={!isReset && state.success}
                documents={!isReset ? state.documents : undefined}
                error={!isReset ? state.error : undefined}
              />
            </div>

            {/* Preview Section */}
            <div className="order-2 lg:order-0 min-h-125 sm:min-h-150 lg:min-h-200">
              <DocumentPreview
                documents={
                  !isReset && state.success ? state.documents : undefined
                }
                isLoading={isPending}
                className="h-full"
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
