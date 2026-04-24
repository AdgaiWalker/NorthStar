import { Hono } from "hono";
import type { Context } from "hono";
import { fail, ok } from "../../lib/http";
import { authMiddleware, requireAuthUser } from "../../middleware/auth";
import { requireSiteContext } from "../../middleware/site";
import { getCampusModuleStatus, submitCampusSpace } from "./service";
import type { CreateCampusSpaceRequest } from "./types";

export const campusRoute = new Hono();

campusRoute.get("/api/campus/health", (c) => ok(c, getCampusModuleStatus()));

campusRoute.post("/api/campus/spaces", authMiddleware, async (c) => {
  const result = await submitCampusSpace(
    requireSiteContext(c),
    requireAuthUser(c),
    await readJson<CreateCampusSpaceRequest>(c),
  );
  return sendResult(c, result, 201);
});

async function readJson<T>(c: Context): Promise<T> {
  try {
    return await c.req.json<T>();
  } catch {
    return {} as T;
  }
}

function sendResult<T>(
  c: Context,
  result: { ok: boolean; data?: T; error?: { code: string; message: string; status: 400 | 401 | 403 | 409 | 503 } },
  successStatus: 200 | 201 = 200,
) {
  if (!result.ok || result.error) {
    return fail(c, result.error?.status ?? 400, result.error?.code ?? "REQUEST_FAILED", result.error?.message ?? "请求失败");
  }

  return ok(c, result.data as T, successStatus);
}
