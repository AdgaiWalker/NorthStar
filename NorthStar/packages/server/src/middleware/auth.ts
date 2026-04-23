import { createMiddleware } from "hono/factory";
import type { Context } from "hono";
import { verifyToken, type AuthTokenPayload } from "../lib/auth";

declare module "hono" {
  interface ContextVariableMap {
    authUser: AuthTokenPayload;
  }
}

export const authMiddleware = createMiddleware(async (c, next) => {
  const authUser = resolveAuthUser(c);

  if (!authUser) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("authUser", authUser);
  await next();
});

export function resolveAuthUser(c: Context) {
  const header = c.req.header("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  return verifyToken(token);
}

export function requireAuthUser(c: Context) {
  return c.get("authUser");
}
