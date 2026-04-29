import { checkSensitiveWords } from "@ns/shared";
import type { AuthTokenPayload } from "../../lib/auth";
import { consumeQuota } from "../billing/repository";
import { assertSiteReadable } from "../../db/site-aware";
import type { SiteContext } from "../platform/types";
import { createAiCallLog, listAiCallLogs, readAiGatewayModuleStatus } from "./repository";
import type { AiGatewayFallbackReason } from "./types";
import { createModerationTask } from "../moderation/repository";

export function getAiGatewayModuleStatus() {
  return readAiGatewayModuleStatus();
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionRequest {
  model?: string;
  messages?: ChatMessage[];
  tools?: unknown[];
  tool_choice?: unknown;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  goal?: string;
}

export interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
      tool_calls?: Array<{
        type?: string;
        function?: {
          name?: string;
          arguments?: string;
        };
      }>;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export async function generateGatewayText(input: {
  site: "cn" | "com";
  actor: AuthTokenPayload | null;
  guestKey: string;
  route: string;
  messages: ChatMessage[];
  fallback: string;
  temperature?: number;
  maxTokens?: number;
  quotaCost?: number;
}) {
  const result = await callGatewayChat({
    site: input.site,
    actor: input.actor,
    guestKey: input.guestKey,
    route: input.route,
    body: {
      messages: input.messages,
      temperature: input.temperature ?? 0.4,
      max_tokens: input.maxTokens ?? 1000,
    },
    fallback: {
      choices: [{ message: { content: input.fallback } }],
    },
    quotaCost: input.quotaCost ?? 1,
  });

  const text = result.response.choices?.[0]?.message?.content?.trim();
  return {
    text: text || input.fallback,
    mode: result.mode,
    fallbackReason: result.fallbackReason,
  };
}

export async function callGatewayChat(input: {
  site: "cn" | "com";
  actor: AuthTokenPayload | null;
  guestKey: string;
  route: string;
  body: ChatCompletionRequest;
  fallback: ChatCompletionResponse;
  quotaCost?: number;
}) {
  const start = Date.now();
  const quotaCost = input.quotaCost ?? 1;
  const prompt = input.body.messages?.map((message) => message.content).join("\n") ?? "";

  if (checkSensitiveWords(prompt).hit) {
    await logGatewayCall(input, "demo", "sensitive_blocked", start);
    return {
      mode: "demo" as const,
      fallbackReason: "sensitive_blocked" as const,
      response: input.fallback,
    };
  }

  if (!hasAIConfig()) {
    await logGatewayCall(input, "demo", "missing_key", start);
    return {
      mode: "demo" as const,
      fallbackReason: "missing_key" as const,
      response: input.fallback,
    };
  }

  const quota = await reserveQuota(input, quotaCost);
  if (!quota.ok) {
    await logGatewayCall(input, "demo", "quota_exhausted", start);
    return {
      mode: "demo" as const,
      fallbackReason: "quota_exhausted" as const,
      response: input.fallback,
    };
  }

  try {
    const response = await fetch(`${getAIBaseURL()}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.AI_API_KEY}`,
      },
      body: JSON.stringify({
        ...input.body,
        model: input.body.model || process.env.AI_MODEL || "glm-4-flash",
        stream: false,
      }),
    });

    if (!response.ok) {
      await logGatewayCall(input, "demo", "network_error", start);
      return { mode: "demo" as const, fallbackReason: "network_error" as const, response: input.fallback };
    }

    const data = (await response.json()) as ChatCompletionResponse;
    const outputText = extractOutputText(data);
    if (!outputText) {
      await logGatewayCall(input, "demo", "empty_result", start);
      return { mode: "demo" as const, fallbackReason: "empty_result" as const, response: input.fallback };
    }

    if (checkSensitiveWords(outputText).hit) {
      await logGatewayCall(input, "demo", "sensitive_output", start);
      return { mode: "demo" as const, fallbackReason: "sensitive_output" as const, response: input.fallback };
    }

    const usage = data.usage;
    const tokens = usage ? { prompt: usage.prompt_tokens, completion: usage.completion_tokens, total: usage.total_tokens } : undefined;
    await logGatewayCall(input, "ai", "", start, tokens);

    maybeSampleForModeration(input, outputText);

    return { mode: "ai" as const, fallbackReason: "" as const, response: data };
  } catch {
    await logGatewayCall(input, "demo", "network_error", start);
    return { mode: "demo" as const, fallbackReason: "network_error" as const, response: input.fallback };
  }
}

export async function readAiGatewayLogs(site: SiteContext, actor: AuthTokenPayload) {
  assertSiteReadable(site, actor.site, actor.role);
  if (actor.role !== "reviewer" && actor.role !== "operator" && actor.role !== "admin") {
    throw new AiGatewayPermissionError("没有 AI 调用日志访问权限");
  }
  return listAiCallLogs(site);
}

async function reserveQuota(
  input: { site: "cn" | "com"; actor: AuthTokenPayload | null; guestKey: string; route: string },
  quotaCost: number,
) {
  if (quotaCost <= 0) return { ok: true as const };

  if (!input.actor) {
    return consumeGuestQuota(input.site, input.guestKey, quotaCost);
  }

  const userId = Number(input.actor.sub);
  if (!Number.isInteger(userId)) return { ok: false as const };
  if (input.actor.site !== input.site && input.actor.role !== "admin") return { ok: false as const };

  const result = await consumeQuota({
    userId,
    site: input.site,
    amount: quotaCost,
    reason: `ai:${input.route}`,
  });

  return result?.ok ? { ok: true as const } : { ok: false as const };
}

async function logGatewayCall(
  input: { site: "cn" | "com"; actor: AuthTokenPayload | null; route: string },
  mode: "ai" | "demo",
  fallbackReason: AiGatewayFallbackReason,
  start: number,
  tokens?: { prompt: number; completion: number; total: number },
) {
  await createAiCallLog({
    site: input.site,
    userId: input.actor ? toNumberOrNull(input.actor.sub) : null,
    route: input.route,
    mode,
    fallbackReason,
    latencyMs: Date.now() - start,
    promptTokens: tokens?.prompt,
    completionTokens: tokens?.completion,
  });
}

function extractOutputText(response: ChatCompletionResponse) {
  const message = response.choices?.[0]?.message;
  const toolArguments = message?.tool_calls?.[0]?.function?.arguments;
  if (typeof toolArguments === "string") return toolArguments.trim();
  return message?.content?.trim() ?? "";
}

function hasAIConfig() {
  return Boolean(process.env.AI_API_KEY);
}

function getAIBaseURL() {
  return (process.env.AI_BASE_URL || "https://open.bigmodel.cn/api/paas/v4").replace(/\/$/, "");
}

function toNumberOrNull(value: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

function consumeGuestQuota(site: "cn" | "com", guestKey: string, amount: number) {
  const today = new Date().toISOString().slice(0, 10);
  const key = `${today}:${site}:${guestKey}`;
  const used = guestQuotaUsage.get(key) ?? 0;
  const limit = site === "com" ? 1 : 3;
  if (used + amount > limit) return { ok: false as const };
  guestQuotaUsage.set(key, used + amount);
  return { ok: true as const };
}

const guestQuotaUsage = new Map<string, number>();

const AI_MODERATION_SAMPLE_RATE = 0.1;

function maybeSampleForModeration(
  input: { site: "cn" | "com"; actor: AuthTokenPayload | null; route: string },
  outputText: string,
) {
  if (Math.random() > AI_MODERATION_SAMPLE_RATE) return;

  const userId = input.actor ? toNumberOrNull(input.actor.sub) : null;

  createModerationTask(
    {
      site: input.site,
      type: "ai_output_review",
      targetType: "ai_output",
      targetId: `route:${input.route}`,
      title: `AI 输出抽检 — ${input.route}`,
      reason: "自动抽检",
      payload: {
        route: input.route,
        outputPreview: outputText.slice(0, 500),
        userId,
      },
    },
    null,
  ).catch(() => {});
}

export class AiGatewayPermissionError extends Error {
  status = 403 as const;

  constructor(message: string) {
    super(message);
    this.name = "AiGatewayPermissionError";
  }
}
