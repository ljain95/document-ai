"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { FileTextIcon } from "lucide-react";
import { ENDPOINTS } from "@/constants/endpoints";
import { loadReactPdf } from "@/lib/pdf";
import {
  getDocumentState,
  isGetDocumentStateSuccess,
  setDocumentState,
} from "@/network/documentState";
import {
  CURRENT_PAGE_STATE_KEY,
  type CurrentPageState,
} from "@/constants/documentState";
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

const DESKTOP_WIDTH = 600;
const MOBILE_BREAKPOINT = 768; // matches Tailwind's `md`
const MOBILE_WIDTH_RATIO = 0.9;
const SCALE_STEP = 0.25;
const MIN_SCALE = 0.5;
const MAX_SCALE = 3;
// Debounce window for persisting the current page — long enough that a
// continuous scroll-through doesn't hammer the API, short enough that a quick
// glance still gets saved.
const PAGE_SAVE_DEBOUNCE_MS = 1500;

function readSavedPage(state: unknown): number | null {
  if (!state || typeof state !== "object") return null;
  const page = (state as Partial<CurrentPageState>).page;
  return typeof page === "number" && page > 1 ? Math.floor(page) : null;
}

// Renders a sidebar-style toolbar + a scrollable column of stacked pages.
// The two are flex siblings — the toolbar is sticky/fixed-width and the page
// area takes the rest. Current page is driven by IntersectionObserver on
// each page wrapper so the toolbar mirrors the user's scroll position.
export function PdfReader({ id }: PdfReaderProps) {
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [containerWidth, setContainerWidth] = useState(DESKTOP_WIDTH);
  // Page to resume to after the PDF + saved-state fetch both finish.
  // `null` once consumed (or when there's nothing to resume).
  const [pendingRestore, setPendingRestore] = useState<number | null>(null);
  // Gates the auto-save effect — flipped on once the saved state has been
  // read AND any resume scroll has been applied, so we don't clobber the
  // saved value with `{ page: 1 }` during initial mount.
  const [canSave, setCanSave] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const pageRefs = useRef<Array<HTMLDivElement | null>>([]);
  // Mirrors latest values for the unmount flush — the cleanup runs after
  // React has already torn the render down, so closure-captured state would
  // be stale.
  const latestPageRef = useRef(currentPage);
  const canSaveRef = useRef(canSave);
  const src = ENDPOINTS.UPLOADS.FILE(id);

  useEffect(() => {
    latestPageRef.current = currentPage;
  }, [currentPage]);
  useEffect(() => {
    canSaveRef.current = canSave;
  }, [canSave]);

  // Track the scroll container's width so we can switch the page-render
  // width between a fixed DESKTOP_WIDTH and 90% of the available space on
  // narrow screens.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    setContainerWidth(el.clientWidth);
    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const baseWidth =
    containerWidth < MOBILE_BREAKPOINT
      ? containerWidth * MOBILE_WIDTH_RATIO
      : DESKTOP_WIDTH;
  const pageWidth = baseWidth * scale;

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

  // Fetch the saved "where I left off" page once per document. The result
  // flows through pendingRestore — the actual scroll waits until the PDF
  // reports its page count so pageRefs is populated.
  useEffect(() => {
    let active = true;
    getDocumentState(id, CURRENT_PAGE_STATE_KEY)
      .then((res) => {
        if (!active) return;
        if (isGetDocumentStateSuccess(res)) {
          const saved = readSavedPage(res.state);
          if (saved !== null) {
            setPendingRestore(saved);
            return;
          }
        }
        // Nothing to resume — start tracking changes from page 1.
        setCanSave(true);
      })
      .catch(() => {
        // Read failed; keep saves enabled so we don't lose forward progress.
        if (active) setCanSave(true);
      });
    return () => {
      active = false;
    };
  }, [id]);

  // Apply the resume scroll once both the saved page is known and the PDF
  // has reported its layout. `behavior: auto` makes it feel like an instant
  // "open at the right page" rather than a visible animated scroll.
  useEffect(() => {
    if (pendingRestore === null) return;
    if (numPages === 0) return;
    const target = Math.min(pendingRestore, numPages);
    const el = pageRefs.current[target - 1];
    if (!el) return;
    el.scrollIntoView({ behavior: "auto", block: "start" });
    setPendingRestore(null);
    setCanSave(true);
  }, [pendingRestore, numPages]);

  // Debounced save. Re-runs on every currentPage change; the cleanup clears
  // the pending timer so only the latest value is persisted.
  useEffect(() => {
    if (!canSave) return;
    if (numPages === 0) return;
    const timer = setTimeout(() => {
      const body: CurrentPageState = { page: currentPage };
      setDocumentState(id, CURRENT_PAGE_STATE_KEY, body).catch(() => {
        // Best-effort — the next page change will retry.
      });
    }, PAGE_SAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [id, currentPage, numPages, canSave]);

  // Flush the latest page on unmount / id change so closing the tab right
  // after scrolling doesn't lose the last position to a still-pending timer.
  useEffect(() => {
    return () => {
      if (!canSaveRef.current) return;
      const body: CurrentPageState = { page: latestPageRef.current };
      setDocumentState(id, CURRENT_PAGE_STATE_KEY, body).catch(() => {});
    };
  }, [id]);

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
        <div className="flex w-full flex-col items-center gap-8 py-8">
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
                  width={pageWidth}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  className="shadow-[3px_3px_10px_var(--book-shadow)] [--book-shadow:#bbb] mb-8"
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
