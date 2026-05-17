-- Project-wide DB bootstrap: extensions and helper functions used by every
-- subsequent migration. Safe to re-run.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- UUIDv7 (time-ordered, RFC 9562). Native in Postgres 18+; this PL/pgSQL
-- implementation backports it for earlier versions and is overridden by the
-- built-in on PG18+ when a CREATE OR REPLACE happens after upgrade.
--
-- Layout: 48-bit unix-millis timestamp || 4-bit version (0111) || 12 random ||
--          2-bit variant (10) || 62 random.
CREATE OR REPLACE FUNCTION uuidv7() RETURNS uuid
LANGUAGE plpgsql
VOLATILE
PARALLEL SAFE
AS $$
DECLARE
  ts_ms bigint;
  bytes bytea;
BEGIN
  ts_ms := (extract(epoch from clock_timestamp()) * 1000)::bigint;
  bytes := substring(int8send(ts_ms) from 3 for 6) || gen_random_bytes(10);
  -- version 7: byte 6 high nibble = 0111
  bytes := set_byte(bytes, 6, ((get_byte(bytes, 6) & 15) | 112));
  -- variant 10xx: byte 8 high bits = 10
  bytes := set_byte(bytes, 8, ((get_byte(bytes, 8) & 63) | 128));
  RETURN encode(bytes, 'hex')::uuid;
END;
$$;

COMMIT;
