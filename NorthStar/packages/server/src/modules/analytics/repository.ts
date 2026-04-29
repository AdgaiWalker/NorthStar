import type { AnalyticsModuleStatus } from "./types";
import type { BehaviorEventName, BehaviorEventRecord, SiteContext } from "@ns/shared";
import { count, desc, eq, sql } from "drizzle-orm";
import { db } from "../../db/client";
import { behaviorEvents } from "../../db/schema";

export function readAnalyticsModuleStatus(): AnalyticsModuleStatus {
  return { module: "analytics", ready: true };
}

export async function createBehaviorEvent(input: {
  site: Exclude<SiteContext, "all">;
  userId: number | null;
  event: BehaviorEventName;
  metadata: Record<string, unknown>;
}) {
  if (!db) return null;

  const [row] = await db
    .insert(behaviorEvents)
    .values({
      site: input.site,
      userId: input.userId,
      event: input.event,
      metadata: input.metadata,
    })
    .returning();

  return row ? toBehaviorEvent(row) : null;
}

export async function listBehaviorEvents(site: SiteContext) {
  if (!db) return [];

  const rows = await db
    .select()
    .from(behaviorEvents)
    .where(site === "all" ? sql`true` : eq(behaviorEvents.site, site))
    .orderBy(desc(behaviorEvents.createdAt))
    .limit(100);

  return rows.map(toBehaviorEvent);
}

export async function countBehaviorEvents(site: SiteContext) {
  if (!db) return [];

  const rows = await db
    .select({
      event: behaviorEvents.event,
      value: count(),
    })
    .from(behaviorEvents)
    .where(site === "all" ? sql`true` : eq(behaviorEvents.site, site))
    .groupBy(behaviorEvents.event);

  return rows.map((row) => ({
    key: row.event,
    label: row.event,
    value: Number(row.value),
    site,
  }));
}

export async function cleanupOldEvents(maxAgeDays = 90) {
  if (!db) return 0;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - maxAgeDays);

  const result = await db
    .delete(behaviorEvents)
    .where(sql`${behaviorEvents.createdAt} < ${cutoff}`)
    .returning({ id: behaviorEvents.id });

  return result.length;
}

function toBehaviorEvent(row: typeof behaviorEvents.$inferSelect): BehaviorEventRecord {
  return {
    id: String(row.id),
    site: row.site === "com" ? "com" : "cn",
    userId: row.userId ? String(row.userId) : null,
    event: row.event as BehaviorEventName,
    metadata: row.metadata,
    createdAt: row.createdAt.toISOString(),
  };
}
