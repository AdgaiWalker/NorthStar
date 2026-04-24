import { Hono } from "hono";
import type { Context } from "hono";
import { SiteAccessError } from "../../db/site-aware";
import { fail, ok } from "../../lib/http";
import { authMiddleware, requireAuthUser } from "../../middleware/auth";
import { requireSiteContext } from "../../middleware/site";
import {
  changeDeletionRequestStatus,
  CompliancePermissionError,
  getComplianceModuleStatus,
  readDeletionRequests,
  readLegalDocuments,
  readUserDataExport,
  recordConsent,
  submitDeletionRequest,
} from "./service";
import type { AccountDeletionRequestInput, AccountDeletionStatus, ConsentRequest } from "./types";

export const complianceRoute = new Hono();

complianceRoute.get("/api/compliance/health", (c) => ok(c, getComplianceModuleStatus()));

complianceRoute.get("/api/compliance/legal-documents", async (c) => {
  const documents = await readLegalDocuments(requireSiteContext(c), c.req.query("type"));
  return ok(c, { items: documents });
});

complianceRoute.post("/api/compliance/consents", authMiddleware, async (c) => {
  const result = await recordConsent(requireAuthUser(c), await readJson<ConsentRequest>(c));
  return sendResult(c, result);
});

complianceRoute.get("/api/compliance/data-export", authMiddleware, async (c) => {
  const result = await readUserDataExport(requireAuthUser(c));
  return sendResult(c, result);
});

complianceRoute.post("/api/compliance/account-deletions", authMiddleware, async (c) => {
  const result = await submitDeletionRequest(requireAuthUser(c), await readJson<AccountDeletionRequestInput>(c));
  return sendResult(c, result, 201);
});

complianceRoute.get("/api/compliance/account-deletions", authMiddleware, async (c) => {
  try {
    const result = await readDeletionRequests(requireSiteContext(c), requireAuthUser(c));
    return sendResult(c, result);
  } catch (error) {
    return handleKnownError(c, error);
  }
});

complianceRoute.patch("/api/compliance/account-deletions/:id/status", authMiddleware, async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) return fail(c, 400, "VALIDATION_ERROR", "注销申请 ID 不正确");

  const body = await readJson<{ status?: AccountDeletionStatus }>(c);
  if (!isDeletionStatus(body.status)) return fail(c, 400, "VALIDATION_ERROR", "请提供正确的注销处理状态");

  try {
    const result = await changeDeletionRequestStatus(requireSiteContext(c), requireAuthUser(c), id, body.status);
    return sendResult(c, result);
  } catch (error) {
    return handleKnownError(c, error);
  }
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
  result: { ok: boolean; data?: T; error?: { code: string; message: string; status: 400 | 401 | 403 | 404 | 503 } },
  successStatus: 200 | 201 = 200,
) {
  if (!result.ok || result.error) {
    return fail(c, result.error?.status ?? 400, result.error?.code ?? "REQUEST_FAILED", result.error?.message ?? "请求失败");
  }

  return ok(c, result.data as T, successStatus);
}

function handleKnownError(c: Context, error: unknown) {
  if (error instanceof SiteAccessError) return fail(c, error.status, "SITE_FORBIDDEN", error.message);
  if (error instanceof CompliancePermissionError) return fail(c, error.status, "COMPLIANCE_FORBIDDEN", error.message);
  throw error;
}

function isDeletionStatus(value: unknown): value is AccountDeletionStatus {
  return value === "pending" || value === "in_review" || value === "processing" || value === "completed" || value === "rejected";
}
