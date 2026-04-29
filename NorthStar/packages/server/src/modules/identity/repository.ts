import { and, eq, or } from "drizzle-orm";
import type { ApplicationRequestRecord, ApplicationRequestStatus, IdentityUser, InviteCodeRecord, PlatformRole, SiteContext } from "@ns/shared";
import { db } from "../../db/client";
import { applicationRequests, inviteCodes, userConsents, users } from "../../db/schema";
import type { IdentityCreateInput, IdentityModuleStatus } from "./types";

export function readIdentityModuleStatus(): IdentityModuleStatus {
  return { module: "identity", ready: true };
}

export async function findUserByAccount(site: Exclude<SiteContext, "all">, account: string) {
  if (!db) return null;

  const rows = await db
    .select()
    .from(users)
    .where(and(eq(users.site, site), or(eq(users.username, account), eq(users.email, account))))
    .limit(1);

  return rows[0] ?? null;
}

export async function findUserById(id: number) {
  if (!db) return null;

  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function findUserByGitHubId(site: Exclude<SiteContext, "all">, githubId: string) {
  if (!db) return null;

  const rows = await db
    .select()
    .from(users)
    .where(and(eq(users.site, site), eq(users.githubId, githubId)))
    .limit(1);

  return rows[0] ?? null;
}

export async function createIdentityUser(input: IdentityCreateInput) {
  if (!db) return null;

  const [user] = await db
    .insert(users)
    .values({
      username: input.username,
      email: input.email ?? null,
      githubId: input.githubId ?? null,
      site: input.site,
      role: "user",
      nickname: input.nickname ?? input.username,
      passwordHash: input.passwordHash ?? null,
      emailVerified: input.emailVerified ?? false,
      emailVerificationToken: input.emailVerificationToken ?? null,
      emailVerificationExpiresAt: input.emailVerificationExpiresAt ?? null,
      avatar: input.avatar ?? null,
      school: input.site === "cn" ? "黑河学院" : null,
      trustLevel: "user",
    })
    .returning();

  if (input.consentVersion) {
    await db
      .insert(userConsents)
      .values([
        {
          userId: user.id,
          site: input.site,
          documentType: "terms",
          version: input.consentVersion,
        },
        {
          userId: user.id,
          site: input.site,
          documentType: "privacy",
          version: input.consentVersion,
        },
      ])
      .onConflictDoNothing();
  }

  return user;
}

export async function updateApplicationRequestStatus(
  id: number,
  status: Extract<ApplicationRequestStatus, "approved" | "rejected">,
  reviewerId: number | null,
) {
  if (!db) return null;

  const [row] = await db
    .update(applicationRequests)
    .set({
      status,
      reviewerId,
      reviewedAt: new Date(),
    })
    .where(eq(applicationRequests.id, id))
    .returning();

  return row ? toApplicationRequest(row) : null;
}

export async function findApprovedApplicationByEmail(site: Exclude<SiteContext, "all">, email: string) {
  if (!db) return null;

  const rows = await db
    .select()
    .from(applicationRequests)
    .where(and(eq(applicationRequests.site, site), eq(applicationRequests.email, email), eq(applicationRequests.status, "approved")))
    .orderBy(applicationRequests.createdAt)
    .limit(1);

  return rows[0] ? toApplicationRequest(rows[0]) : null;
}

export async function bindGitHubIdentity(input: {
  userId: number;
  githubId: string;
  nickname: string;
  email?: string;
  avatar?: string;
}) {
  if (!db) return null;

  const [row] = await db
    .update(users)
    .set({
      githubId: input.githubId,
      nickname: input.nickname,
      email: input.email ?? null,
      emailVerified: Boolean(input.email),
      avatar: input.avatar ?? null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, input.userId))
    .returning();

  return row ?? null;
}

export async function createApplicationRequest(input: {
  site: Exclude<SiteContext, "all">;
  name: string;
  email: string;
  useCase: string;
}) {
  if (!db) return null;

  const [row] = await db
    .insert(applicationRequests)
    .values({
      site: input.site,
      name: input.name,
      email: input.email,
      useCase: input.useCase,
      status: "pending",
    })
    .returning();

  return row ? toApplicationRequest(row) : null;
}

export async function createInviteCode(input: {
  site: Exclude<SiteContext, "all">;
  code: string;
  maxUses: number;
  expiresAt?: Date;
  createdBy: number | null;
}) {
  if (!db) return null;

  const [row] = await db
    .insert(inviteCodes)
    .values({
      site: input.site,
      code: input.code,
      maxUses: input.maxUses,
      expiresAt: input.expiresAt ?? null,
      createdBy: input.createdBy,
    })
    .returning();

  return row ? toInviteCode(row) : null;
}

export async function consumeInviteCode(site: Exclude<SiteContext, "all">, code: string) {
  if (!db) return null;

  const rows = await db.select().from(inviteCodes).where(and(eq(inviteCodes.site, site), eq(inviteCodes.code, code))).limit(1);
  const invite = rows[0];
  if (!invite) return { ok: false as const, reason: "not_found" as const };
  if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) return { ok: false as const, reason: "expired" as const };
  if (invite.usedCount >= invite.maxUses) return { ok: false as const, reason: "exhausted" as const };

  const [updated] = await db
    .update(inviteCodes)
    .set({ usedCount: invite.usedCount + 1 })
    .where(eq(inviteCodes.id, invite.id))
    .returning();

  return updated ? { ok: true as const, invite: toInviteCode(updated) } : null;
}

export async function verifyEmailToken(token: string) {
  if (!db) return null;

  const rows = await db.select().from(users).where(eq(users.emailVerificationToken, token)).limit(1);
  const user = rows[0];
  if (!user) return null;

  if (!user.emailVerificationExpiresAt || user.emailVerificationExpiresAt.getTime() < Date.now()) {
    return { expired: true as const, user };
  }

  const [updated] = await db
    .update(users)
    .set({
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpiresAt: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id))
    .returning();

  return { expired: false as const, user: updated };
}

export async function setPasswordResetToken(id: number, token: string, expiresAt: Date) {
  if (!db) return null;

  const [user] = await db
    .update(users)
    .set({
      passwordResetToken: token,
      passwordResetExpiresAt: expiresAt,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id))
    .returning();

  return user ?? null;
}

export async function resetPasswordByToken(token: string, passwordHash: string) {
  if (!db) return null;

  const rows = await db.select().from(users).where(eq(users.passwordResetToken, token)).limit(1);
  const user = rows[0];
  if (!user) return null;

  if (!user.passwordResetExpiresAt || user.passwordResetExpiresAt.getTime() < Date.now()) {
    return { expired: true as const, user };
  }

  const [updated] = await db
    .update(users)
    .set({
      passwordHash,
      passwordResetToken: null,
      passwordResetExpiresAt: null,
      tokenInvalidBefore: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id))
    .returning();

  return { expired: false as const, user: updated };
}

export async function invalidateUserTokens(id: number) {
  if (!db) return null;

  const [user] = await db
    .update(users)
    .set({
      tokenInvalidBefore: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, id))
    .returning();

  return user ?? null;
}

export function toIdentityUser(user: typeof users.$inferSelect): IdentityUser {
  return {
    id: String(user.id),
    username: user.username,
    email: user.email ?? "",
    name: user.nickname,
    role: toPlatformRole(user.role),
    site: user.site === "com" ? "com" : "cn",
    emailVerified: user.emailVerified,
  };
}

function toApplicationRequest(row: typeof applicationRequests.$inferSelect): ApplicationRequestRecord {
  return {
    id: String(row.id),
    site: row.site === "com" ? "com" : "cn",
    name: row.name,
    email: row.email,
    useCase: row.useCase,
    status: row.status === "approved" || row.status === "rejected" ? row.status : "pending",
    createdAt: row.createdAt.toISOString(),
    reviewedAt: row.reviewedAt?.toISOString(),
  };
}

function toInviteCode(row: typeof inviteCodes.$inferSelect): InviteCodeRecord {
  return {
    id: String(row.id),
    site: row.site === "com" ? "com" : "cn",
    code: row.code,
    maxUses: row.maxUses,
    usedCount: row.usedCount,
    expiresAt: row.expiresAt?.toISOString(),
    createdBy: row.createdBy ? String(row.createdBy) : undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

function toPlatformRole(value: string): PlatformRole {
  if (value === "editor" || value === "reviewer" || value === "operator" || value === "admin") return value;
  return "user";
}
