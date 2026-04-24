import { createMiddleware } from "hono/factory";
import type { Context } from "hono";
import { isSiteContext, type SiteContext } from "@ns/shared";

declare module "hono" {
  interface ContextVariableMap {
    siteContext: SiteContext;
  }
}

export const siteMiddleware = createMiddleware(async (c, next) => {
  c.set("siteContext", resolveSiteContext(c));
  await next();
});

export function resolveSiteContext(c: Context): SiteContext {
  const raw = c.req.header("x-pangen-site") ?? c.req.query("site") ?? process.env.SITE ?? "cn";
  return isSiteContext(raw) ? raw : "cn";
}

export function requireSiteContext(c: Context): SiteContext {
  return c.get("siteContext") ?? resolveSiteContext(c);
}

export function toDataSite(site: SiteContext) {
  return site === "all" ? null : site;
}
