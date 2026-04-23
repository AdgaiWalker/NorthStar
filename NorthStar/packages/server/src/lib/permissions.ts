import type { PermissionResponse } from "@ns/shared";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { trustLevelEnum, users } from "../db/schema";

export type TrustLevel = (typeof trustLevelEnum.enumValues)[number];

const TRUST_LEVEL_ORDER: Record<TrustLevel, number> = {
  guest: 0,
  user: 1,
  active: 2,
  author: 3,
  senior: 4,
  admin: 5,
};

export interface PermissionState {
  trustLevel: TrustLevel;
  permissions: PermissionResponse;
}

export function getPermissionStateFromTrustLevel(trustLevel: TrustLevel): PermissionState {
  return {
    trustLevel,
    permissions: {
      canPost: TRUST_LEVEL_ORDER[trustLevel] >= TRUST_LEVEL_ORDER.user,
      canWrite: TRUST_LEVEL_ORDER[trustLevel] >= TRUST_LEVEL_ORDER.author,
      canCreateSpace: TRUST_LEVEL_ORDER[trustLevel] >= TRUST_LEVEL_ORDER.senior,
    },
  };
}

export function getTrustLevelRank(trustLevel: TrustLevel) {
  return TRUST_LEVEL_ORDER[trustLevel];
}

export function getHigherTrustLevel(current: TrustLevel, next: TrustLevel): TrustLevel {
  return getTrustLevelRank(next) > getTrustLevelRank(current) ? next : current;
}

export function getTrustLevelFromScore(score: number): TrustLevel {
  if (score >= 30) return "senior";
  if (score >= 20) return "author";
  if (score >= 10) return "active";
  return "user";
}

export async function getPermissionStateForUser(options: {
  isAuthenticated: boolean;
  userId?: number | null;
}) {
  if (!options.isAuthenticated) {
    return getPermissionStateFromTrustLevel("guest");
  }

  const userId = options.userId ?? null;
  if (!db || !userId || !Number.isFinite(userId)) {
    return getPermissionStateFromTrustLevel("user");
  }

  const rows = await db
    .select({
      trustLevel: users.trustLevel,
    })
    .from(users)
    .where(eq(users.id, userId));

  return getPermissionStateFromTrustLevel(rows[0]?.trustLevel ?? "user");
}
