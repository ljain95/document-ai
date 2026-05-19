import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { hashPassword, signToken } from "@/lib/auth";
import type { SignupRequest } from "@/@types/request/auth";
import type {
  AuthErrorResponse,
  AuthSuccessResponse,
} from "@/@types/response/auth";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  const body = (raw ?? {}) as Partial<SignupRequest>;
  const { name, email, password } = body;

  if (typeof name !== "string" || name.trim().length < 2) {
    return err("invalid_name", 400);
  }
  if (typeof email !== "string" || !EMAIL.test(email)) {
    return err("invalid_email", 400);
  }
  if (typeof password !== "string" || password.length < 8) {
    return err("weak_password", 400);
  }

  const passwordHash = await hashPassword(password);
  const normalizedEmail = email.trim().toLowerCase();

  let inserted;
  try {
    inserted = await db
      .insert(users)
      .values({ name: name.trim(), email: normalizedEmail, passwordHash })
      .returning({ id: users.id, name: users.name, email: users.email });
  } catch (e) {
    if ((e as { code?: string }).code === "23505") {
      return err("email_taken", 409);
    }
    throw e;
  }

  const user = inserted[0];
  const token = await signToken({ sub: user.id, email: user.email });

  return NextResponse.json<AuthSuccessResponse>({ token, user }, { status: 201 });
}
