import { Hono } from "hono";
import { listFeedFromDb } from "../data/postgres";

export const feedRoute = new Hono();

feedRoute.get("/api/feed", async (c) => {
  const page = Number(c.req.query("page") ?? 1);
  const pageSize = Number(c.req.query("pageSize") ?? 6);

  const feed = await listFeedFromDb(page, pageSize);

  if (!feed) return c.json({ error: "Feed query failed" }, 500);

  return c.json(feed);
});
