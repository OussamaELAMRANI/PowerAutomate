

import React, { useEffect, useRef } from "react";
import { renderAsync } from "docx-preview";

export default function DocxViewer({ fileBuffer } : {fileBuffer:Buffer}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (fileBuffer && containerRef.current) {
      // Clear previous content
      containerRef.current.innerHTML = "";
      
      // Render the DOCX buffer to the div
      renderAsync(fileBuffer, containerRef.current)
        .then(() => console.log("Docx rendered"))
        .catch((err) => console.error("Error rendering docx:", err));
    }
  }, [fileBuffer]);

  return (
    <div 
      ref={containerRef} 
      className="border rounded p-4 bg-white shadow-sm min-h-125 overflow-auto"
    />
  );
}