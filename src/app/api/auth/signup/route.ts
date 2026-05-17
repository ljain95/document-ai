import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { hashPassword, signToken } from "@/lib/auth";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { name, email, password } = (body ?? {}) as {
    name?: unknown;
    email?: unknown;
    password?: unknown;
  };

  if (typeof name !== "string" || name.trim().length < 2) {
    return NextResponse.json({ error: "invalid_name" }, { status: 400 });
  }
  if (typeof email !== "string" || !EMAIL.test(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }
  if (typeof password !== "string" || password.length < 8) {
    return NextResponse.json({ error: "weak_password" }, { status: 400 });
  }

  const passwordHash = await hashPassword(password);
  const normalizedEmail = email.trim().toLowerCase();

  let inserted;
  try {
    inserted = await db
      .insert(users)
      .values({ name: name.trim(), email: normalizedEmail, passwordHash })
      .returning({ id: users.id, name: users.name, email: users.email });
  } catch (err) {
    // unique_violation on the active-email partial index
    if ((err as { code?: string }).code === "23505") {
      return NextResponse.json({ error: "email_taken" }, { status: 409 });
    }
    throw err;
  }

  const user = inserted[0];
  const token = await signToken({ sub: user.id, email: user.email });

  return NextResponse.json({ token, user }, { status: 201 });
}
