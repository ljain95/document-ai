import type { PublicUser } from "@/@types/database/users";

// Discriminated by `error`: success responses don't carry one, failures always
// do. Clients can switch on `"error" in res` for a clean narrow.

export type AuthErrorCode =
  | "invalid_json"
  | "invalid_name"
  | "invalid_email"
  | "weak_password"
  | "invalid_credentials"
  | "email_taken";

export interface AuthSuccessResponse {
  token: string;
  user: PublicUser;
}

export interface AuthErrorResponse {
  error: AuthErrorCode;
}

export type AuthResponse = AuthSuccessResponse | AuthErrorResponse;

// GET /api/auth/me — returns the currently-authenticated user. The 401 path
// is folded into the same discriminated-union pattern as AuthResponse so the
// client can branch without try/catching the 401 separately.
export type MeErrorCode = "unauthorized";

export interface MeSuccessResponse {
  user: PublicUser;
}

export interface MeErrorResponse {
  error: MeErrorCode;
}

export type MeResponse = MeSuccessResponse | MeErrorResponse;
