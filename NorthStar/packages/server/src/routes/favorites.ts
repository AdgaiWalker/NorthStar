import { Hono } from "hono";
import { createFavoriteInDb, getProfileFromDb } from "../data/postgres";
import { authMiddleware } from "../middleware/auth";
import { requireAuthUser } from "../middleware/auth";

export const favoritesRoute = new Hono();

favoritesRoute.use("/api/me/profile", authMiddleware);
favoritesRoute.use("/api/favorites", authMiddleware);

favoritesRoute.get("/api/me/profile", async (c) => {
  const profile = await getProfileFromDb(Number(requireAuthUser(c).sub));
  if (!profile) return c.json({ error: "Profile not found" }, 404);
  return c.json(profile);
});

favoritesRoute.post("/api/favorites", async (c) => {
  let body: { targetType?: "article" | "space"; targetId?: string } = {};
  try {
    body = await c.req.json();
  } catch {
    body = {};
  }

  if (body.targetType !== "article" && body.targetType !== "space") {
    return c.json({ error: "targetType must be article or space" }, 400);
  }

  if (!body.targetId?.trim()) {
    return c.json({ error: "targetId is required" }, 400);
  }

  const favorite = await createFavoriteInDb(Number(requireAuthUser(c).sub), {
    targetType: body.targetType,
    targetId: body.targetId.trim(),
  });

  if (!favorite) {
    return c.json({ error: "Target not found" }, 404);
  }

  return c.json({ favorite }, 201);
});
