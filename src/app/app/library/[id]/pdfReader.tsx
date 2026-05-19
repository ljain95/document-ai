"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { FileTextIcon } from "lucide-react";
import { ENDPOINTS } from "@/constants/endpoints";
import { loadReactPdf } from "@/lib/pdf";
import { ReaderToolbar } from "./readerToolbar";

// react-pdf is browser-only (PDF.js worker accesses window). Dynamic-import
// keeps SSR happy. loadReactPdf pins the worker URL before the component
// mounts — using import("react-pdf") directly leaves the bad default.
const Document = dynamic(() => loadReactPdf().then((m) => m.Document), {
  ssr: false,
  loading: ReaderFallback,
});
const Page = dynamic(() => loadReactPdf().then((m) => m.Page), {
  ssr: false,
});

function ReaderFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center text-neutral-300">
      <FileTextIcon className="h-16 w-16" strokeWidth={1.2} />
    </div>
  );
}

interface PdfReaderProps {
  id: string;
}

const BASE_WIDTH = 820;
const SCALE_STEP = 0.25;
const MIN_SCALE = 0.5;
const MAX_SCALE = 3;

// Renders a sidebar-style toolbar + a scrollable column of stacked pages.
// The two are flex siblings — the toolbar is sticky/fixed-width and the page
// area takes the rest. Current page is driven by IntersectionObserver on
// each page wrapper so the toolbar mirrors the user's scroll position.
export function PdfReader({ id }: PdfReaderProps) {
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const pageRefs = useRef<Array<HTMLDivElement | null>>([]);
  const src = ENDPOINTS.UPLOADS.FILE(id);

  useEffect(() => {
    if (numPages === 0) return;
    const root = scrollRef.current;
    const visibility = new Map<number, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const n = Number((e.target as HTMLElement).dataset.page);
          visibility.set(n, e.intersectionRatio);
        }
        let bestPage = 1;
        let bestRatio = 0;
        for (const [n, r] of visibility) {
          if (r > bestRatio) {
            bestPage = n;
            bestRatio = r;
          }
        }
        if (bestRatio > 0) setCurrentPage(bestPage);
      },
      { root, threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    pageRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [numPages]);

  function goToPage(n: number) {
    const el = pageRefs.current[n - 1];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <ReaderToolbar
        page={currentPage}
        numPages={numPages}
        scale={scale}
        minScale={MIN_SCALE}
        maxScale={MAX_SCALE}
        onPageChange={goToPage}
        onZoomIn={() =>
          setScale((s) => Math.min(MAX_SCALE, +(s + SCALE_STEP).toFixed(2)))
        }
        onZoomOut={() =>
          setScale((s) => Math.max(MIN_SCALE, +(s - SCALE_STEP).toFixed(2)))
        }
        onResetZoom={() => setScale(1)}
      />
      <main
        ref={scrollRef}
        className="flex-1 overflow-auto bg-neutral-50"
      >
        <div className="flex w-full flex-col items-center gap-4 py-8">
          <Document
            file={src}
            loading={<ReaderFallback />}
            error={<ReaderFallback />}
            onLoadSuccess={({ numPages: n }) => {
              setNumPages(n);
              pageRefs.current = new Array(n).fill(null);
            }}
          >
            {Array.from({ length: numPages }, (_, i) => (
              <div
                key={i + 1}
                ref={(el) => {
                  pageRefs.current[i] = el;
                }}
                data-page={i + 1}
              >
                <Page
                  pageNumber={i + 1}
                  width={BASE_WIDTH * scale}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  className="shadow-[3px_3px_10px_var(--book-shadow)] [--book-shadow:#bbb]"
                  loading={<ReaderFallback />}
                />
              </div>
            ))}
          </Document>
        </div>
      </main>
    </>
  );
}
