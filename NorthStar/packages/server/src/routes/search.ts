import { Hono } from "hono";
import { listSearchGapsFromDb, recordSearchLogInDb, searchContentFromDb } from "../data/postgres";
import { fail, ok } from "../lib/http";
import { authMiddleware, requireAuthUser, resolveAuthUser } from "../middleware/auth";

interface SearchLogBody {
  query?: string;
  resultCount?: number;
  usedAi?: boolean;
}

export const searchRoute = new Hono();

searchRoute.get("/api/search", async (c) => {
  const query = c.req.query("q")?.trim();

  if (!query) {
    return c.json({ error: "q is required" }, 400);
  }

  const result = await searchContentFromDb(query);

  if (!result) return c.json({ error: "Search failed" }, 500);

  return c.json(result);
});

searchRoute.post("/api/search/logs", async (c) => {
  let body: SearchLogBody = {};

  try {
    body = await c.req.json<SearchLogBody>();
  } catch {
    body = {};
  }

  if (!body.query?.trim()) {
    return c.json({ error: "query is required" }, 400);
  }

  const authUser = resolveAuthUser(c);
  const log = await recordSearchLogInDb({
    userId: authUser ? Number(authUser.sub) : null,
    query: body.query.trim(),
    resultCount: Number(body.resultCount ?? 0),
    usedAi: Boolean(body.usedAi),
  });

  if (!log) return c.json({ error: "Search log write failed" }, 500);

  return c.json({ log }, 201);
});

searchRoute.get("/api/search/gaps", authMiddleware, async (c) => {
  const actor = requireAuthUser(c);
  if (actor.role !== "reviewer" && actor.role !== "operator" && actor.role !== "admin") {
    return fail(c, 403, "SEARCH_GAPS_FORBIDDEN", "没有查看搜索缺口的权限");
  }

  const gaps = await listSearchGapsFromDb();
  if (!gaps) return fail(c, 500, "SEARCH_GAPS_FAILED", "搜索缺口报表生成失败");

  return ok(c, { items: gaps });
});
