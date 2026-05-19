# Product: AI Reader

AI Reader is a Kindle-style reading app for books and novels. The reading surface lets users **highlight passages** the way they would on a physical e-reader. On top of that, an AI helper acts on the user's selection (a highlighted span, the current page, or the whole chapter) to:

- **Summarize** the selected text, page, or section.
- **Generate diagrams** that map out characters, plots, concepts, or relationships in the selection.
- **Generate illustrations** that visualize a scene, setting, or idea from the text.

When you build features, assume the user's primary action is *reading*, and the AI tools augment that — they should feel like a sidekick on top of the page, never the main UI. Keep the reading surface uncluttered.

# Do's and Don'ts

These rules are non-negotiable. Code reviews bounce on any of them.

## 1. Types live in `src/@types/`

**Do** put every DB row type, request DTO, response DTO, and shared type under `src/@types/`:

```
src/@types/
├── common.ts          # shared/cross-cutting types
├── database/          # DB row shapes (one file per table, mirror schema.ts)
├── request/           # inbound DTOs — what the server accepts
└── response/          # outbound DTOs — what the server returns
```

**Don't** declare DB or DTO `interface`/`type` inside route handlers, components, or `lib/`. Import from `@/@types/...` instead.

The drizzle table inferred types (`typeof users.$inferSelect`) are still fine to use, but if a type is shared across more than one file, re-export it from `src/@types/database/<table>.ts` so it has one canonical home.

## 2. Use components from `src/components/`

**Do** import existing components from `src/components/` before writing UI from scratch. The directory is split three ways:

- `src/components/ui/` — primitives (Button, Input, Dialog, etc.)
- `src/components/layouts/` — page-level scaffolding (PageHeader, PageWrapper, etc.)
- `src/components/logics/` — control-flow helpers (`<OnlyIf>`, `<ForData>`, `<ChooseWhen>`, `<WithFor>`)

**Component inventory (keep this in sync when adding new components):**

- **ui** (`@/components/ui/...`): `accordion`, `alert`, `alertDialog`, `avatar`, `badge`, `button`, `card`, `checkbox`, `collapsible`, `command`, `cover3D` (exports `BookCover`, `PdfCover`, `MarkdownCover` + `BookHeader`/`BookTitle`/`BookDescription`), `dialog`, `dropdownMenu`, `form`, `input`, `label`, `numericInput`, `popover`, `responsiveContainer`, `scrollArea`, `select`, `separator`, `sheet`, `sidebar`, `skeleton`, `switch`, `table`, `tabs`, `textarea`, `toast`, `toaster`, `tooltip`
- **layouts** (`@/components/layouts/...`): `authProvider` (exports `AuthProvider` + `useAuth`), `miniSidebar`, `pageButton`, `pageDescription`, `pageEmptyState`, `pageHeader`, `pageLoader`, `pageSearch`, `pageSeperator`, `pageTitle`, `pageWrapper`
- **logics** (`@/components/logics/...`): `chooseWhen`, `forData`, `onlyIf`, `withFor`

**Don't** silently inline a `<button>` or roll a one-off layout primitive when one already exists above. If something is missing, add it to `src/components/<bucket>/` *and* add it to the inventory list in this section.

## 3. Tailwind only — no inline CSS

**Do** style everything with Tailwind utility classes.

**Don't** use the `style={{ ... }}` prop or write `.css`/`.module.css` files alongside components. The only `.css` in the repo is `src/app/assets/globals.css` (theme variables, base layer, custom variants). All component styling is Tailwind. If a value is too dynamic for a class, define it as a CSS variable in `globals.css` and reference it via an arbitrary utility (`bg-[var(--my-var)]`).

## 4. API calls go through `src/network/`

**Do** put every client-side fetch wrapper in `src/network/`, one file per domain (e.g. `src/network/auth.ts`, `src/network/books.ts`). Components and hooks import from there and never call `fetch` directly.

**Don't** scatter `fetch("/api/...")` calls across components, pages, or hooks. The `network/` layer is where request DTOs (`@/@types/request/...`) are serialised, response DTOs (`@/@types/response/...`) are typed, and errors are normalised. UI code only sees typed promises.

## 5. One class per file

**Do** keep each `.ts`/`.tsx` file to one top-level class. Helper functions and interfaces that are tightly coupled to that class can live in the same file; if they're reused elsewhere, move them out.

**Don't** stack two unrelated classes in the same file "for now". Split immediately — `ClassA` in `ClassA.ts`, `ClassB` in `ClassB.ts`, even if both are tiny. This keeps imports and stack traces honest and avoids the file becoming a kitchen-sink.

## 6. Endpoint URLs are constants, not literals

**Do** define every API endpoint path in `src/constants/endpoints.ts` and reference it by constant from both the network layer and tests. Other cross-cutting constants (cookie names, feature flags, etc.) live alongside it under `src/constants/`:

```ts
// src/constants/endpoints.ts
export const ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/auth/login",
    SIGNUP: "/api/auth/signup",
  },
  BOOKS: {
    LIST: "/api/books",
    DETAIL: (id: string) => `/api/books/${id}`,
  },
} as const;
```

```ts
// src/network/auth.ts
import { ENDPOINTS } from "@/constants/endpoints";
export const login = (body: LoginRequest) =>
  fetch(ENDPOINTS.AUTH.LOGIN, { method: "POST", body: JSON.stringify(body) });
```

**Don't** write the path string inline at the call site — `fetch("/api/auth/login", ...)` is a bug magnet. A typo gives a 404 the type-checker can't catch, and renaming a route means grepping a string instead of letting the compiler walk the references for you. Parameterised paths get a function (`DETAIL: (id) => ...`) so the call site can't forget a segment.

## 7. `src/app/app/**` is client-only

**Do** mark every file under `src/app/app/**` (pages, layouts, child components) with `"use client"` at the top. The whole `/app/**` surface is a single-page-style client app: layouts and pages render in the browser, fetch via `src/network/*`, and reach the server only through API routes under `src/app/api/**`.

**Don't** make a server component or async page under `src/app/app/**`. No `await getSession()`, no `cookies()`/`headers()` from `next/headers`, no `params: Promise<...>` — read route params via `useParams()` from `next/navigation` instead. Auth gating happens client-side via the layout's `<AuthProvider>` (see `@/components/layouts/authProvider`); data fetching happens in `useEffect` via the network layer. The 401 handler in `src/network/core/api.ts` already redirects unauthenticated callers to `/login`, so per-page auth branches aren't needed.

## 8. Database access lives only in API routes

**Do** keep every drizzle / `@/lib/db` / `@/lib/schema` / `@/lib/session` / `@/lib/auth` import inside `src/app/api/**/route.ts` (and the small server-only support modules under `src/lib/` that those routes call). UI code reads and writes data exclusively through `src/network/*` wrappers.

**Don't** import `@/lib/db`, `@/lib/schema`, `@/lib/session`, `@/lib/auth`, `drizzle-orm`, `postgres`, or anything from `next/headers` outside `src/app/api/**` and `src/lib/`. If a page needs new data, add (a) an API route, (b) request/response DTOs under `src/@types/`, (c) a `src/network/*` wrapper, (d) consume it from a `useEffect` in the client component. Server-only modules under `src/lib/` (`auth.ts`, `db.ts`, `session.ts`) declare `import "server-only"` so accidental client imports fail the build — don't loosen that.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Strings & locale

All user-facing string literals (labels, placeholders, button text, headings, error messages, etc.) live in `locale/en.json`. Never hard-code English text inside `.tsx`/`.ts` source — add the key to the locale file and read it via `t()` from `@/lib/i18n`. This applies to server components, client components, and server actions.

- Add new strings under a semantic namespace (e.g. `reader.toolbar.highlight`, not a flat key).
- Use `format(template, { ... })` from `@/lib/i18n` for interpolation (`{email}` etc.).
- `aria-label`, `title`, and `alt` text count as user-facing — they go in the locale file too.

# Database

The database is **Supabase Postgres** (currently Postgres 17). We connect to it directly via `DATABASE_URL` (transaction-mode pooler on port 6543) from `src/lib/db.ts` — we do *not* use the Supabase client SDK and we do *not* use Supabase Auth. Auth is our own (JWT in `src/lib/auth.ts`, users table in `migrations/`).

Implications:
- `pgcrypto` is already enabled — no need to `CREATE EXTENSION` again, but it's harmless.
- `uuidv7()` is not native until Postgres 18, so `V001__init.sql` ships a PL/pgSQL implementation. Keep relying on that function in future migrations.
- Run migrations against the project's Supabase DB via `node cli.mjs up` (wraps `docker compose -f migrations/docker.yaml run --rm flyway`). The compose file reads `../.env` for Flyway credentials.
- `postgres.js` is configured with `prepare: false` — required for the transaction-mode pooler. Don't enable prepared statements without also switching to a session-mode connection.

# Drizzle ORM

All application queries go through **Drizzle ORM**. Import `db` from `@/lib/db` and table definitions from `@/lib/schema`. Never reach for the raw `postgres.js` client unless drizzle genuinely can't express the query — and even then, use `db.execute(sql\`...\`)` so the connection stays managed.

**SQL migrations are the source of truth.** `src/lib/schema.ts` is hand-maintained to mirror what's in `migrations/V0xx__*.sql`. The flow is:

1. Write the migration SQL in `migrations/V<NNN>__<name>.sql` first (see "Database migrations" below).
2. Apply it against the DB.
3. **Then** update `src/lib/schema.ts` to match — add/edit the table definition, keep column names and types in sync, re-export inferred types.

Do **not** run `drizzle-kit generate` / `drizzle-kit push`. Those would write competing migration files into a separate directory and create drift between the two systems. We installed `drizzle-orm` only, not `drizzle-kit`, for exactly this reason.

When mirroring SQL → schema, the column-type mapping we use:

| SQL                  | Drizzle                                                  |
| -------------------- | -------------------------------------------------------- |
| `UUID`               | `uuid("col_name")`                                       |
| `BIGINT` (unix ms)   | `bigint("col_name", { mode: "number" })` — Number is safe for ms timestamps |
| `BOOLEAN`            | `boolean("col_name")`                                    |
| `JSONB`              | `jsonb("col_name").$type<...>()` — always type the bag   |
| `TEXT`               | `text("col_name")`                                       |

Use `sql\`uuidv7()\`` and `sql\`(extract(epoch from now()) * 1000)::bigint\`` as the `.default(...)` for the standard five columns so the DB and app agree on defaults.

Export inferred types (`typeof table.$inferSelect`, `typeof table.$inferInsert`) — prefer these in route handlers / service code over hand-written interfaces.

# Database migrations

All schema changes go through versioned SQL files in the `migrations/` directory at the project root. The runner is Flyway-style: files are applied in lexicographic order, exactly once, and are immutable after they ship.

## File naming

`V<NNN>__<snake_case_description>.sql` — three-digit zero-padded version, **double underscore** between version and description.

```
migrations/
  V001__init.sql
  V002__create_books.sql
  V003__add_highlights.sql
```

Rules:
- Version numbers are strictly increasing and never reused.
- Never edit a migration after it has been merged to `main`. To change a shipped schema, write a new migration.
- One logical change per file. Don't combine "create books" and "add column to users" — they should be two files.
- The description is human-readable and explains *what changes*, not *why* (the why goes in the PR / commit).

## Required columns on every table

Every business table in this project carries the same five columns. This is non-negotiable — it's what the application code, soft-delete logic, audit tooling, and JSONB-backed extension fields all expect.

| Column        | Type        | Notes                                                            |
| ------------- | ----------- | ---------------------------------------------------------------- |
| `id`          | `UUID`      | UUID **v7** (time-ordered). Primary key. Default `uuidv7()`.     |
| `created_at`  | `BIGINT`    | Unix epoch in **milliseconds**. Default `extract_epoch_ms(now())`. |
| `updated_at`  | `BIGINT`    | Unix epoch in milliseconds. App or trigger updates on write.     |
| `deleted`     | `BOOLEAN`   | Soft-delete flag. Default `FALSE`. **Never hard-delete rows.**   |
| `attrs`       | `JSONB`     | Free-form extension bag. Default `'{}'::jsonb`. **Not null.**    |

Why these defaults:
- **UUIDv7 over v4**: time-ordered → better index locality, sane natural sort, no separate `created_at` index needed for chronological queries.
- **Unix milliseconds over `TIMESTAMPTZ`**: matches JS `Date.now()` end-to-end, no timezone foot-guns at API boundaries, integer arithmetic for windows.
- **Soft delete via `deleted`**: every `SELECT` adds `WHERE deleted = FALSE` (enforce via a view or RLS if/when needed).
- **`attrs JSONB`**: lets product iterate on optional fields without a migration per experiment; promote a stable key to a typed column once it earns its keep.

## Authoring a new migration

1. Pick the next version number (look at the last `V<NNN>__*.sql` in `migrations/`).
2. Create `migrations/V<NNN>__<description>.sql`.
3. Start every `CREATE TABLE` with the five-column block below, then add domain columns underneath.
4. Add indexes in the same file as the table (don't split unless reasoning about a long backfill).
5. Wrap the whole file in a transaction unless you're doing something Postgres won't let you transact (e.g. `CREATE INDEX CONCURRENTLY`).

### Boilerplate — required columns block

```sql
id          UUID        PRIMARY KEY DEFAULT uuidv7(),
created_at  BIGINT      NOT NULL    DEFAULT (extract(epoch from now()) * 1000)::bigint,
updated_at  BIGINT      NOT NULL    DEFAULT (extract(epoch from now()) * 1000)::bigint,
deleted     BOOLEAN     NOT NULL    DEFAULT FALSE,
attrs       JSONB       NOT NULL    DEFAULT '{}'::jsonb,
```

> `uuidv7()` is native in Postgres 18+. On 17 or earlier, ship a helper function in `V001__init.sql` (PL/pgSQL implementation of UUIDv7) before any table that depends on it.

### Example table

```sql
-- migrations/V002__create_books.sql
BEGIN;

CREATE TABLE books (
  id          UUID        PRIMARY KEY DEFAULT uuidv7(),
  created_at  BIGINT      NOT NULL    DEFAULT (extract(epoch from now()) * 1000)::bigint,
  updated_at  BIGINT      NOT NULL    DEFAULT (extract(epoch from now()) * 1000)::bigint,
  deleted     BOOLEAN     NOT NULL    DEFAULT FALSE,
  attrs       JSONB       NOT NULL    DEFAULT '{}'::jsonb,

  owner_id    UUID        NOT NULL,
  title       TEXT        NOT NULL,
  author      TEXT,
  source_uri  TEXT        NOT NULL
);

CREATE INDEX books_owner_active_idx
  ON books (owner_id, created_at DESC)
  WHERE deleted = FALSE;

COMMIT;
```

### Things to avoid

- ❌ `DROP TABLE`, `DROP COLUMN`, or destructive `ALTER` against a live table without a deprecation window. Prefer additive changes + soft retirement.
- ❌ Editing a previously merged migration. Always write a new `V<N+1>__...sql`.
- ❌ Hard-coding row data in migrations beyond seed/reference data needed for the app to boot.
- ❌ Mixing schema + data changes when the data step is non-trivial — split into two migrations.
