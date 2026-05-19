import type { DocType } from "@/constants/uploads";

// Multipart form fields posted to /api/uploads. Used by the network wrapper
// when packing FormData, and by the route handler when reading it back.
export interface CreateUploadInput {
  name: string;
  type: DocType;
  file: File;
}

// Query params for GET /api/uploads. Cursor is the id of the last item from
// the previous page; absent on the first page.
export interface ListUploadsQuery {
  cursor?: string;
}
