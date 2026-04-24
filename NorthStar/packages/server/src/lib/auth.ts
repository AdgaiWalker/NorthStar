import { randomBytes, scryptSync, timingSafeEqual, createHmac } from "node:crypto";
import type { PlatformRole, SiteContext } from "@ns/shared";

const SCRYPT_OPTIONS = {
  N: 4096,
  r: 8,
  p: 1,
  maxmem: 16 * 1024 * 1024,
} as const;

export interface AuthTokenPayload {
  sub: string;
  name: string;
  username?: string;
  email?: string;
  site?: SiteContext;
  role?: PlatformRole;
  iat: string;
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64, SCRYPT_OPTIONS).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string | null | undefined) {
  if (!stored) return false;
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64, SCRYPT_OPTIONS);
  const target = Buffer.from(hash, "hex");
  return target.length === candidate.length && timingSafeEqual(candidate, target);
}

export function signToken(payload: Record<string, string>) {
  const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64Url(
    JSON.stringify({
      ...payload,
      iat: Math.floor(Date.now() / 1000).toString(),
    }),
  );
  const secret = process.env.JWT_SECRET ?? "frontlife-dev-secret";
  const signature = createHmac("sha256", secret).update(`${header}.${body}`).digest("base64url");

  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): AuthTokenPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [header, body, signature] = parts;
  const secret = process.env.JWT_SECRET ?? "frontlife-dev-secret";
  const expected = createHmac("sha256", secret).update(`${header}.${body}`).digest("base64url");

  if (signature !== expected) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as AuthTokenPayload;
    return payload?.sub ? payload : null;
  } catch {
    return null;
  }
}

function base64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}
