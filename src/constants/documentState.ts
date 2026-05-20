// Validation rules for state slots. Keys live in the URL, so they must be
// URL-safe and not absurdly long; the value is JSONB-bounded to keep one
// runaway "save" from filling the row.

export const STATE_KEY_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;
export const MAX_STATE_KEY_LENGTH = 64;
export const MAX_STATE_BYTES = 256 * 1024; // 256 KB serialized JSON

// Reserved key for the reader's "where I left off" page. Kept here so every
// reader/consumer hits the same slot in document_state.
export const CURRENT_PAGE_STATE_KEY = "current_page";

export interface CurrentPageState {
  page: number;
}

// Reserved key for a document's saved highlights. Stored as a single JSONB
// blob — the array fits comfortably under MAX_STATE_BYTES (256 KB) even for
// hundreds of highlights and avoids a per-highlight round-trip.
export const HIGHLIGHTS_STATE_KEY = "highlights";

// Stable identifiers persisted on each highlight. Adding a colour here is a
// breaking change for older saved highlights — keep the list append-only and
// fall back to DEFAULT_HIGHLIGHT_COLOR on read for forward compatibility.
export const HIGHLIGHT_COLOR_IDS = [
  "yellow",
  "green",
  "blue",
  "pink",
] as const;
export type HighlightColor = (typeof HIGHLIGHT_COLOR_IDS)[number];
export const DEFAULT_HIGHLIGHT_COLOR: HighlightColor = "yellow";

// A persisted highlight. `start`/`end` are character offsets into the page's
// concatenated text-layer content; storing offsets (instead of DOM paths or
// pixel rects) makes the highlight stable across zoom changes and re-renders.
export interface Highlight {
  id: string;
  page: number;
  text: string;
  start: number;
  end: number;
  color: HighlightColor;
  // Optional user-authored note. Empty string and missing are equivalent —
  // the gutter only shows non-empty cards.
  comment?: string;
  createdAt: number;
}

export interface HighlightsState {
  highlights: Highlight[];
}
