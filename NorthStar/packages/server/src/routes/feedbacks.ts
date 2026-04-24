import { Hono } from "hono";
import { markArticleChangedInDb, markArticleHelpfulInDb } from "../data/postgres";
import { authMiddleware, requireAuthUser } from "../middleware/auth";
import { requireSiteContext } from "../middleware/site";
import { submitModerationTask } from "../modules/moderation/service";

interface ChangedBody {
  note?: string;
}

export const feedbacksRoute = new Hono();

feedbacksRoute.use("/api/articles/*", authMiddleware);

feedbacksRoute.post("/api/articles/:id/helpful", async (c) => {
  const id = c.req.param("id");
  const dbResult = await markArticleHelpfulInDb(id, Number(requireAuthUser(c).sub));

  if (dbResult) {
    return c.json(dbResult);
  }

  return c.json({ error: "Article not found" }, 404);
});

feedbacksRoute.post("/api/articles/:id/changed", async (c) => {
  const id = c.req.param("id");
  let body: ChangedBody = {};

  try {
    body = await c.req.json<ChangedBody>();
  } catch {
    body = {};
  }

  const note = body.note?.trim();

  if (!note) {
    return c.json({ error: "请填写变化说明" }, 400);
  }

  const actor = requireAuthUser(c);
  const dbResult = await markArticleChangedInDb(id, note, Number(actor.sub));

  if (dbResult) {
    await submitModerationTask(
      {
        site: requireSiteContext(c) === "com" ? "com" : "cn",
        type: "changed_feedback",
        targetType: "article",
        targetId: id,
        title: "内容变化反馈",
        reason: note,
        payload: {
          articleId: id,
          changedCount: dbResult.changedCount,
        },
      },
      actor,
    );

    return c.json(dbResult);
  }

  return c.json({ error: "文章不存在" }, 404);
});
