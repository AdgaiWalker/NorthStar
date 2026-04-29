import type { AuthTokenPayload } from "../../lib/auth";
import type { BehaviorEventName, CreateBehaviorEventRequest, SiteContext } from "@ns/shared";
import { assertSiteReadable } from "../../db/site-aware";
import { cleanupOldEvents, countBehaviorEvents, createBehaviorEvent, listBehaviorEvents, readAnalyticsModuleStatus } from "./repository";

const ALLOWED_EVENTS = new Set<string>([
  'campus_search',
  'campus_search_no_result',
  'campus_ai_fallback',
  'campus_feedback_helpful',
  'campus_feedback_changed',
  'campus_post_created',
  'campus_reply_created',
  'campus_space_visit',
  'campus_article_read',
  'campus_favorite',
  'compass_search',
  'compass_solution_generate',
  'compass_solution_save',
  'compass_solution_export',
  'compass_solution_feedback',
  'compass_tool_click',
  'compass_favorite',
  'campus_to_compass_click',
]);

export function getAnalyticsModuleStatus() {
  return readAnalyticsModuleStatus();
}

export async function cleanupAnalyticsData(maxAgeDays = 90) {
  const deleted = await cleanupOldEvents(maxAgeDays);
  return { deleted, maxAgeDays };
}

export async function submitBehaviorEvent(input: CreateBehaviorEventRequest, actor: AuthTokenPayload | null) {
  if (input.site !== "cn" && input.site !== "com") {
    return resultError("VALIDATION_ERROR", "事件站点不正确", 400);
  }

  if (!ALLOWED_EVENTS.has(input.event)) {
    return resultError("VALIDATION_ERROR", `不支持的事件类型: ${input.event}`, 400);
  }

  const record = await createBehaviorEvent({
    site: input.site,
    userId: actor ? toNumberOrNull(actor.sub) : null,
    event: input.event,
    metadata: input.metadata ?? {},
  });
  if (!record) return resultError("DATABASE_UNAVAILABLE", "行为事件记录失败", 503);
  return resultOk(record);
}

export async function readBehaviorEvents(site: SiteContext, actor: AuthTokenPayload) {
  assertSiteReadable(site, actor.site, actor.role);
  assertAnalyticsReader(actor);
  return listBehaviorEvents(site);
}

export async function readAnalyticsMetrics(site: SiteContext, actor: AuthTokenPayload) {
  assertSiteReadable(site, actor.site, actor.role);
  assertAnalyticsReader(actor);
  return countBehaviorEvents(site);
}

function assertAnalyticsReader(actor: AuthTokenPayload) {
  if (actor.role === "reviewer" || actor.role === "operator" || actor.role === "admin") return;
  throw new AnalyticsPermissionError("没有数据中心访问权限");
}

function toNumberOrNull(value: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

export class AnalyticsPermissionError extends Error {
  status = 403 as const;

  constructor(message: string) {
    super(message);
    this.name = "AnalyticsPermissionError";
  }
}

interface Result<T> {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    status: 400 | 503;
  };
}

function resultOk<T>(data: T): Result<T> {
  return { ok: true, data };
}

function resultError(code: string, message: string, status: 400 | 503): Result<never> {
  return { ok: false, error: { code, message, status } };
}
