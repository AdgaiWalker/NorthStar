import { Hono } from "hono";
import { getSpaceDetailFromDb, listSpacesFromDb } from "../data/postgres";

export const spacesRoute = new Hono();

spacesRoute.get("/api/spaces", async (c) => {
  const spaces = await listSpacesFromDb();
  if (!spaces) return c.json({ error: "Spaces query failed" }, 500);
  return c.json({ spaces });
});

spacesRoute.get("/api/spaces/:id", async (c) => {
  const id = c.req.param("id");
  const detail = await getSpaceDetailFromDb(id);

  if (detail) {
    return c.json(detail);
  }

  return c.json({ error: "Space not found" }, 404);
});
