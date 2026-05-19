"use client";

import Cookies from "js-cookie";
import { ACCESS_TOKEN_COOKIE } from "@/constants/auth";

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  headers: Headers;
}

export interface ApiError extends Error {
  response?: { status: number; data: unknown; headers: Headers };
  config?: { url: string; method: string };
}

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

// Endpoint constants in @/constants/endpoints are stored as absolute paths
// ("/api/..."); plain relative paths get the /api/ prefix for convenience.
function buildUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith("/")) return path;
  return `/api/${path}`;
}

function serializeBody(
  body: unknown,
  headers: Record<string, string>,
): BodyInit | undefined {
  if (body === undefined || body === null) return undefined;
  if (
    typeof body === "string" ||
    body instanceof FormData ||
    body instanceof Blob ||
    body instanceof ArrayBuffer ||
    body instanceof URLSearchParams
  ) {
    return body as BodyInit;
  }
  headers["Content-Type"] = "application/json";
  return JSON.stringify(body);
}

async function parseBody(res: Response): Promise<unknown> {
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return res.json().catch(() => undefined);
  }
  const text = await res.text();
  return text === "" ? undefined : text;
}

// A 401 from any authenticated endpoint usually means the token expired —
// clear it and bounce to /login with a redirect-back hint. Skip this when
// we're already on an auth page so a bad-password attempt doesn't unmount
// its own form mid-keystroke.
function onUnauthorized() {
  Cookies.remove(ACCESS_TOKEN_COOKIE);
  if (typeof window === "undefined") return;
  const path = window.location.pathname;
  if (path.startsWith("/login") || path.startsWith("/signup")) return;
  window.location.href = `/login?redirect=${encodeURIComponent(path)}`;
}

async function request<T>(
  method: HttpMethod,
  path: string,
  body?: unknown,
): Promise<ApiResponse<T>> {
  const url = buildUrl(path);
  const headers: Record<string, string> = {};

  const token = Cookies.get(ACCESS_TOKEN_COOKIE);
  if (token) headers.Authorization = `Bearer ${token}`;

  const init: RequestInit = { method, headers };
  if (method !== "GET" && method !== "DELETE") {
    init.body = serializeBody(body, headers);
  }

  const res = await fetch(url, init);
  const data = await parseBody(res);

  if (!res.ok) {
    if (res.status === 401) onUnauthorized();
    const error = new Error(
      `Request failed with status ${res.status}`,
    ) as ApiError;
    error.response = { status: res.status, data, headers: res.headers };
    error.config = { url, method };
    throw error;
  }

  return { data: data as T, status: res.status, headers: res.headers };
}

const api = {
  get: <T = unknown>(url: string) => request<T>("GET", url),
  post: <T = unknown>(url: string, body?: unknown) => request<T>("POST", url, body),
  put: <T = unknown>(url: string, body?: unknown) => request<T>("PUT", url, body),
  patch: <T = unknown>(url: string, body?: unknown) => request<T>("PATCH", url, body),
  delete: <T = unknown>(url: string) => request<T>("DELETE", url),
};

export default api;
export { api };
