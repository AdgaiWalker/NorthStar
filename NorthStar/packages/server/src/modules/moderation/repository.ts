import { and, eq, sql } from "drizzle-orm";
import type {
  CreateModerationTaskRequest,
  ModerationStatus,
  ModerationTaskRecord,
  SiteContext,
} from "@ns/shared";
import { db } from "../../db/client";
import { moderationTasks } from "../../db/schema";

export async function listModerationTasks(site: SiteContext): Promise<ModerationTaskRecord[]> {
  if (!db) return [];

  const rows = await db
    .select()
    .from(moderationTasks)
    .where(site === "all" ? sql`true` : eq(moderationTasks.site, site))
    .orderBy(sql`${moderationTasks.createdAt} desc`)
    .limit(100);

  return rows.map(toRecord);
}

export async function getModerationTask(site: SiteContext, id: number): Promise<ModerationTaskRecord | null> {
  if (!db) return null;

  const rows = await db
    .select()
    .from(moderationTasks)
    .where(and(eq(moderationTasks.id, id), site === "all" ? sql`true` : eq(moderationTasks.site, site)))
    .limit(1);

  return rows[0] ? toRecord(rows[0]) : null;
}

export async function createModerationTask(
  input: CreateModerationTaskRequest,
  reporterId: number | null,
): Promise<ModerationTaskRecord | null> {
  if (!db) return null;

  const [row] = await db
    .insert(moderationTasks)
    .values({
      site: input.site,
      type: input.type,
      status: "pending",
      targetType: input.targetType,
      targetId: input.targetId,
      title: input.title,
      reason: input.reason ?? null,
      payload: input.payload ?? {},
      reporterId,
    })
    .returning();

  return toRecord(row);
}

export async function updateModerationTaskStatus(
  site: SiteContext,
  id: number,
  status: ModerationStatus,
  assigneeId: number | null,
): Promise<{ before: ModerationTaskRecord; after: ModerationTaskRecord } | null> {
  if (!db) return null;

  const before = await getModerationTask(site, id);
  if (!before) return null;

  const [row] = await db
    .update(moderationTasks)
    .set({ status, assigneeId, updatedAt: new Date() })
    .where(and(eq(moderationTasks.id, id), site === "all" ? sql`true` : eq(moderationTasks.site, site)))
    .returning();

  if (!row) return null;

  return { before, after: toRecord(row) };
}

function toRecord(row: typeof moderationTasks.$inferSelect): ModerationTaskRecord {
  return {
    id: String(row.id),
    site: toSiteContext(row.site),
    type: toTaskType(row.type),
    status: toStatus(row.status),
    targetType: row.targetType,
    targetId: row.targetId,
    title: row.title,
    reason: row.reason,
    payload: row.payload,
    reporterId: row.reporterId ? String(row.reporterId) : null,
    assigneeId: row.assigneeId ? String(row.assigneeId) : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toSiteContext(value: string): SiteContext {
  if (value === "com" || value === "all") return value;
  return "cn";
}

function toStatus(value: string): ModerationStatus {
  if (value === "in_review" || value === "resolved" || value === "dismissed" || value === "escalated") return value;
  return "pending";
}

function toTaskType(value: string): ModerationTaskRecord["type"] {
  if (
    value === "changed_feedback" ||
    value === "ai_output_review" ||
    value === "application_review" ||
    value === "space_claim"
  ) {
    return value;
  }

  return "report";
}
