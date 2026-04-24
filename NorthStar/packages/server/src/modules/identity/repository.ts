import { and, eq, or } from "drizzle-orm";
import type { IdentityUser, PlatformRole, SiteContext } from "@ns/shared";
import { db } from "../../db/client";
import { userConsents, users } from "../../db/schema";
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

export async function createIdentityUser(input: IdentityCreateInput) {
  if (!db) return null;

  const [user] = await db
    .insert(users)
    .values({
      username: input.username,
      email: input.email,
      site: input.site,
      role: "user",
      nickname: input.username,
      passwordHash: input.passwordHash,
      emailVerified: false,
      emailVerificationToken: input.emailVerificationToken,
      emailVerificationExpiresAt: input.emailVerificationExpiresAt,
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

function toPlatformRole(value: string): PlatformRole {
  if (value === "editor" || value === "reviewer" || value === "operator" || value === "admin") return value;
  return "user";
}
