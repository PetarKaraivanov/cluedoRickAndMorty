// Shared constants between middleware (Edge runtime) and the Node auth helpers.
// The Edge runtime can't import the crypto-based helpers in lib/auth.ts, so the
// middleware only checks the cookie *shape*. The full HMAC verification happens
// in the /api/* route handlers running on Node.
export const AUTH_COOKIE = "rm_cluedo_auth";
