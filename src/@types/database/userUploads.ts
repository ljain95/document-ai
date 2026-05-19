import type { userUploads } from "@/lib/schema";

export type UserUploadRow = typeof userUploads.$inferSelect;
export type NewUserUpload = typeof userUploads.$inferInsert;
