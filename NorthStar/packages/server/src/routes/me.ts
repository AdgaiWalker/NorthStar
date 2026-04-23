import { Hono } from "hono";
import type { PermissionResponse } from "@ns/shared";
import { resolveAuthUser } from "../middleware/auth";
import { getPermissionStateForUser } from "../lib/permissions";

export const meRoute = new Hono();

meRoute.get("/api/me/permissions", async (c) => {
  const authUser = resolveAuthUser(c);
  const state = await getPermissionStateForUser({
    isAuthenticated: Boolean(authUser),
    userId: authUser ? Number(authUser.sub) : null,
  });

  return c.json(state.permissions satisfies PermissionResponse);
});
