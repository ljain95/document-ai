import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { getSession } from "@/lib/session";
import type {
  MeErrorResponse,
  MeSuccessResponse,
} from "@/@types/response/auth";

// Returns the authenticated caller's PublicUser. AuthProvider hits this on
// every /app/** mount to hydrate the user; it's also the source of truth on
// hard reloads when the in-memory user is lost but the JWT cookie persists.
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json<MeErrorResponse>(
      { error: "unauthorized" },
      { status: 401 },
    );
  }

  const [row] = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(and(eq(users.id, session.sub), eq(users.deleted, false)))
    .limit(1);

  if (!row) {
    // Token references a deleted/missing user — treat like an unauth.
    return NextResponse.json<MeErrorResponse>(
      { error: "unauthorized" },
      { status: 401 },
    );
  }

  return NextResponse.json<MeSuccessResponse>({ user: row });
}
