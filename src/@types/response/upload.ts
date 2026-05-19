import type { PublicUpload } from "@/@types/database/uploads";

// Discriminated like AuthResponse: success carries `upload`, failure carries `error`.
export type UploadErrorCode =
  | "invalid_json"
  | "unauthorized"
  | "invalid_name"
  | "invalid_type"
  | "missing_file"
  | "unsupported_type"
  | "file_too_large"
  | "network_error";

export interface UploadSuccessResponse {
  upload: PublicUpload;
}

export interface UploadErrorResponse {
  error: UploadErrorCode;
}

export type UploadResponse = UploadSuccessResponse | UploadErrorResponse;

// GET /api/uploads — cursor pagination over the user's accessible uploads.
// nextCursor is the id to pass back as ?cursor= for the next page, or null
// when there are no more rows.
export type ListUploadsErrorCode = "unauthorized" | "network_error";

export interface ListUploadsSuccessResponse {
  uploads: PublicUpload[];
  nextCursor: string | null;
}

export interface ListUploadsErrorResponse {
  error: ListUploadsErrorCode;
}

export type ListUploadsResponse =
  | ListUploadsSuccessResponse
  | ListUploadsErrorResponse;

// GET /api/uploads/{id} — metadata for a single upload. Access-checked via
// user_uploads; not_found covers both "no such upload" and "not accessible
// by this user" so we don't leak existence to non-owners.
export type GetUploadErrorCode = "unauthorized" | "not_found";

export interface GetUploadSuccessResponse {
  upload: PublicUpload;
}

export interface GetUploadErrorResponse {
  error: GetUploadErrorCode;
}

export type GetUploadResponse =
  | GetUploadSuccessResponse
  | GetUploadErrorResponse;
