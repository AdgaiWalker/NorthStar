import { createMiddleware } from "hono/factory";
import type { Context } from "hono";
import { verifyToken, type AuthTokenPayload } from "../lib/auth";
import { resolveSiteContext } from "./site";

declare module "hono" {
  interface ContextVariableMap {
    authUser: AuthTokenPayload;
  }
}

export const authMiddleware = createMiddleware(async (c, next) => {
  const authUser = resolveAuthUser(c);

  if (!authUser) {
    return c.json({ error: "请先登录后再继续操作" }, 401);
  }

  const siteContext = c.get("siteContext") ?? resolveSiteContext(c);

  if (siteContext === "all" && authUser.role !== "admin") {
    return c.json({ error: "没有跨站访问权限" }, 403);
  }

  if (authUser.site && siteContext !== "all" && authUser.site !== siteContext) {
    return c.json({ error: "登录状态不属于当前站点，请重新登录" }, 401);
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
