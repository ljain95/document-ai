BEGIN;

CREATE TABLE users (
  id             UUID        PRIMARY KEY DEFAULT uuidv7(),
  created_at     BIGINT      NOT NULL    DEFAULT (extract(epoch from now()) * 1000)::bigint,
  updated_at     BIGINT      NOT NULL    DEFAULT (extract(epoch from now()) * 1000)::bigint,
  deleted        BOOLEAN     NOT NULL    DEFAULT FALSE,
  attrs          JSONB       NOT NULL    DEFAULT '{}'::jsonb,

  name           TEXT        NOT NULL,
  email          TEXT        NOT NULL,
  password_hash  TEXT        NOT NULL
);

-- Email is unique only among active rows so soft-deleted accounts don't block
-- re-signups with the same address.
CREATE UNIQUE INDEX users_email_active_uniq
  ON users (lower(email))
  WHERE deleted = FALSE;

COMMIT;
