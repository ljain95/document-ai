// Shared between client-side `accept` attribute, client-side pre-check,
// and server-side validation in /api/uploads. Single source of truth.

// Mirrors the Postgres `doc_type` enum from V004. Order here is the order
// shown in the dropdown — OTHER goes last as the catch-all.
export const DOC_TYPES = [
  "NOVEL",
  "RESEARCH_PAPER",
  "PRESENTATION",
  "TEXTBOOK",
  "ARTICLE",
  "REPORT",
  "OTHER",
] as const;
export type DocType = (typeof DOC_TYPES)[number];

// Mirrors the Postgres `user_upload_role` enum from V004.
export const USER_UPLOAD_ROLES = ["OWNER", "EDITOR", "VIEWER"] as const;
export type UserUploadRole = (typeof USER_UPLOAD_ROLES)[number];

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20 MB

// Server caps a single list page at this size. The +1 fetch trick (peek one
// extra to know whether more exist) means each call returns at most
// UPLOADS_PAGE_SIZE rows even if the DB has more.
export const UPLOADS_PAGE_SIZE = 20;

export const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".md"] as const;
export type AllowedExtension = (typeof ALLOWED_EXTENSIONS)[number];

// Browsers don't always set a reliable MIME for .md (commonly text/plain or
// empty), so we validate by extension and accept the MIME the browser sends.
// PDF and DOCX MIMEs are stable enough to also check.
export const ALLOWED_MIMES: Record<AllowedExtension, readonly string[]> = {
  ".pdf": ["application/pdf"],
  ".docx": [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  ".md": ["text/markdown", "text/x-markdown", "text/plain", ""],
} as const;

// `accept` attribute for <input type="file">. Both the extension list and
// MIME list raise the OS picker's confidence on each platform.
export const FILE_INPUT_ACCEPT = [
  ...ALLOWED_EXTENSIONS,
  ...Object.values(ALLOWED_MIMES).flat().filter(Boolean),
].join(",");
