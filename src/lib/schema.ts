import { sql } from "drizzle-orm";
import { pgTable, uuid, bigint, boolean, jsonb, text } from "drizzle-orm/pg-core";

// Hand-maintained to mirror migrations/. SQL migrations are the source of
// truth — see AGENTS.md "Database migrations". Do not run drizzle-kit generate
// against this file.

const nowMs = sql`(extract(epoch from now()) * 1000)::bigint`;

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`uuidv7()`),
  createdAt: bigint("created_at", { mode: "number" }).notNull().default(nowMs),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull().default(nowMs),
  deleted: boolean("deleted").notNull().default(false),
  attrs: jsonb("attrs").$type<Record<string, unknown>>().notNull().default({}),

  name: text("name").notNull(),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
