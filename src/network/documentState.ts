import { api, type ApiError } from "@/network/core/api";
import { ENDPOINTS } from "@/constants/endpoints";
import type { SetDocumentStateRequest } from "@/@types/request/documentState";
import type {
  GetDocumentStateErrorResponse,
  GetDocumentStateResponse,
  GetDocumentStateSuccessResponse,
  SetDocumentStateErrorResponse,
  SetDocumentStateResponse,
  SetDocumentStateSuccessResponse,
} from "@/@types/response/documentState";

// GET /api/uploads/{id}/state/{key} — read a saved state slot for the
// current user. Typed 401/404 bodies are collapsed back into the success
// union so callers can branch with isGetDocumentStateSuccess instead of
// try/catching; the global 401 handler in core/api.ts will still bounce to
// /login first when the cookie expired.
export async function getDocumentState(
  documentId: string,
  key: string,
): Promise<GetDocumentStateResponse> {
  try {
    const { data } = await api.get<GetDocumentStateSuccessResponse>(
      ENDPOINTS.UPLOADS.STATE(documentId, key),
    );
    return data;
  } catch (err) {
    const payload = (err as ApiError).response?.data as
      | GetDocumentStateErrorResponse
      | undefined;
    if (payload && typeof payload === "object" && "error" in payload) {
      return payload;
    }
    throw err;
  }
}

export function isGetDocumentStateSuccess(
  res: GetDocumentStateResponse,
): res is GetDocumentStateSuccessResponse {
  return !("error" in res);
}

// PUT /api/uploads/{id}/state/{key} — upsert. Pass any JSON-serialisable
// value as `state`; the server stores it verbatim in JSONB and echoes it
// back so the caller can confirm what was persisted.
export async function setDocumentState(
  documentId: string,
  key: string,
  state: unknown,
): Promise<SetDocumentStateResponse> {
  const body: SetDocumentStateRequest = { state };
  try {
    const { data } = await api.put<SetDocumentStateSuccessResponse>(
      ENDPOINTS.UPLOADS.STATE(documentId, key),
      body,
    );
    return data;
  } catch (err) {
    const payload = (err as ApiError).response?.data as
      | SetDocumentStateErrorResponse
      | undefined;
    if (payload && typeof payload === "object" && "error" in payload) {
      return payload;
    }
    throw err;
  }
}

export function isSetDocumentStateSuccess(
  res: SetDocumentStateResponse,
): res is SetDocumentStateSuccessResponse {
  return !("error" in res);
}
