// Cookie name that holds the access JWT. Read on the server via next/headers
// (src/lib/session.ts) and written on the client via js-cookie
// (src/network/auth.ts). Never inline this string elsewhere.
export const ACCESS_TOKEN_COOKIE = "access_token";

// Days the cookie should live for — matches the JWT TTL in src/lib/auth.ts so
// the browser drops the token at the same moment the server stops accepting it.
export const ACCESS_TOKEN_TTL_DAYS = 7;
