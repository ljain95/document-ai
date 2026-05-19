import { NextResponse } from "next/server";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import { join, extname } from "node:path";
import { and, desc, eq, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { uploads, userUploads } from "@/lib/schema";
import { getSession } from "@/lib/session";
import {
  MAX_UPLOAD_BYTES,
  ALLOWED_EXTENSIONS,
  ALLOWED_MIMES,
  DOC_TYPES,
  UPLOADS_PAGE_SIZE,
  type AllowedExtension,
  type DocType,
} from "@/constants/uploads";
import type {
  ListUploadsErrorResponse,
  ListUploadsSuccessResponse,
  UploadErrorResponse,
  UploadSuccessResponse,
} from "@/@types/response/upload";

// Local-fs storage is dev-only. For prod, replace with object storage
// (Supabase Storage / S3) and store the URL/key on the row instead.
const UPLOAD_DIR = join(process.cwd(), "uploads");

function err(error: UploadErrorResponse["error"], status: number) {
  return NextResponse.json<UploadErrorResponse>({ error }, { status });
}

function isAllowed(ext: string, mime: string): ext is AllowedExtension {
  if (!(ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) return false;
  return ALLOWED_MIMES[ext as AllowedExtension].includes(mime);
}

function isDocType(value: string): value is DocType {
  return (DOC_TYPES as readonly string[]).includes(value);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return err("unauthorized", 401);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return err("invalid_json", 400);
  }

  const name = String(form.get("name") ?? "").trim();
  const typeRaw = String(form.get("type") ?? "");
  const file = form.get("file");

  if (name.length < 1) return err("invalid_name", 400);
  if (!isDocType(typeRaw)) return err("invalid_type", 400);
  if (!(file instanceof File) || file.size === 0) return err("missing_file", 400);
  if (file.size > MAX_UPLOAD_BYTES) return err("file_too_large", 400);

  const ext = extname(file.name).toLowerCase();
  if (!isAllowed(ext, file.type)) return err("unsupported_type", 400);

  // Insert upload + companion OWNER mapping in a single transaction so the
  // access table never has a missing owner row for a real upload.
  const row = await db.transaction(async (tx) => {
    const [inserted] = await tx
      .insert(uploads)
      .values({
        ownerId: session.sub,
        name,
        filename: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        type: typeRaw,
      })
      .returning({
        id: uploads.id,
        name: uploads.name,
        filename: uploads.filename,
        mimeType: uploads.mimeType,
        sizeBytes: uploads.sizeBytes,
        createdAt: uploads.createdAt,
        type: uploads.type,
      });

    await tx.insert(userUploads).values({
      userId: session.sub,
      uploadId: inserted.id,
      role: "OWNER",
    });

    return inserted;
  });

  const path = join(UPLOAD_DIR, `${row.id}${ext}`);
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(path, Buffer.from(await file.arrayBuffer()));
  } catch (e) {
    // Best-effort cleanup; the upload + access rows are soft-deleted so a
    // re-upload with the same name isn't blocked.
    await db.update(uploads).set({ deleted: true }).where(eq(uploads.id, row.id));
    await db
      .update(userUploads)
      .set({ deleted: true })
      .where(eq(userUploads.uploadId, row.id));
    await unlink(path).catch(() => {});
    throw e;
  }

  return NextResponse.json<UploadSuccessResponse>({ upload: row }, { status: 201 });
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json<ListUploadsErrorResponse>(
      { error: "unauthorized" },
      { status: 401 },
    );
  }

  const cursor = new URL(request.url).searchParams.get("cursor") ?? undefined;

  // UUIDv7 ids are time-ordered, so `id` works as both the sort key and the
  // pagination cursor — no separate index needed. Fetch one extra row to
  // know whether a "next page" exists without a count query.
  const rows = await db
    .select({
      id: uploads.id,
      name: uploads.name,
      filename: uploads.filename,
      mimeType: uploads.mimeType,
      sizeBytes: uploads.sizeBytes,
      createdAt: uploads.createdAt,
      type: uploads.type,
    })
    .from(uploads)
    .innerJoin(userUploads, eq(userUploads.uploadId, uploads.id))
    .where(
      and(
        eq(userUploads.userId, session.sub),
        eq(userUploads.deleted, false),
        eq(uploads.deleted, false),
        cursor ? lt(uploads.id, cursor) : undefined,
      ),
    )
    .orderBy(desc(uploads.id))
    .limit(UPLOADS_PAGE_SIZE + 1);

  const hasMore = rows.length > UPLOADS_PAGE_SIZE;
  const page = hasMore ? rows.slice(0, UPLOADS_PAGE_SIZE) : rows;
  const nextCursor = hasMore ? page[page.length - 1].id : null;

  return NextResponse.json<ListUploadsSuccessResponse>({
    uploads: page,
    nextCursor,
  });
}
