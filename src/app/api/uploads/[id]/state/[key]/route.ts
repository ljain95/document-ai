import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { documentState, uploads, userUploads } from "@/lib/schema";
import { getSession } from "@/lib/session";
import {
  MAX_STATE_BYTES,
  STATE_KEY_PATTERN,
} from "@/constants/documentState";
import type { SetDocumentStateRequest } from "@/@types/request/documentState";
import type {
  GetDocumentStateErrorResponse,
  GetDocumentStateSuccessResponse,
  SetDocumentStateErrorResponse,
  SetDocumentStateSuccessResponse,
} from "@/@types/response/documentState";

interface RouteContext {
  params: Promise<{ id: string; key: string }>;
}

// Resolves the caller and confirms they have access to the document. Both
// handlers go through this so the user_id check can't be skipped in one path
// and not the other. Returns the typed session + ids on success, or a ready
// NextResponse to short-circuit with.
async function authorize(ctx: RouteContext) {
  const session = await getSession();
  if (!session) {
    return {
      err: NextResponse.json<GetDocumentStateErrorResponse>(
        { error: "unauthorized" },
        { status: 401 },
      ),
    };
  }

  const { id, key } = await ctx.params;
  if (!STATE_KEY_PATTERN.test(key)) {
    return {
      err: NextResponse.json<GetDocumentStateErrorResponse>(
        { error: "invalid_key" },
        { status: 400 },
      ),
    };
  }

  // Access check via user_uploads — 404 (not 403) on a miss so we don't leak
  // whether the upload exists for another user.
  const [access] = await db
    .select({ id: uploads.id })
    .from(uploads)
    .innerJoin(userUploads, eq(userUploads.uploadId, uploads.id))
    .where(
      and(
        eq(uploads.id, id),
        eq(uploads.deleted, false),
        eq(userUploads.userId, session.sub),
        eq(userUploads.deleted, false),
      ),
    )
    .limit(1);

  if (!access) {
    return {
      err: NextResponse.json<GetDocumentStateErrorResponse>(
        { error: "not_found" },
        { status: 404 },
      ),
    };
  }

  return { session, id, key };
}

export async function GET(_request: Request, ctx: RouteContext) {
  const auth = await authorize(ctx);
  if ("err" in auth) return auth.err;

  const [row] = await db
    .select({
      state: documentState.state,
      updatedAt: documentState.updatedAt,
    })
    .from(documentState)
    .where(
      and(
        eq(documentState.userId, auth.session.sub),
        eq(documentState.documentId, auth.id),
        eq(documentState.keyName, auth.key),
        eq(documentState.deleted, false),
      ),
    )
    .limit(1);

  return NextResponse.json<GetDocumentStateSuccessResponse>(
    row
      ? { state: row.state, updatedAt: row.updatedAt }
      : { state: null, updatedAt: null },
  );
}

export async function PUT(request: Request, ctx: RouteContext) {
  const auth = await authorize(ctx);
  if ("err" in auth) return auth.err;

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return NextResponse.json<SetDocumentStateErrorResponse>(
      { error: "invalid_json" },
      { status: 400 },
    );
  }

  if (raw.length > MAX_STATE_BYTES) {
    return NextResponse.json<SetDocumentStateErrorResponse>(
      { error: "too_large" },
      { status: 413 },
    );
  }

  let body: SetDocumentStateRequest;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json<SetDocumentStateErrorResponse>(
      { error: "invalid_json" },
      { status: 400 },
    );
  }

  if (!body || typeof body !== "object" || !("state" in body)) {
    return NextResponse.json<SetDocumentStateErrorResponse>(
      { error: "invalid_json" },
      { status: 400 },
    );
  }

  // Upsert scoped to (user_id, document_id, key_name) — the unique index of
  // the same name handles the conflict target. user_id is pinned to the
  // session, never trusted from the URL or body.
  const nowMs = sql`(extract(epoch from now()) * 1000)::bigint`;
  const [row] = await db
    .insert(documentState)
    .values({
      documentId: auth.id,
      userId: auth.session.sub,
      keyName: auth.key,
      state: body.state,
    })
    .onConflictDoUpdate({
      target: [
        documentState.userId,
        documentState.documentId,
        documentState.keyName,
      ],
      set: {
        state: body.state,
        updatedAt: nowMs,
        deleted: false,
      },
    })
    .returning({
      state: documentState.state,
      updatedAt: documentState.updatedAt,
    });

  return NextResponse.json<SetDocumentStateSuccessResponse>({
    state: row.state,
    updatedAt: row.updatedAt,
  });
}
