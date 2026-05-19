// Inbound DTOs for /api/auth/*. The route handlers still validate at runtime
// (TypeScript types are erased), but they parse into these shapes.

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}
