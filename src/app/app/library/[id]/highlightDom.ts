import type { Highlight, HighlightColor } from "@/constants/documentState";

// DOM utilities that translate between react-pdf's text-layer DOM and the
// page-local character offsets we store on the server. Offsets are robust to
// zoom/re-render/scale changes because they're indices into the page's
// concatenated text — not positions or DOM paths.

// Styling note: text-transparent keeps the page-canvas glyphs as the only
// visible text (the text-layer spans are already transparent — the rounded
// background just paints behind them).
const BASE_MARK_CLASS = "rounded-sm text-transparent cursor-pointer";
const HIGHLIGHT_ATTR = "data-highlight-id";

// Per-colour: the translucent paint used on the page, and the saturated dot
// used in the swatch picker. Kept here so adding a colour is a single-file
// change. Tailwind's JIT needs the literal class strings to appear in source,
// so this map doubles as that allow-list.
export const HIGHLIGHT_COLOR_STYLES: Record<
  HighlightColor,
  { paint: string; swatch: string }
> = {
  yellow: { paint: "bg-yellow-300/50", swatch: "bg-yellow-400" },
  green: { paint: "bg-green-300/50", swatch: "bg-green-400" },
  blue: { paint: "bg-blue-300/50", swatch: "bg-blue-400" },
  pink: { paint: "bg-pink-300/50", swatch: "bg-pink-400" },
};

function textLayerOf(pageEl: HTMLElement): HTMLElement | null {
  return pageEl.querySelector<HTMLElement>(".react-pdf__Page__textContent");
}

// Returns the page-wide character index for a (container, offset) pair from a
// Selection/Range. Returns -1 if `container` is not inside this page's text
// layer (e.g. selection slipped onto the canvas or another page).
export function offsetIn(
  pageEl: HTMLElement,
  container: Node,
  offset: number,
): number {
  const root = textLayerOf(pageEl);
  if (!root || !root.contains(container)) return -1;

  // Text-node case — sum lengths of every text node up to `container`, then
  // add `offset` (which is a character index within that text node).
  if (container.nodeType === Node.TEXT_NODE) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let acc = 0;
    let n: Node | null;
    while ((n = walker.nextNode())) {
      if (n === container) return acc + offset;
      acc += (n as Text).length;
    }
    return -1;
  }

  // Element-node case — `offset` is a child index. Sum lengths of text nodes
  // appearing before the offset-th child in document order.
  const child = container.childNodes[offset] ?? null;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let acc = 0;
  let n: Node | null;
  while ((n = walker.nextNode())) {
    if (child && (child === n || child.contains(n))) return acc;
    acc += (n as Text).length;
  }
  return acc;
}

// Wraps the [start, end) range inside the page's text layer with one or more
// `<mark>` elements tagged with the highlight id. Idempotent — pre-existing
// marks for this id are cleared first.
export function paintHighlight(
  pageEl: HTMLElement,
  highlight: Highlight,
): void {
  const root = textLayerOf(pageEl);
  if (!root) return;
  removeHighlightMarks(pageEl, highlight.id);

  // Snapshot text nodes first; the wrap below mutates the tree (splits text
  // nodes), so a live TreeWalker would skip or revisit nodes.
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let n: Node | null;
  while ((n = walker.nextNode())) nodes.push(n as Text);

  let acc = 0;
  for (const node of nodes) {
    const len = node.length;
    const nodeStart = acc;
    const nodeEnd = acc + len;
    acc += len;
    if (nodeEnd <= highlight.start) continue;
    if (nodeStart >= highlight.end) break;
    const a = Math.max(0, highlight.start - nodeStart);
    const b = Math.min(len, highlight.end - nodeStart);
    if (a >= b) continue;
    try {
      const range = document.createRange();
      range.setStart(node, a);
      range.setEnd(node, b);
      const mark = document.createElement("mark");
      mark.setAttribute(HIGHLIGHT_ATTR, highlight.id);
      mark.className = `${HIGHLIGHT_COLOR_STYLES[highlight.color].paint} ${BASE_MARK_CLASS}`;
      range.surroundContents(mark);
    } catch {
      // surroundContents throws if the range crosses an element boundary;
      // can't happen here because we stay inside a single Text node.
    }
  }
}

// Unwraps every mark tagged with the given highlight id within this page.
export function removeHighlightMarks(
  pageEl: HTMLElement,
  highlightId: string,
): void {
  const root = textLayerOf(pageEl);
  if (!root) return;
  const marks = root.querySelectorAll<HTMLElement>(
    `mark[${HIGHLIGHT_ATTR}="${CSS.escape(highlightId)}"]`,
  );
  marks.forEach((mark) => {
    const parent = mark.parentNode;
    if (!parent) return;
    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
    parent.removeChild(mark);
    // Re-merge split text nodes so subsequent offset math is consistent.
    parent.normalize();
  });
}

// Strips every highlight mark from a page — used when repainting in bulk
// (e.g. after a remove) before laying fresh ones down.
export function clearAllHighlights(pageEl: HTMLElement): void {
  const root = textLayerOf(pageEl);
  if (!root) return;
  const marks = root.querySelectorAll<HTMLElement>(`mark[${HIGHLIGHT_ATTR}]`);
  marks.forEach((mark) => {
    const parent = mark.parentNode;
    if (!parent) return;
    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
    parent.removeChild(mark);
    parent.normalize();
  });
}

// Returns the highlight id for a click target if the user clicked on an
// existing highlight mark (or anything nested inside one). `null` otherwise.
export function findHighlightIdAt(target: EventTarget | null): string | null {
  if (!(target instanceof Element)) return null;
  const mark = target.closest<HTMLElement>(`mark[${HIGHLIGHT_ATTR}]`);
  return mark?.getAttribute(HIGHLIGHT_ATTR) ?? null;
}

// Climbs the DOM to find the page wrapper (set by pdfReader.tsx with
// `data-page="N"`). Returns the wrapper + 1-based page number, or null if the
// target isn't inside any page (e.g. clicked on chrome).
export function pageOf(target: Node | null): {
  el: HTMLElement;
  page: number;
} | null {
  let el: Node | null = target;
  while (el) {
    if (el instanceof HTMLElement && el.dataset.page) {
      const page = Number(el.dataset.page);
      if (Number.isFinite(page) && page > 0) return { el, page };
    }
    el = el.parentNode;
  }
  return null;
}

// Returns the on-screen rect of an existing highlight (uses the first mark
// tagged with that id — multi-mark highlights still anchor the popover near
// the start). `null` if no mark with that id is currently in the DOM.
export function highlightRect(
  pageEl: HTMLElement,
  highlightId: string,
): DOMRect | null {
  const root = textLayerOf(pageEl);
  if (!root) return null;
  const mark = root.querySelector<HTMLElement>(
    `mark[${HIGHLIGHT_ATTR}="${CSS.escape(highlightId)}"]`,
  );
  return mark?.getBoundingClientRect() ?? null;
}
