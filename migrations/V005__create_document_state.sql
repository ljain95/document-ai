BEGIN;

-- Per-user, per-document state bag. One row stores one (user, document, key)
-- slot — different keys (e.g. "highlights", "currentPage", "bookmarks") live
-- in separate rows, so a feature can save/restore its slice without stomping
-- on neighbours. Access is enforced by joining user_uploads in the API layer;
-- no FK from document_state to user_uploads because soft-deleted access rows
-- shouldn't cascade-orphan saved state.
CREATE TABLE document_state (
  id          UUID    PRIMARY KEY DEFAULT uuidv7(),
  created_at  BIGINT  NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint,
  updated_at  BIGINT  NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint,
  deleted     BOOLEAN NOT NULL DEFAULT FALSE,
  attrs       JSONB   NOT NULL DEFAULT '{}'::jsonb,

  document_id UUID    NOT NULL REFERENCES uploads(id),
  user_id     UUID    NOT NULL REFERENCES users(id),
  key_name    TEXT    NOT NULL,
  state       JSONB   NOT NULL DEFAULT '{}'::jsonb
);

-- One live row per (user, document, key). Plain unique index — not partial —
-- so ON CONFLICT upserts work without specifying a predicate. If a slot is
-- soft-deleted, the same triplet would still collide; that's fine because
-- soft-delete here is a tombstone, not a re-creation gate.
CREATE UNIQUE INDEX document_state_user_doc_key_uniq
  ON document_state (user_id, document_id, key_name);

-- Fast "all state for me on this document" sweep — used when the reader
-- wants to hydrate every saved slice at once.
CREATE INDEX document_state_user_doc_active_idx
  ON document_state (user_id, document_id)
  WHERE deleted = FALSE;

COMMIT;
