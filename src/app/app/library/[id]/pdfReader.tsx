"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  DEFAULT_HIGHLIGHT_COLOR,
  HIGHLIGHTS_STATE_KEY,
  HIGHLIGHT_COLOR_IDS,
  type CurrentPageState,
  type Highlight,
  type HighlightColor,
  type HighlightsState,
} from "@/constants/documentState";
import { ReaderToolbar } from "./readerToolbar";
import { HighlightPopover } from "./highlightPopover";
import { CommentGutter } from "./commentGutter";
import { CommentsSheet } from "./commentsSheet";
import {
  clearAllHighlights,
  findHighlightIdAt,
  highlightRect,
  offsetIn,
  pageOf,
  paintHighlight,
} from "./highlightDom";

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
// Highlights save sooner — users expect the toolbar action to feel committed,
// and the payload is small.
const HIGHLIGHTS_SAVE_DEBOUNCE_MS = 600;

// Popover anchor for either an in-flight selection ("create") or a clicked
// existing highlight ("remove"). `rect` is viewport-coord so the popover can
// use position: fixed. The draft on create mode is a colour-less template —
// the colour is chosen by clicking a swatch and gets stamped in commit.
type DraftHighlight = Omit<Highlight, "color">;
type PopoverState =
  | { mode: "create"; rect: DOMRect; draft: DraftHighlight }
  | { mode: "remove"; rect: DOMRect; highlightId: string };

function readSavedPage(state: unknown): number | null {
  if (!state || typeof state !== "object") return null;
  const page = (state as Partial<CurrentPageState>).page;
  return typeof page === "number" && page > 1 ? Math.floor(page) : null;
}

// Defensive: clients should not crash if a future schema change leaves a
// malformed highlight in the JSONB blob. Highlights persisted before the
// colour field was introduced are normalised to DEFAULT_HIGHLIGHT_COLOR.
function readSavedHighlights(state: unknown): Highlight[] {
  if (!state || typeof state !== "object") return [];
  const list = (state as Partial<HighlightsState>).highlights;
  if (!Array.isArray(list)) return [];
  const out: Highlight[] = [];
  for (const raw of list) {
    if (!raw || typeof raw !== "object") continue;
    const h = raw as Partial<Highlight>;
    if (
      typeof h.id !== "string" ||
      typeof h.page !== "number" ||
      typeof h.text !== "string" ||
      typeof h.start !== "number" ||
      typeof h.end !== "number" ||
      h.end <= h.start
    ) {
      continue;
    }
    const color: HighlightColor =
      typeof h.color === "string" &&
      (HIGHLIGHT_COLOR_IDS as readonly string[]).includes(h.color)
        ? (h.color as HighlightColor)
        : DEFAULT_HIGHLIGHT_COLOR;
    out.push({
      id: h.id,
      page: h.page,
      text: h.text,
      start: h.start,
      end: h.end,
      color,
      createdAt: typeof h.createdAt === "number" ? h.createdAt : Date.now(),
    });
  }
  return out;
}

function newHighlightId(): string {
  // crypto.randomUUID is fine for client-side ids; the database doesn't index
  // these (they live inside a JSONB blob).
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `h_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
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
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  // Gates the highlights save effect for the same reason as `canSave` above.
  const [highlightsLoaded, setHighlightsLoaded] = useState(false);
  const [popover, setPopover] = useState<PopoverState | null>(null);
  // ID of the most-recently-focused highlight — drives which CommentCard
  // ring-glows + auto-focuses its textarea. Sticks across scroll/popover
  // dismissal so the user can keep typing; cleared when they engage with a
  // different highlight or remove this one.
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(
    null,
  );
  // Mobile-only: open state for the side-sheet that replaces the inline
  // gutter on narrow screens.
  const [commentsSheetOpen, setCommentsSheetOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const pageRefs = useRef<Array<HTMLDivElement | null>>([]);
  // Tracks which pages have a rendered text layer — repaintAll only touches
  // those, so saved highlights for not-yet-rendered pages quietly wait until
  // their page's onRenderTextLayerSuccess fires.
  const renderedPages = useRef<Set<number>>(new Set());
  // Latest highlight snapshot for callbacks that run outside of React's
  // render cycle (selectionchange listener, text-layer render callback).
  const highlightsRef = useRef<Highlight[]>(highlights);
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
  useEffect(() => {
    highlightsRef.current = highlights;
  }, [highlights]);

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

  // Fetch saved highlights for this document once.
  useEffect(() => {
    let active = true;
    getDocumentState(id, HIGHLIGHTS_STATE_KEY)
      .then((res) => {
        if (!active) return;
        if (isGetDocumentStateSuccess(res)) {
          setHighlights(readSavedHighlights(res.state));
        }
        setHighlightsLoaded(true);
      })
      .catch(() => {
        if (active) setHighlightsLoaded(true);
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

  // Debounced save for highlights. Suppressed until we've loaded the initial
  // set so a fresh document doesn't immediately PUT `{ highlights: [] }` on
  // top of whatever was there.
  useEffect(() => {
    if (!highlightsLoaded) return;
    const timer = setTimeout(() => {
      const body: HighlightsState = { highlights };
      setDocumentState(id, HIGHLIGHTS_STATE_KEY, body).catch(() => {});
    }, HIGHLIGHTS_SAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [id, highlights, highlightsLoaded]);

  // Flush the latest page on unmount / id change so closing the tab right
  // after scrolling doesn't lose the last position to a still-pending timer.
  useEffect(() => {
    return () => {
      if (!canSaveRef.current) return;
      const body: CurrentPageState = { page: latestPageRef.current };
      setDocumentState(id, CURRENT_PAGE_STATE_KEY, body).catch(() => {});
    };
  }, [id]);

  // Repaint one page's highlights from scratch — clear all marks, then apply
  // every highlight that targets this page. Used whenever the highlights
  // array changes for an already-rendered page.
  const repaintPage = useCallback(
    (page: number) => {
      const el = pageRefs.current[page - 1];
      if (!el) return;
      clearAllHighlights(el);
      for (const h of highlightsRef.current) {
        if (h.page === page) paintHighlight(el, h);
      }
    },
    [],
  );

  // Stable per-page text-layer-success handlers, cached by pageNumber. Why
  // this matters: react-pdf's TextLayer puts `onRenderTextLayerSuccess` in
  // its useLayoutEffect dep array — passing a fresh arrow function on every
  // render makes it wipe and re-render the entire text layer, which kills
  // any in-flight Range and produces a visible flicker during selection.
  const textLayerHandlers = useRef<Map<number, () => void>>(new Map());
  const getTextLayerHandler = useCallback(
    (pageNumber: number) => {
      const cached = textLayerHandlers.current.get(pageNumber);
      if (cached) return cached;
      const handler = () => {
        renderedPages.current.add(pageNumber);
        repaintPage(pageNumber);
      };
      textLayerHandlers.current.set(pageNumber, handler);
      return handler;
    },
    [repaintPage],
  );

  // Stable Document onLoadSuccess — same flicker concern applies at the
  // Document level (Page mount depends on `pdf`, which Document re-resolves
  // when props churn).
  const handleDocumentLoadSuccess = useCallback(
    ({ numPages: n }: { numPages: number }) => {
      setNumPages(n);
      pageRefs.current = new Array(n).fill(null);
      renderedPages.current = new Set();
      textLayerHandlers.current = new Map();
    },
    [],
  );

  // Reuse the same React element for every <Page loading=...> slot so the
  // loading prop's identity doesn't change between renders.
  const pageFallback = useMemo(() => <ReaderFallback />, []);

  // When the highlights set changes, repaint every page that has already had
  // its text layer rendered. Pages that haven't rendered yet will pick up
  // their highlights in onRenderTextLayerSuccess below.
  useEffect(() => {
    for (const page of renderedPages.current) {
      repaintPage(page);
    }
  }, [highlights, repaintPage]);

  // Selection -> popover. Runs on every selectionchange (cheap — bails out
  // immediately if the selection is collapsed or outside a page).
  useEffect(() => {
    function handle() {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
        // Only auto-dismiss the popover for the create flow; the remove
        // popover is anchored to a clicked highlight, not a live selection.
        setPopover((p) => (p && p.mode === "create" ? null : p));
        return;
      }
      const range = sel.getRangeAt(0);
      const startInfo = pageOf(range.startContainer);
      const endInfo = pageOf(range.endContainer);
      if (!startInfo || !endInfo) return;
      // Cross-page selections aren't supported — we'd need to split into per-
      // page highlights and the UX value is marginal.
      if (startInfo.page !== endInfo.page) return;

      const pageEl = startInfo.el;
      const start = offsetIn(pageEl, range.startContainer, range.startOffset);
      const end = offsetIn(pageEl, range.endContainer, range.endOffset);
      if (start < 0 || end < 0 || end <= start) return;

      const text = sel.toString();
      if (!text.trim()) return;

      const draft: DraftHighlight = {
        id: newHighlightId(),
        page: startInfo.page,
        text,
        start,
        end,
        createdAt: Date.now(),
      };
      setPopover({
        mode: "create",
        rect: range.getBoundingClientRect(),
        draft,
      });
    }
    document.addEventListener("selectionchange", handle);
    return () => document.removeEventListener("selectionchange", handle);
  }, []);

  // Click on an existing highlight -> "remove" popover. Wired on the scroll
  // container so it catches clicks on any page's marks.
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    function onClick(e: MouseEvent) {
      const highlightId = findHighlightIdAt(e.target);
      if (!highlightId) return;
      const pageInfo = pageOf(e.target as Node | null);
      if (!pageInfo) return;
      const rect =
        highlightRect(pageInfo.el, highlightId) ??
        (e.target as HTMLElement).getBoundingClientRect();
      setPopover({ mode: "remove", rect, highlightId });
      setActiveHighlightId(highlightId);
    }
    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
  }, []);

  // Dismiss the popover on scroll — the anchor rect would otherwise drift
  // out from under it. (Selecting again or clicking the highlight re-opens.)
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    function onScroll() {
      setPopover(null);
    }
    root.addEventListener("scroll", onScroll, { passive: true });
    return () => root.removeEventListener("scroll", onScroll);
  }, []);

  // Colour click in "create" mode: stamp the colour onto the draft and add it.
  // Colour click in "remove" mode: recolour the existing highlight in place
  // (keeps the popover open so the user can keep tweaking).
  function handleSelectColor(color: HighlightColor) {
    if (!popover) return;
    if (popover.mode === "create") {
      const draft: Highlight = { ...popover.draft, color };
      setHighlights((prev) => [...prev, draft]);
      // Surface the new (empty) comment card so the user can type a note
      // immediately — matches the "you just made a thing, here's where it
      // lives" pattern from Google Docs.
      setActiveHighlightId(draft.id);
      setPopover(null);
      window.getSelection()?.removeAllRanges();
    } else {
      const targetId = popover.highlightId;
      setHighlights((prev) =>
        prev.map((h) => (h.id === targetId ? { ...h, color } : h)),
      );
    }
  }

  function handleRemoveHighlight() {
    if (!popover || popover.mode !== "remove") return;
    const targetId = popover.highlightId;
    setHighlights((prev) => prev.filter((h) => h.id !== targetId));
    setPopover(null);
    setActiveHighlightId((id) => (id === targetId ? null : id));
  }

  function handleCommentChange(highlightId: string, comment: string) {
    setHighlights((prev) =>
      prev.map((h) => (h.id === highlightId ? { ...h, comment } : h)),
    );
  }

  // Mirror of handleRemoveHighlight for the X button inside a CommentCard.
  function handleRemoveFromGutter(highlightId: string) {
    setHighlights((prev) => prev.filter((h) => h.id !== highlightId));
    setActiveHighlightId((id) => (id === highlightId ? null : id));
    setPopover((p) =>
      p && p.mode === "remove" && p.highlightId === highlightId ? null : p,
    );
  }

  // Colour to render the "active" ring around in remove mode. Looked up from
  // the current highlights array via the popover's highlightId.
  const activeColor: HighlightColor | undefined =
    popover?.mode === "remove"
      ? highlights.find((h) => h.id === popover.highlightId)?.color
      : undefined;

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
        onOpenComments={() => setCommentsSheetOpen(true)}
      />
      <main
        ref={scrollRef}
        className="flex-1 overflow-auto bg-neutral-50"
      >
        <div className="flex w-full flex-col items-center gap-8 py-8">
          <Document
            file={src}
            loading={pageFallback}
            error={pageFallback}
            onLoadSuccess={handleDocumentLoadSuccess}
          >
            {Array.from({ length: numPages }, (_, i) => {
              const pageNumber = i + 1;
              return (
                <div
                  key={pageNumber}
                  ref={(el) => {
                    pageRefs.current[i] = el;
                  }}
                  data-page={pageNumber}
                  // `relative` is the anchor for the absolutely-positioned
                  // CommentGutter — keeps the Page centred in the scroll
                  // area while the gutter floats to its right.
                  className="relative"
                >
                  <Page
                    pageNumber={pageNumber}
                    width={pageWidth}
                    renderTextLayer
                    renderAnnotationLayer={false}
                    className="shadow-[3px_3px_10px_var(--book-shadow)] [--book-shadow:#bbb] mb-8"
                    loading={pageFallback}
                    onRenderTextLayerSuccess={getTextLayerHandler(pageNumber)}
                  />
                  <div className="absolute right-full top-0 mr-6 hidden md:block">
                    <CommentGutter
                      pageNumber={pageNumber}
                      highlights={highlights}
                      activeHighlightId={activeHighlightId}
                      onCommentChange={handleCommentChange}
                      onRemove={handleRemoveFromGutter}
                    />
                  </div>
                </div>
              );
            })}
          </Document>
        </div>
      </main>
      {popover && (
        <HighlightPopover
          anchor={popover.rect}
          mode={popover.mode}
          activeColor={activeColor}
          onSelectColor={handleSelectColor}
          onRemove={
            popover.mode === "remove" ? handleRemoveHighlight : undefined
          }
        />
      )}
      <CommentsSheet
        open={commentsSheetOpen}
        onOpenChange={setCommentsSheetOpen}
        highlights={highlights}
        onJumpToPage={goToPage}
        onCommentChange={handleCommentChange}
        onRemove={handleRemoveFromGutter}
      />
    </>
  );
}
