// PUT /api/uploads/{id}/state/{key} — body. `state` is any JSON-serialisable
// value; the column is JSONB so the shape is up to the caller.
export interface SetDocumentStateRequest {
  state: unknown;
}
