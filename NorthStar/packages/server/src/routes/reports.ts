import { Hono } from "hono";
import { createReportInDb } from "../data/postgres";
import { authMiddleware } from "../middleware/auth";
import { requireAuthUser } from "../middleware/auth";
import { requireSiteContext } from "../middleware/site";
import { submitModerationTask } from "../modules/moderation/service";

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
    return c.json({ error: "举报对象类型必须是文章或帖子" }, 400);
  }

  if (!body.targetId?.trim()) {
    return c.json({ error: "请提供举报对象" }, 400);
  }

  if (!body.reason?.trim()) {
    return c.json({ error: "请填写举报原因" }, 400);
  }

  const actor = requireAuthUser(c);
  const report = await createReportInDb(Number(actor.sub), {
    targetType: body.targetType,
    targetId: body.targetId.trim(),
    reason: body.reason.trim(),
  });

  if (!report) return c.json({ error: "举报对象不存在" }, 404);

  await submitModerationTask(
    {
      site: requireSiteContext(c) === "com" ? "com" : "cn",
      type: "report",
      targetType: body.targetType,
      targetId: body.targetId.trim(),
      title: body.targetType === "article" ? "文章举报" : "帖子举报",
      reason: body.reason.trim(),
      payload: { reportId: report.id },
    },
    actor,
  );

  return c.json({ report }, 201);
});
