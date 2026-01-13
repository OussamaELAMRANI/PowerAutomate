"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { renderAsync } from "docx-preview";
import { cn } from "@/lib/utils";
import {
  FileText,
  Eye,
  Maximize2,
  Minimize2,
  RefreshCw,
  FileCode,
  Globe,
  Loader2,
} from "lucide-react";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import type { GeneratedDocument } from "@/app/actions/send-model-entries";

export interface DocumentPreviewProps {
  documents?: GeneratedDocument[];
  isLoading?: boolean;
  className?: string;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  documents,
  isLoading,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [docId, setDocId] = useState<string | null>(null);
  const [externalLoading, setExternalLoading] = useState(false);
  const [selectedViewerIndex, setSelectedViewerIndex] = useState(0);
  const [selectedDocIndex, setSelectedDocIndex] = useState(0);

  // Get current document
  const currentDocument = documents?.[selectedDocIndex];
  const fileBase64 = currentDocument?.fileBase64;
  const hasDocuments = documents && documents.length > 0;

  // Generate unique document ID
  const generateDocId = useCallback(() => {
    return `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Upload document to temporary API for external viewers
  const uploadForExternalViewer = useCallback(async () => {
    if (!fileBase64) return null;

    setExternalLoading(true);
    try {
      const id = generateDocId();
      const response = await fetch("/api/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64: fileBase64, id }),
      });

      if (response.ok) {
        setDocId(id);
        return id;
      }
    } catch (error) {
      console.error("Failed to upload document for preview:", error);
    } finally {
      setExternalLoading(false);
    }
    return null;
  }, [fileBase64, generateDocId]);

  // Render enhanced docx-preview
  useEffect(() => {
    async function renderPreview() {
      if (fileBase64 && containerRef.current && selectedViewerIndex === 0) {
        try {
          const byteCharacters = atob(fileBase64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], {
            type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          });

          containerRef.current.innerHTML = "";

          await renderAsync(blob, containerRef.current, containerRef.current, {
            className: "docx-enhanced",
            inWrapper: true,
            ignoreWidth: false,
            ignoreHeight: true,
            breakPages: true,
            useBase64URL: true,
            renderHeaders: true,
            renderFooters: true,
            renderFootnotes: true,
            renderEndnotes: true,
          });
        } catch (e) {
          console.error("Preview rendering failed", e);
        }
      }
    }

    renderPreview();
  }, [fileBase64, selectedViewerIndex, selectedDocIndex]);

  // Upload for external viewers when tab changes
  useEffect(() => {
    if (fileBase64 && selectedViewerIndex === 1 && !docId) {
      uploadForExternalViewer();
    }
  }, [fileBase64, selectedViewerIndex, docId, uploadForExternalViewer]);

  // Reset docId when fileBase64 or selectedDocIndex changes
  useEffect(() => {
    setDocId(null);
  }, [fileBase64, selectedDocIndex]);

  // External viewer URLs - memoized to prevent recalculation
  const googleViewerUrl = useMemo(() => {
    if (!docId || typeof window === "undefined") {
      return "";
    }

    const baseUrl = window.location.origin;
    const docUrl = encodeURIComponent(`${baseUrl}/api/preview?id=${docId}`);

    return `https://docs.google.com/viewer?url=${docUrl}&embedded=true`;
  }, [docId]);

  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  const viewerTabs = [
    { name: "Enhanced", icon: FileCode, description: "Local preview" },
    { name: "Google Docs", icon: Globe, description: "Clean view" },
  ];

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-xl bg-gray-50 shadow-inner sm:rounded-2xl overflow-hidden transition-all duration-300",
        isFullscreen && "fixed inset-4 z-50 bg-white shadow-2xl",
        className
      )}
    >
      {/* Backdrop for fullscreen */}
      {isFullscreen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm -z-10"
          onClick={toggleFullscreen}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white/95 backdrop-blur-sm px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20 sm:h-10 sm:w-10 sm:rounded-xl">
            <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900 sm:text-base">
              Document Preview
            </h2>
            <p className="text-xs text-gray-500 hidden sm:block">
              {hasDocuments && documents.length > 1
                ? `${documents.length} documents generated`
                : "Multiple viewing options available"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {fileBase64 && (
            <button
              onClick={() => {
                setDocId(null);
                uploadForExternalViewer();
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors sm:h-9 sm:w-9"
              title="Refresh preview"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={toggleFullscreen}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors sm:h-9 sm:w-9"
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Document Selection Tabs - Only show when multiple documents */}
      {hasDocuments && documents.length > 1 && (
        <div className="flex border-b border-gray-200 bg-linear-to-r from-blue-50 to-indigo-50 px-4 sm:px-6">
          {documents.map((doc, index) => (
            <button
              key={doc.modelId}
              onClick={() => setSelectedDocIndex(index)}
              className={cn(
                "relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all",
                selectedDocIndex === index
                  ? "text-blue-700"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <FileText className="h-4 w-4" />
              <span>{doc.modelName}</span>
              {selectedDocIndex === index && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Tab Navigation */}
      {hasDocuments && (
        <TabGroup
          selectedIndex={selectedViewerIndex}
          onChange={setSelectedViewerIndex}
        >
          <TabList className="flex border-b border-gray-200 bg-white/80 px-2 sm:px-4">
            {viewerTabs.map((tab) => (
              <Tab
                key={tab.name}
                className={({ selected }) =>
                  cn(
                    "relative flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-all outline-none sm:gap-2 sm:px-4 sm:py-3 sm:text-sm",
                    selected
                      ? "text-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  )
                }
              >
                {({ selected }) => (
                  <>
                    <tab.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline">{tab.name}</span>
                    <span className="xs:hidden">{tab.name.split(" ")[0]}</span>
                    {selected && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                    )}
                  </>
                )}
              </Tab>
            ))}
          </TabList>

          <TabPanels className="flex-1 overflow-hidden">
            {/* Enhanced Local Preview - static to preserve rendered content */}
            <TabPanel
              static
              className={cn(
                "h-full overflow-auto focus:outline-none",
                selectedViewerIndex !== 0 && "hidden"
              )}
            >
              <div className="p-3 sm:p-6 min-h-100 sm:min-h-150">
                <div className="mx-auto max-w-4xl">
                  <div
                    ref={containerRef}
                    className={cn(
                      "docx-preview-container rounded-lg bg-white shadow-xl ring-1 ring-gray-200 overflow-hidden transition-opacity duration-300",
                      isLoading && "animate-pulse opacity-50"
                    )}
                  />
                </div>
              </div>
            </TabPanel>

            {/* Google Docs Viewer - static to preserve iframe */}
            <TabPanel
              static
              className={cn(
                "h-full focus:outline-none",
                selectedViewerIndex !== 1 && "hidden"
              )}
            >
              <div className="h-full min-h-100 sm:min-h-150 p-3 sm:p-4">
                {externalLoading ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="h-10 w-10 animate-spin text-blue-500 mx-auto mb-3" />
                      <p className="text-sm text-gray-600">
                        Preparing document for Google Docs viewer...
                      </p>
                    </div>
                  </div>
                ) : docId ? (
                  <iframe
                    src={googleViewerUrl}
                    className="w-full h-full min-h-100 sm:min-h-150 rounded-lg border-0 bg-white shadow-lg"
                    title="Google Docs Preview"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <Globe className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">
                        Unable to load Google Docs viewer
                      </p>
                      <button
                        onClick={uploadForExternalViewer}
                        className="mt-3 text-sm text-blue-600 hover:text-blue-700"
                      >
                        Try again
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </TabPanel>
          </TabPanels>
        </TabGroup>
      )}

      {/* Empty/Loading State (when no file) */}
      {!hasDocuments && (
        <div className="flex-1 p-3 sm:p-6">
          <div className="mx-auto max-w-3xl">
            <div
              className={cn(
                "min-h-100 rounded-xl bg-white p-6 shadow-lg ring-1 ring-gray-100 sm:min-h-150 sm:p-10",
                isLoading && "animate-pulse"
              )}
            >
              {/* Empty State */}
              {!isLoading && (
                <div className="flex h-full min-h-88 flex-col items-center justify-center text-center sm:min-h-125">
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-linear-to-br from-gray-100 to-gray-50 ring-1 ring-gray-200">
                    <FileText className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-800">
                    No Preview Available
                  </h3>
                  <p className="max-w-sm text-sm text-gray-500 leading-relaxed">
                    Fill out the form and click &quot;Generate Document&quot; to
                    see a live preview with multiple viewing options.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    {viewerTabs.map((tab) => (
                      <div
                        key={tab.name}
                        className="flex items-center gap-2 rounded-full bg-gray-50 px-4 py-2 text-xs text-gray-600"
                      >
                        <tab.icon className="h-3.5 w-3.5" />
                        <span>{tab.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Loading State */}
              {isLoading && (
                <div className="flex h-full min-h-88 flex-col items-center justify-center text-center sm:min-h-125">
                  <div className="relative mb-6">
                    <div className="h-20 w-20 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FileText className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-800">
                    Generating Document...
                  </h3>
                  <p className="text-sm text-gray-500">
                    Please wait while we process your template.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Preview Styles */}
      <style jsx global>{`
        .docx-preview-container {
          padding: 2rem;
        }

        .docx-preview-container .docx-wrapper {
          background: white;
          padding: 0;
        }

        .docx-preview-container .docx-wrapper > section.docx {
          box-shadow: none;
          margin: 0;
          padding: 1.5rem;
          min-height: 500px;
        }

        .docx-preview-container article {
          padding: 0;
        }

        @media (min-width: 640px) {
          .docx-preview-container {
            padding: 3rem;
          }

          .docx-preview-container .docx-wrapper > section.docx {
            padding: 2.5rem;
            min-height: 700px;
          }
        }
      `}</style>
    </div>
  );
};

DocumentPreview.displayName = "DocumentPreview";
