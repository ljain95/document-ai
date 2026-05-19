import type { documentState } from "@/lib/schema";

// Canonical DB types for the `document_state` table. Mirrors
// V005__create_document_state.sql via drizzle inference; do not redeclare
// these in route handlers.

export type DocumentStateRow = typeof documentState.$inferSelect;
export type NewDocumentState = typeof documentState.$inferInsert;

// Shape returned to the client. Drops id / deleted / attrs / user_id since
// the caller already knows who they are and which document they asked for.
export type PublicDocumentState = Pick<
  DocumentStateRow,
  "documentId" | "keyName" | "state" | "updatedAt"
>;
