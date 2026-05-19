BEGIN;

CREATE TABLE uploads (
  id          UUID    PRIMARY KEY DEFAULT uuidv7(),
  created_at  BIGINT  NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint,
  updated_at  BIGINT  NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint,
  deleted     BOOLEAN NOT NULL DEFAULT FALSE,
  attrs       JSONB   NOT NULL DEFAULT '{}'::jsonb,

  owner_id    UUID    NOT NULL REFERENCES users(id),
  name        TEXT    NOT NULL,
  filename    TEXT    NOT NULL,
  mime_type   TEXT    NOT NULL,
  size_bytes  BIGINT  NOT NULL
);

-- Library list view is "this user's active uploads, newest first" — partial
-- index keeps it lean by excluding soft-deleted rows.
CREATE INDEX uploads_owner_active_idx
  ON uploads (owner_id, created_at DESC)
  WHERE deleted = FALSE;

COMMIT;
