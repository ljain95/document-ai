BEGIN;

-- 1. doc_type enum for the kind of document being uploaded.
CREATE TYPE doc_type AS ENUM (
  'NOVEL',
  'RESEARCH_PAPER',
  'PRESENTATION',
  'TEXTBOOK',
  'ARTICLE',
  'REPORT',
  'OTHER'
);

ALTER TABLE uploads
  ADD COLUMN type doc_type NOT NULL DEFAULT 'OTHER';

-- 2. user_uploads — N:M access map. Owner is denormalized on uploads.owner_id
-- for fast "creator?" checks; this table is the access-control source of
-- truth (shared viewers, future editors).
CREATE TYPE user_upload_role AS ENUM (
  'OWNER',
  'EDITOR',
  'VIEWER'
);

CREATE TABLE user_uploads (
  id          UUID    PRIMARY KEY DEFAULT uuidv7(),
  created_at  BIGINT  NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint,
  updated_at  BIGINT  NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint,
  deleted     BOOLEAN NOT NULL DEFAULT FALSE,
  attrs       JSONB   NOT NULL DEFAULT '{}'::jsonb,

  user_id     UUID             NOT NULL REFERENCES users(id),
  upload_id   UUID             NOT NULL REFERENCES uploads(id),
  role        user_upload_role NOT NULL DEFAULT 'VIEWER'
);

-- One active access row per (user, upload). Soft-deleted rows are excluded
-- so re-sharing after a revoke isn't blocked.
CREATE UNIQUE INDEX user_uploads_pair_active_uniq
  ON user_uploads (user_id, upload_id)
  WHERE deleted = FALSE;

-- Fast "what can this user open" lookup.
CREATE INDEX user_uploads_user_active_idx
  ON user_uploads (user_id, created_at DESC)
  WHERE deleted = FALSE;

-- 3. Backfill: every existing upload's owner gets a corresponding OWNER row
-- in user_uploads so the access-list view is complete from day one.
INSERT INTO user_uploads (user_id, upload_id, role)
SELECT owner_id, id, 'OWNER'
FROM uploads
ON CONFLICT DO NOTHING;

COMMIT;
