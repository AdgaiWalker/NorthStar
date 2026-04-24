import { Hono } from "hono";
import { SiteAccessError } from "../../db/site-aware";
import { authMiddleware, requireAuthUser } from "../../middleware/auth";
import { requireSiteContext } from "../../middleware/site";
import { readAdminSummary, readAuditLogs, readSiteConfigs } from "./service";

export const platformRoute = new Hono();

platformRoute.use("/api/admin/*", authMiddleware);

platformRoute.get("/api/admin/summary", async (c) => {
  try {
    const summary = await readAdminSummary(requireSiteContext(c), requireAuthUser(c));
    return c.json({ ok: true, data: summary });
  } catch (error) {
    if (error instanceof SiteAccessError) return c.json({ ok: false, error: error.message }, error.status);
    throw error;
  }
});

platformRoute.get("/api/admin/audit-logs", async (c) => {
  try {
    const auditLogs = await readAuditLogs(requireSiteContext(c), requireAuthUser(c));
    return c.json({ ok: true, data: { items: auditLogs } });
  } catch (error) {
    if (error instanceof SiteAccessError) return c.json({ ok: false, error: error.message }, error.status);
    throw error;
  }
});

platformRoute.get("/api/admin/site-configs", async (c) => {
  try {
    const configs = await readSiteConfigs(requireSiteContext(c), requireAuthUser(c));
    return c.json({ ok: true, data: { items: configs } });
  } catch (error) {
    if (error instanceof SiteAccessError) return c.json({ ok: false, error: error.message }, error.status);
    throw error;
  }
});
