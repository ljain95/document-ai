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
