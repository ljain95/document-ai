import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { verifyPassword, signToken } from "@/lib/auth";
import type { LoginRequest } from "@/@types/request/auth";
import type {
  AuthErrorResponse,
  AuthSuccessResponse,
} from "@/@types/response/auth";

function err(error: AuthErrorResponse["error"], status: number) {
  return NextResponse.json<AuthErrorResponse>({ error }, { status });
}

export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return err("invalid_json", 400);
  }

  const body = (raw ?? {}) as Partial<LoginRequest>;
  const { email, password } = body;

  if (typeof email !== "string" || typeof password !== "string") {
    return err("invalid_credentials", 401);
  }

  const normalizedEmail = email.trim().toLowerCase();

  const [row] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(and(eq(users.email, normalizedEmail), eq(users.deleted, false)))
    .limit(1);

  if (!row || !(await verifyPassword(password, row.passwordHash))) {
    return err("invalid_credentials", 401);
  }

  const token = await signToken({ sub: row.id, email: row.email });

  return NextResponse.json<AuthSuccessResponse>(
    {
      token,
      user: { id: row.id, name: row.name, email: row.email },
    },
    { status: 200 },
  );
}
