import { Hono } from "hono";
import { createReportInDb } from "../data/postgres";
import { authMiddleware } from "../middleware/auth";
import { requireAuthUser } from "../middleware/auth";

interface ReportBody {
  targetType?: "article" | "post";
  targetId?: string;
  reason?: string;
}

export const reportsRoute = new Hono();

reportsRoute.use("/api/reports", authMiddleware);

reportsRoute.post("/api/reports", async (c) => {
  let body: ReportBody = {};

  try {
    body = await c.req.json<ReportBody>();
  } catch {
    body = {};
  }

  if (body.targetType !== "article" && body.targetType !== "post") {
    return c.json({ error: "targetType must be article or post" }, 400);
  }

  if (!body.targetId?.trim()) {
    return c.json({ error: "targetId is required" }, 400);
  }

  if (!body.reason?.trim()) {
    return c.json({ error: "reason is required" }, 400);
  }

  const report = await createReportInDb(Number(requireAuthUser(c).sub), {
    targetType: body.targetType,
    targetId: body.targetId.trim(),
    reason: body.reason.trim(),
  });

  if (!report) return c.json({ error: "Target not found" }, 404);

  return c.json({ report }, 201);
});
