import { Hono } from "hono";
import { recordSearchLogInDb, searchContentFromDb } from "../data/postgres";
import { resolveAuthUser } from "../middleware/auth";

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
