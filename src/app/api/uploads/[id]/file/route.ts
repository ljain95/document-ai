import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { uploads, userUploads } from "@/lib/schema";
import { getSession } from "@/lib/session";

const UPLOAD_DIR = join(process.cwd(), "uploads");

// Streams the raw file for the given upload back to the browser. The PDF
// preview in <PdfCover> calls this via /api/uploads/{id}/file. Auth-gated
// AND access-checked via user_uploads, so a leaked id alone isn't enough to
// fetch someone else's document.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return new Response(null, { status: 401 });

  const { id } = await params;

  const [row] = await db
    .select({
      id: uploads.id,
      filename: uploads.filename,
      mimeType: uploads.mimeType,
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

  if (!row) return new Response(null, { status: 404 });

  const ext = extname(row.filename).toLowerCase();
  const path = join(UPLOAD_DIR, `${row.id}${ext}`);

  let buffer: Buffer;
  try {
    buffer = await readFile(path);
  } catch {
    return new Response(null, { status: 404 });
  }

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "content-type": row.mimeType || "application/octet-stream",
      "content-disposition": `inline; filename="${row.filename.replace(/"/g, "")}"`,
      // Owner-only, transient — don't let middleboxes cache it.
      "cache-control": "private, no-store",
    },
  });
}
