import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { verifyPassword, signToken } from "@/lib/auth";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { email, password } = (body ?? {}) as {
    email?: unknown;
    password?: unknown;
  };

  if (typeof email !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
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
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  const token = await signToken({ sub: row.id, email: row.email });

  return NextResponse.json(
    {
      token,
      user: { id: row.id, name: row.name, email: row.email },
    },
    { status: 200 },
  );
}
