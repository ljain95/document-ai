import type { users } from "@/lib/schema";

// Canonical DB types for the `users` table. Mirrors V002__create_users.sql
// via drizzle inference; do not redeclare these in route handlers.

export type UserRow = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// Safe shape to return to the client — never include password_hash, deleted,
// or attrs without an explicit reason.
export type PublicUser = Pick<UserRow, "id" | "name" | "email">;
