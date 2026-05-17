"use client";

import Cookie from 'js-cookie'

export interface ApiResponse<T = unknown> {
  data: T
  status: number
  headers: Headers
}

export interface ApiError extends Error {
  response?: { status: number; data: unknown; headers: Headers }
  config?: { url: string; method: string }
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

function buildUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  return `/api/${path}`
}

function serializeBody(
  body: unknown,
  headers: Record<string, string>,
): BodyInit | undefined {
  if (body === undefined || body === null) return undefined
  if (
    typeof body === 'string' ||
    body instanceof FormData ||
    body instanceof Blob ||
    body instanceof ArrayBuffer ||
    body instanceof URLSearchParams
  ) {
    return body as BodyInit
  }
  headers['Content-Type'] = 'application/json'
  return JSON.stringify(body)
}

async function parseBody(res: Response): Promise<unknown> {
  const contentType = res.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    return res.json().catch(() => undefined)
  }
  const text = await res.text()
  return text === '' ? undefined : text
}

async function request<T>(
  method: HttpMethod,
  path: string,
  body?: unknown,
): Promise<ApiResponse<T>> {
  const url = buildUrl(path)
  const headers: Record<string, string> = {}

  const token = Cookie.get('cleartaxAccessToken')
  if (token) headers.Authorization = `Bearer ${token}`

  const init: RequestInit = { method, headers }
  if (method !== 'GET' && method !== 'DELETE') {
    init.body = serializeBody(body, headers)
  }


  let res: Response
  try {
    res = await fetch(url, init)
  } catch (err) {
    throw err
  }

  const data = await parseBody(res)

  if (!res.ok) {
    if (res.status === 401) {
      Cookie.remove('cleartaxAccessToken')
      Cookie.remove('cleartaxLoggedIn')
      const redirect = window.location.pathname
      window.location.href = '/login?redirect=' + redirect
    }
    const error = new Error(`Request failed with status ${res.status}`) as ApiError
    error.response = { status: res.status, data, headers: res.headers }
    error.config = { url, method }
    throw error
  }

  span?.end()
  return { data: data as T, status: res.status, headers: res.headers }
}

const api = {
  get: <T = unknown>(url: string) => request<T>('GET', url),
  post: <T = unknown>(url: string, body?: unknown) => request<T>('POST', url, body),
  put: <T = unknown>(url: string, body?: unknown) => request<T>('PUT', url, body),
  patch: <T = unknown>(url: string, body?: unknown) => request<T>('PATCH', url, body),
  delete: <T = unknown>(url: string) => request<T>('DELETE', url),
}

export default api
export { api }
