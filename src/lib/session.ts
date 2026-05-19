import "server-only";
import { cookies } from "next/headers";
import { ACCESS_TOKEN_COOKIE } from "@/constants/auth";
import { verifyToken, type TokenPayload } from "./auth";

// Single source of truth for "is the current request authenticated?".
// Reads the access_token cookie and validates the JWT signature + expiry.
// Returns the decoded payload on success, null otherwise — callers compose
// their own redirect/render logic from that.
export async function getSession(): Promise<TokenPayload | null> {
  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}
