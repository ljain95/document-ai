import "server-only";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

declare global {
  // eslint-disable-next-line no-var
  var __pg: ReturnType<typeof postgres> | undefined;
}

function init() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  // `prepare: false` is required by Supabase's transaction-mode pooler.
  return postgres(url, { prepare: false });
}

// Reuse a single client across Next.js hot-reloads in dev so we don't leak
// connections every time a file changes.
const client = globalThis.__pg ?? init();
if (process.env.NODE_ENV !== "production") {
  globalThis.__pg = client;
}

export const db = drizzle(client, { schema });
