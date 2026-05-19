// GET / PUT /api/uploads/{id}/state/{key} responses.
//
// Discriminated by `error` like the rest of the response DTOs. The success
// shape mirrors PublicDocumentState minus `documentId`/`keyName` (those are
// already in the URL) — the client only needs the stored value and its
// last-updated timestamp.

export type GetDocumentStateErrorCode =
  | "unauthorized"
  | "not_found"
  | "invalid_key";

export interface GetDocumentStateSuccessResponse {
  // `null` means "no row saved yet for this (user, document, key)" — clients
  // treat it as a clean slate. The state field is otherwise free-form JSON.
  state: unknown | null;
  updatedAt: number | null;
}

export interface GetDocumentStateErrorResponse {
  error: GetDocumentStateErrorCode;
}

export type GetDocumentStateResponse =
  | GetDocumentStateSuccessResponse
  | GetDocumentStateErrorResponse;

export type SetDocumentStateErrorCode =
  | "unauthorized"
  | "not_found"
  | "invalid_key"
  | "invalid_json"
  | "too_large";

export interface SetDocumentStateSuccessResponse {
  state: unknown;
  updatedAt: number;
}

export interface SetDocumentStateErrorResponse {
  error: SetDocumentStateErrorCode;
}

export type SetDocumentStateResponse =
  | SetDocumentStateSuccessResponse
  | SetDocumentStateErrorResponse;
