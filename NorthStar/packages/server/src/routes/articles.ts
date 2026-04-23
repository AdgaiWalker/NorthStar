import { Hono } from "hono";
import { createArticleInDb, getArticleDetailFromDb } from "../data/postgres";
import { db } from "../db/client";
import { authMiddleware, requireAuthUser } from "../middleware/auth";
import { getPermissionStateForUser } from "../lib/permissions";

interface CreateArticleBody {
  spaceId?: string;
  title?: string;
  content?: string;
  authorName?: string;
}

export const articlesRoute = new Hono();

articlesRoute.use("/api/articles", authMiddleware);

articlesRoute.get("/api/articles/:id", async (c) => {
  const id = c.req.param("id");
  const detail = await getArticleDetailFromDb(id);

  if (detail) {
    return c.json(detail);
  }

  return c.json({ error: "Article not found" }, 404);
});

articlesRoute.post("/api/articles", async (c) => {
  let body: CreateArticleBody = {};

  try {
    body = await c.req.json<CreateArticleBody>();
  } catch {
    body = {};
  }

  if (!body.spaceId?.trim()) return c.json({ error: "spaceId is required" }, 400);
  if (!body.title?.trim()) return c.json({ error: "title is required" }, 400);
  if (!body.content?.trim()) return c.json({ error: "content is required" }, 400);

  const authUser = requireAuthUser(c);
  const userId = Number(authUser.sub);
  const permissionState = await getPermissionStateForUser({
    isAuthenticated: true,
    userId,
  });

  if (!db) return c.json({ error: "Database unavailable" }, 500);

  if (!permissionState.permissions.canWrite) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const article = await createArticleInDb(userId, {
    spaceId: body.spaceId.trim(),
    title: body.title.trim(),
    content: body.content.trim(),
  });

  if (!article) return c.json({ error: "Space not found" }, 404);

  return c.json({ article }, 201);
});
