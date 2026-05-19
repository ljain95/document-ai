import Cookies from "js-cookie";
import { api, type ApiError } from "@/network/core/api";
import { ENDPOINTS } from "@/constants/endpoints";
import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_TTL_DAYS,
} from "@/constants/auth";
import type { LoginRequest, SignupRequest } from "@/@types/request/auth";
import type {
  AuthErrorResponse,
  AuthResponse,
  AuthSuccessResponse,
  MeErrorResponse,
  MeResponse,
  MeSuccessResponse,
} from "@/@types/response/auth";

function persist(token: string) {
  Cookies.set(ACCESS_TOKEN_COOKIE, token, {
    expires: ACCESS_TOKEN_TTL_DAYS,
    sameSite: "lax",
    secure:
      typeof window !== "undefined" && window.location.protocol === "https:",
  });
}

// api.post throws on non-2xx with the parsed body in error.response.data.
// Convert that throw back into our flat AuthResponse discriminated union so
// form callers can branch on `isAuthSuccess` without try/catching twice.
async function authRequest(
  url: string,
  body: LoginRequest | SignupRequest,
): Promise<AuthResponse> {
  try {
    const { data } = await api.post<AuthSuccessResponse>(url, body);
    persist(data.token);
    return data;
  } catch (err) {
    const apiErr = err as ApiError;
    const payload = apiErr.response?.data as AuthErrorResponse | undefined;
    if (payload && typeof payload === "object" && "error" in payload) {
      return payload;
    }
    // Transport failure (offline, DNS, etc.) — let the form catch.
    throw err;
  }
}

export function login(body: LoginRequest): Promise<AuthResponse> {
  return authRequest(ENDPOINTS.AUTH.LOGIN, body);
}

export function signup(body: SignupRequest): Promise<AuthResponse> {
  return authRequest(ENDPOINTS.AUTH.SIGNUP, body);
}

export function getToken(): string | undefined {
  return Cookies.get(ACCESS_TOKEN_COOKIE);
}

export function logout(): void {
  Cookies.remove(ACCESS_TOKEN_COOKIE);
}

export function isAuthSuccess(res: AuthResponse): res is AuthSuccessResponse {
  return !("error" in res);
}

// GET /api/auth/me — hydrates the current user. api.get throws on non-2xx;
// we collapse the typed 401 body back into the discriminated union so callers
// branch with isMeSuccess instead of try/catch. Note: the global 401 handler
// in core/api.ts already kicks unauthenticated callers to /login before this
// returns, so the error branch here is a defensive narrow.
export async function getMe(): Promise<MeResponse> {
  try {
    const { data } = await api.get<MeSuccessResponse>(ENDPOINTS.AUTH.ME);
    return data;
  } catch (err) {
    const payload = (err as ApiError).response?.data as
      | MeErrorResponse
      | undefined;
    if (payload && typeof payload === "object" && "error" in payload) {
      return payload;
    }
    throw err;
  }
}

export function isMeSuccess(res: MeResponse): res is MeSuccessResponse {
  return !("error" in res);
}
