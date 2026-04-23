import { Hono } from "hono";
import { createPostInDb, createReplyInDb, listPostsBySpaceFromDb, markPostSolvedInDb } from "../data/postgres";
import { authMiddleware, requireAuthUser } from "../middleware/auth";
import { getPermissionStateForUser } from "../lib/permissions";

interface CreatePostBody {
  spaceId?: string;
  content?: string;
  tags?: string[];
  authorName?: string;
}

export const postsRoute = new Hono();

postsRoute.use("/api/posts", authMiddleware);
postsRoute.use("/api/posts/*", authMiddleware);

postsRoute.get("/api/spaces/:id/posts", async (c) => {
  const id = c.req.param("id");
  const dbPosts = await listPostsBySpaceFromDb(id);

  if (dbPosts) {
    return c.json({ posts: dbPosts });
  }

  return c.json({ error: "Space not found" }, 404);
});

postsRoute.post("/api/posts", async (c) => {
  let body: CreatePostBody;

  try {
    body = await c.req.json<CreatePostBody>();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  if (!body.content?.trim()) {
    return c.json({ error: "content is required" }, 400);
  }

  const authUser = requireAuthUser(c);
  const permissionState = await getPermissionStateForUser({
    isAuthenticated: true,
    userId: Number(authUser.sub),
  });

  if (!permissionState.permissions.canPost) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const post =
    await createPostInDb({
      spaceId: body.spaceId,
      content: body.content.trim(),
      tags: body.tags,
      userId: Number(authUser.sub),
    });

  if (!post) return c.json({ error: "Space not found" }, 404);

  return c.json({ post }, 201);
});

postsRoute.post("/api/posts/:id/replies", async (c) => {
  const id = c.req.param("id");
  let body: { content?: string } = {};

  try {
    body = await c.req.json<{ content?: string }>();
  } catch {
    body = {};
  }

  if (!body.content?.trim()) {
    return c.json({ error: "content is required" }, 400);
  }

  const authUser = requireAuthUser(c);
  const reply = await createReplyInDb(id, body.content.trim(), Number(authUser.sub), authUser.name);

  if (!reply) {
    return c.json({ error: "Post not found" }, 404);
  }

  return c.json({ reply }, 201);
});

postsRoute.post("/api/posts/:id/solve", async (c) => {
  const id = c.req.param("id");
  const dbPost = await markPostSolvedInDb(id, Number(requireAuthUser(c).sub));

  if (dbPost) {
    return c.json({ post: dbPost });
  }

  return c.json({ error: "Post not found" }, 404);
});
