import cookie from "cookie";
import { createHmac, timingSafeEqual } from "crypto";
import { AUTH_COOKIE } from "./auth-shared";

export { AUTH_COOKIE };
const SESSION_TTL_SEC = 60 * 60 * 24 * 7;

function getSecret(): string {
  const s = process.env.AUTH_SECRET || "dev-fallback-secret-change-me";
  if (s.length < 16 && process.env.NODE_ENV === "production") {
    console.warn("[auth] AUTH_SECRET is short; please set a long random value.");
  }
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

export function makeSessionCookie(): string {
  const expires = Math.floor(Date.now() / 1000) + SESSION_TTL_SEC;
  const payload = `auth.${expires}`;
  const sig = sign(payload);
  const value = `${payload}.${sig}`;
  return cookie.serialize(AUTH_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SEC,
  });
}

export function clearSessionCookie(): string {
  return cookie.serialize(AUTH_COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
}

export function verifyRequest(req: Request): boolean {
  const cookieHeader = req.headers.get("cookie") || "";
  const cookies = cookie.parse(cookieHeader);
  const value = cookies[AUTH_COOKIE];
  if (!value) return false;
  const parts = value.split(".");
  if (parts.length !== 3 || parts[0] !== "auth") return false;
  const expires = Number(parts[1]);
  if (!expires || expires < Math.floor(Date.now() / 1000)) return false;
  const sig = sign(`${parts[0]}.${parts[1]}`);
  try {
    return timingSafeEqual(Buffer.from(sig), Buffer.from(parts[2]));
  } catch {
    return false;
  }
}

export function verifyPassword(pw: string): boolean {
  const expected = process.env.APP_PASSWORD;
  if (!expected) return false;
  try {
    return timingSafeEqual(Buffer.from(pw), Buffer.from(expected));
  } catch {
    return false;
  }
}

export const SESSION_TTL = SESSION_TTL_SEC;
