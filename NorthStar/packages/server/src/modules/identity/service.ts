import { randomBytes } from "node:crypto";
import type { SiteContext } from "@ns/shared";
import { hashPassword, signToken, verifyPassword, type AuthTokenPayload } from "../../lib/auth";
import {
  createIdentityUser,
  findUserByAccount,
  findUserById,
  readIdentityModuleStatus,
  resetPasswordByToken,
  setPasswordResetToken,
  toIdentityUser,
  verifyEmailToken,
} from "./repository";
import type {
  EmailVerificationRequest,
  IdentityMeResponse,
  IdentitySession,
  LoginRequest,
  PasswordResetConfirmRequest,
  PasswordResetConfirmResponse,
  PasswordResetRequest,
  PasswordResetRequestResponse,
  RegisterRequest,
} from "./types";

export function getIdentityModuleStatus() {
  return readIdentityModuleStatus();
}

export async function registerIdentity(input: RegisterRequest): Promise<Result<IdentitySession>> {
  const validation = validateRegisterInput(input);
  if (validation) return err("VALIDATION_ERROR", validation, 400);

  const site = toConcreteSite(input.site);
  const existing = await findUserByAccount(site, input.username.trim());
  const existingEmail = await findUserByAccount(site, input.email.trim().toLowerCase());
  if (existing || existingEmail) return err("IDENTITY_EXISTS", "用户名或邮箱已被使用", 409);

  const user = await createIdentityUser({
    username: input.username.trim(),
    email: input.email.trim().toLowerCase(),
    site,
    consentVersion: input.consentVersion,
    passwordHash: hashPassword(input.password),
    emailVerificationToken: randomToken(),
    emailVerificationExpiresAt: afterHours(24),
  });

  if (!user) return err("DATABASE_UNAVAILABLE", "数据库未连接，无法注册", 503);

  return ok(toSession(user));
}

export async function loginIdentity(input: LoginRequest): Promise<Result<IdentitySession>> {
  const validation = validateLoginInput(input);
  if (validation) return err("VALIDATION_ERROR", validation, 400);

  const user = await findUserByAccount(toConcreteSite(input.site), input.account.trim().toLowerCase());
  if (!user || !verifyPassword(input.password, user.passwordHash)) {
    return err("INVALID_CREDENTIALS", "用户名、邮箱或密码不正确", 401);
  }

  if (user.disabledAt) return err("ACCOUNT_DISABLED", "账号已停用，请联系管理员", 403);

  return ok(toSession(user));
}

export async function readIdentityMe(actor: AuthTokenPayload): Promise<Result<IdentityMeResponse>> {
  const userId = Number(actor.sub);
  if (!Number.isInteger(userId)) return err("INVALID_TOKEN", "登录状态已失效，请重新登录", 401);

  const user = await findUserById(userId);
  if (!user) return err("USER_NOT_FOUND", "用户不存在", 404);

  return ok({ user: toIdentityUser(user) });
}

export async function verifyIdentityEmail(input: EmailVerificationRequest) {
  if (!input.token?.trim()) return err("VALIDATION_ERROR", "请提供邮箱验证 token", 400);

  const result = await verifyEmailToken(input.token.trim());
  if (!result) return err("TOKEN_NOT_FOUND", "邮箱验证链接无效", 404);
  if (result.expired) return err("TOKEN_EXPIRED", "邮箱验证链接已过期", 410);

  return ok({ user: toIdentityUser(result.user) });
}

export async function requestPasswordReset(input: PasswordResetRequest): Promise<Result<PasswordResetRequestResponse>> {
  if (!input.email?.trim()) return err("VALIDATION_ERROR", "请填写邮箱", 400);
  if (input.site !== "cn" && input.site !== "com") return err("VALIDATION_ERROR", "请提供具体站点", 400);

  const user = await findUserByAccount(input.site, input.email.trim().toLowerCase());
  if (!user) return ok({ message: "如果邮箱存在，重置链接会发送到该邮箱" });

  const resetToken = randomToken();
  await setPasswordResetToken(user.id, resetToken, afterHours(2));

  return ok({
    resetToken,
    message: "密码重置链接已生成",
  });
}

export async function confirmPasswordReset(
  input: PasswordResetConfirmRequest,
): Promise<Result<PasswordResetConfirmResponse>> {
  if (!input.token?.trim()) return err("VALIDATION_ERROR", "请提供密码重置 token", 400);
  if (!input.password || input.password.length < 6) return err("VALIDATION_ERROR", "密码至少需要 6 位", 400);

  const result = await resetPasswordByToken(input.token.trim(), hashPassword(input.password));
  if (!result) return err("TOKEN_NOT_FOUND", "密码重置链接无效", 404);
  if (result.expired) return err("TOKEN_EXPIRED", "密码重置链接已过期", 410);

  return ok({ message: "密码已重置，请重新登录" });
}

function toSession(user: Parameters<typeof toIdentityUser>[0]): IdentitySession {
  const identity = toIdentityUser(user);

  return {
    token: signToken({
      sub: identity.id,
      name: identity.name,
      username: identity.username,
      email: identity.email,
      site: identity.site,
      role: identity.role,
    }),
    user: identity,
  };
}

function validateRegisterInput(input: RegisterRequest) {
  if (input.site !== "cn" && input.site !== "com") return "注册必须选择具体站点";
  if (!input.username?.trim()) return "请填写用户名";
  if (!input.email?.trim()) return "请填写邮箱";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) return "邮箱格式不正确";
  if (!input.password || input.password.length < 6) return "密码至少需要 6 位";
  return null;
}

function validateLoginInput(input: LoginRequest) {
  if (input.site !== "cn" && input.site !== "com") return "登录必须选择具体站点";
  if (!input.account?.trim()) return "请填写用户名或邮箱";
  if (!input.password) return "请填写密码";
  return null;
}

function toConcreteSite(site: SiteContext): "cn" | "com" {
  return site === "com" ? "com" : "cn";
}

function randomToken() {
  return randomBytes(24).toString("hex");
}

function afterHours(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

interface Result<T> {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    status: 400 | 401 | 403 | 404 | 409 | 410 | 503;
  };
}

function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

function err(
  code: string,
  message: string,
  status: 400 | 401 | 403 | 404 | 409 | 410 | 503,
): Result<never> {
  return { ok: false, error: { code, message, status } };
}
