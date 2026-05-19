"use client";

import { useEffect, useState } from "react";
import { loadReactPdf } from "@/lib/pdf";

type ReactPdfModule = Awaited<ReturnType<typeof loadReactPdf>>;

interface PdfPreviewProps {
  src: string;
  width: number;
  fallback?: React.ReactNode;
}

// Renders the first page of a PDF at `width` pixels wide. Text and annotation
// layers are off — we're showing a tiny thumbnail, not a readable surface.
// Container should be `overflow-hidden`; A4 portrait at this width is taller
// than a 3/4 card and will get cropped at the bottom (top of page wins).
export function PdfPreview({ src, width, fallback }: PdfPreviewProps) {
  const [mod, setMod] = useState<ReactPdfModule | null>(null);

  useEffect(() => {
    let active = true;
    loadReactPdf().then((m) => {
      if (active) setMod(m);
    });
    return () => {
      active = false;
    };
  }, []);

  if (!mod) return <>{fallback ?? null}</>;

  const { Document, Page } = mod;
  return (
    <Document file={src} loading={fallback ?? null} error={fallback ?? null}>
      <Page
        pageNumber={1}
        width={width}
        renderTextLayer={false}
        renderAnnotationLayer={false}
        loading={fallback ?? null}
      />
    </Document>
  );
}
