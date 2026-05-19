import type { uploads } from "@/lib/schema";

export type UploadRow = typeof uploads.$inferSelect;
export type NewUpload = typeof uploads.$inferInsert;

// Shape returned to the client. Hides owner_id, deleted, attrs.
export type PublicUpload = Pick<
  UploadRow,
  "id" | "name" | "filename" | "mimeType" | "sizeBytes" | "createdAt" | "type"
>;
