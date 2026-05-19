import { sql } from "drizzle-orm";
import {
  pgTable,
  pgEnum,
  uuid,
  bigint,
  boolean,
  jsonb,
  text,
} from "drizzle-orm/pg-core";
import { DOC_TYPES, USER_UPLOAD_ROLES } from "@/constants/uploads";

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

export const docTypeEnum = pgEnum("doc_type", DOC_TYPES);
export const userUploadRoleEnum = pgEnum("user_upload_role", USER_UPLOAD_ROLES);

export const uploads = pgTable("uploads", {
  id: uuid("id").primaryKey().default(sql`uuidv7()`),
  createdAt: bigint("created_at", { mode: "number" }).notNull().default(nowMs),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull().default(nowMs),
  deleted: boolean("deleted").notNull().default(false),
  attrs: jsonb("attrs").$type<Record<string, unknown>>().notNull().default({}),

  ownerId: uuid("owner_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
  type: docTypeEnum("type").notNull().default("OTHER"),
});

export const documentState = pgTable("document_state", {
  id: uuid("id").primaryKey().default(sql`uuidv7()`),
  createdAt: bigint("created_at", { mode: "number" }).notNull().default(nowMs),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull().default(nowMs),
  deleted: boolean("deleted").notNull().default(false),
  attrs: jsonb("attrs").$type<Record<string, unknown>>().notNull().default({}),

  documentId: uuid("document_id").notNull().references(() => uploads.id),
  userId: uuid("user_id").notNull().references(() => users.id),
  keyName: text("key_name").notNull(),
  state: jsonb("state").$type<unknown>().notNull().default({}),
});

export const userUploads = pgTable("user_uploads", {
  id: uuid("id").primaryKey().default(sql`uuidv7()`),
  createdAt: bigint("created_at", { mode: "number" }).notNull().default(nowMs),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull().default(nowMs),
  deleted: boolean("deleted").notNull().default(false),
  attrs: jsonb("attrs").$type<Record<string, unknown>>().notNull().default({}),

  userId: uuid("user_id").notNull().references(() => users.id),
  uploadId: uuid("upload_id").notNull().references(() => uploads.id),
  role: userUploadRoleEnum("role").notNull().default("VIEWER"),
});

// Inferred row types live in @/@types/database/<table> — keep this file to
// just the drizzle table definitions.
