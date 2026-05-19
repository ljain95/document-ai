import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { uploads, userUploads } from "@/lib/schema";
import { getSession } from "@/lib/session";
import type {
  GetUploadErrorResponse,
  GetUploadSuccessResponse,
} from "@/@types/response/upload";

// Metadata for a single upload, scoped to the authenticated user. The file
// bytes are served by the sibling /file route; this one is just for the
// reader page header (name, size, type, etc.).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json<GetUploadErrorResponse>(
      { error: "unauthorized" },
      { status: 401 },
    );
  }

  const { id } = await params;

  const [row] = await db
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
        eq(uploads.id, id),
        eq(uploads.deleted, false),
        eq(userUploads.userId, session.sub),
        eq(userUploads.deleted, false),
      ),
    )
    .limit(1);

  if (!row) {
    return NextResponse.json<GetUploadErrorResponse>(
      { error: "not_found" },
      { status: 404 },
    );
  }

  return NextResponse.json<GetUploadSuccessResponse>({ upload: row });
}
