export const ENDPOINTS = {
  AUTH: {
    SIGNUP: "/api/auth/signup",
    LOGIN: "/api/auth/login",
    ME: "/api/auth/me",
  },
  UPLOADS: {
    CREATE: "/api/uploads",
    LIST: "/api/uploads",
    DETAIL: (id: string) => `/api/uploads/${id}`,
    FILE: (id: string) => `/api/uploads/${id}/file`,
    STATE: (id: string, key: string) => `/api/uploads/${id}/state/${key}`,
  },
} as const;