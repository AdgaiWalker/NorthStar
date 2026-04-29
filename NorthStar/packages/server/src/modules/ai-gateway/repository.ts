import type { AiGatewayModuleStatus } from "./types";
import type { AiGatewayFallbackReason, AiGatewayLogRecord, AiGatewayMode } from "./types";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "../../db/client";
import { aiCallLogs } from "../../db/schema";
import type { SiteContext } from "../platform/types";

export function readAiGatewayModuleStatus(): AiGatewayModuleStatus {
  return { module: "ai-gateway", ready: true };
}

export async function createAiCallLog(input: {
  site: "cn" | "com";
  userId: number | null;
  route: string;
  mode: AiGatewayMode;
  fallbackReason: AiGatewayFallbackReason;
  latencyMs: number;
  promptTokens?: number;
  completionTokens?: number;
  costCents?: number;
}) {
  if (!db) return null;

  const [row] = await db
    .insert(aiCallLogs)
    .values({
      site: input.site,
      userId: input.userId,
      route: input.route,
      mode: input.mode,
      fallbackReason: input.fallbackReason,
      latencyMs: input.latencyMs,
      promptTokens: input.promptTokens ?? 0,
      completionTokens: input.completionTokens ?? 0,
      costCents: input.costCents ?? 0,
    })
    .returning();

  return row ? toAiCallLog(row) : null;
}

export async function listAiCallLogs(site: SiteContext) {
  if (!db) return [];

  const rows = await db
    .select()
    .from(aiCallLogs)
    .where(site === "all" ? sql`true` : eq(aiCallLogs.site, site))
    .orderBy(desc(aiCallLogs.createdAt))
    .limit(100);

  return rows.map(toAiCallLog);
}

function toAiCallLog(row: typeof aiCallLogs.$inferSelect): AiGatewayLogRecord {
  return {
    id: String(row.id),
    site: row.site === "com" ? "com" : "cn",
    userId: row.userId ? String(row.userId) : null,
    route: row.route,
    mode: row.mode === "ai" ? "ai" : "demo",
    fallbackReason: toFallbackReason(row.fallbackReason),
    latencyMs: row.latencyMs,
    promptTokens: row.promptTokens,
    completionTokens: row.completionTokens,
    costCents: row.costCents,
    createdAt: row.createdAt.toISOString(),
  };
}

function toFallbackReason(value: string): AiGatewayFallbackReason {
  if (
    value === "missing_key" ||
    value === "network_error" ||
    value === "empty_result" ||
    value === "quota_exhausted" ||
    value === "sensitive_blocked" ||
    value === "sensitive_output"
  ) {
    return value;
  }
  return "";
}
