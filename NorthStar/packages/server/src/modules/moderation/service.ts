import type { AuthTokenPayload } from "../../lib/auth";
import { assertSiteReadable } from "../../db/site-aware";
import { writeAuditLog } from "../platform/service";
import {
  createModerationTask,
  getModerationTask,
  listModerationTasks,
  updateModerationTaskStatus,
} from "./repository";
import type {
  CreateModerationTaskRequest,
  ModerationStatus,
  ModerationTaskRecord,
  SiteContext,
  UpdateModerationTaskStatusRequest,
} from "./types";

export async function readModerationTasks(site: SiteContext, actor: AuthTokenPayload) {
  assertSiteReadable(site, actor.site, actor.role);
  assertReviewer(actor);
  return listModerationTasks(site);
}

export async function readModerationTask(site: SiteContext, actor: AuthTokenPayload, id: number) {
  assertSiteReadable(site, actor.site, actor.role);
  assertReviewer(actor);
  return getModerationTask(site, id);
}

export async function submitModerationTask(input: CreateModerationTaskRequest, actor: AuthTokenPayload) {
  assertSiteReadable(input.site, actor.site, actor.role);
  return createModerationTask(input, toNumberOrNull(actor.sub));
}

export async function changeModerationTaskStatus(
  site: SiteContext,
  actor: AuthTokenPayload,
  id: number,
  body: UpdateModerationTaskStatusRequest,
) {
  assertSiteReadable(site, actor.site, actor.role);
  assertReviewer(actor);

  const current = await getModerationTask(site, id);
  if (!current) return null;

  if (!canTransition(current.status, body.status)) {
    return { error: "审核状态流转不符合规则" as const, task: current };
  }

  const result = await updateModerationTaskStatus(site, id, body.status, toNumberOrNull(actor.sub));
  if (!result) return null;

  await writeAuditLog({
    actorId: toNumberOrNull(actor.sub),
    site,
    targetType: "moderation_task",
    targetId: String(id),
    action: "moderation.status_changed",
    before: { ...result.before },
    after: { ...result.after },
  });

  return { task: result.after };
}

function canTransition(from: ModerationStatus, to: ModerationStatus) {
  const allowed: Record<ModerationStatus, ModerationStatus[]> = {
    pending: ["in_review", "escalated"],
    in_review: ["resolved", "dismissed"],
    escalated: ["resolved"],
    resolved: [],
    dismissed: [],
  };

  return allowed[from].includes(to);
}

function toNumberOrNull(value: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

function assertReviewer(actor: AuthTokenPayload) {
  if (actor.role === "reviewer" || actor.role === "operator" || actor.role === "admin") return;
  throw new ModerationPermissionError("没有审核后台权限");
}

export class ModerationPermissionError extends Error {
  status = 403 as const;

  constructor(message: string) {
    super(message);
    this.name = "ModerationPermissionError";
  }
}
