import { Hono } from "hono";
import type { Context } from "hono";
import { fail, ok } from "../../lib/http";
import { authMiddleware, requireAuthUser, resolveAuthUser } from "../../middleware/auth";
import {
  createAdminInviteCode,
  confirmPasswordReset,
  finishGitHubOAuth,
  getGitHubOAuthStatus,
  getIdentityModuleStatus,
  loginIdentity,
  readIdentityMe,
  registerIdentity,
  requestPasswordReset,
  startGitHubOAuth,
  submitApplicationRequest,
  verifyIdentityEmail,
} from "./service";
import type {
  ApplicationRequestInput,
  CreateInviteCodeRequest,
  EmailVerificationRequest,
  GitHubOAuthStartRequest,
  LoginRequest,
  PasswordResetConfirmRequest,
  PasswordResetRequest,
  RegisterRequest,
} from "./types";

export const identityRoute = new Hono();

identityRoute.get("/api/identity/health", (c) => ok(c, getIdentityModuleStatus()));

identityRoute.get("/api/identity/oauth/github/status", (c) => ok(c, getGitHubOAuthStatus()));

identityRoute.post("/api/identity/oauth/github/start", async (c) => {
  const body = await readJson<GitHubOAuthStartRequest>(c);
  const result = await startGitHubOAuth(body, resolveAuthUser(c));
  return sendResult(c, result);
});

identityRoute.get("/api/identity/oauth/github/callback", async (c) => {
  const result = await finishGitHubOAuth({
    code: c.req.query("code"),
    state: c.req.query("state"),
    error: c.req.query("error"),
    errorDescription: c.req.query("error_description"),
  });
  return c.redirect(result.redirectUrl, 302);
});

identityRoute.post("/api/identity/register", async (c) => {
  const body = await readJson<RegisterRequest>(c);
  const result = await registerIdentity(body);
  return sendResult(c, result, 201);
});

identityRoute.post("/api/identity/applications", async (c) => {
  const body = await readJson<ApplicationRequestInput>(c);
  const result = await submitApplicationRequest(body);
  return sendResult(c, result, 201);
});

identityRoute.post("/api/identity/invites", authMiddleware, async (c) => {
  const body = await readJson<CreateInviteCodeRequest>(c);
  const result = await createAdminInviteCode(body, requireAuthUser(c));
  return sendResult(c, result, 201);
});

identityRoute.post("/api/identity/login", async (c) => {
  const body = await readJson<LoginRequest>(c);
  const result = await loginIdentity(body);
  return sendResult(c, result);
});

identityRoute.get("/api/identity/me", authMiddleware, async (c) => {
  const result = await readIdentityMe(requireAuthUser(c));
  return sendResult(c, result);
});

identityRoute.post("/api/identity/email/verify", async (c) => {
  const body = await readJson<EmailVerificationRequest>(c);
  const result = await verifyIdentityEmail(body);
  return sendResult(c, result);
});

identityRoute.post("/api/identity/password-reset/request", async (c) => {
  const body = await readJson<PasswordResetRequest>(c);
  const result = await requestPasswordReset(body);
  return sendResult(c, result);
});

identityRoute.post("/api/identity/password-reset/confirm", async (c) => {
  const body = await readJson<PasswordResetConfirmRequest>(c);
  const result = await confirmPasswordReset(body);
  return sendResult(c, result);
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
  result: { ok: boolean; data?: T; error?: { code: string; message: string; status: 400 | 401 | 403 | 404 | 409 | 410 | 503 } },
  successStatus: 200 | 201 = 200,
) {
  if (!result.ok || result.error) {
    return fail(c, result.error?.status ?? 400, result.error?.code ?? "REQUEST_FAILED", result.error?.message ?? "请求失败");
  }

  return ok(c, result.data as T, successStatus);
}
