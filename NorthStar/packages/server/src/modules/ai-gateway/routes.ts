import { Hono } from "hono";
import type { Context } from "hono";
import { fail, ok } from "../../lib/http";
import { authMiddleware, requireAuthUser, resolveAuthUser } from "../../middleware/auth";
import { requireSiteContext } from "../../middleware/site";
import {
  AiGatewayPermissionError,
  callGatewayChat,
  getAiGatewayModuleStatus,
  readAiGatewayLogs,
} from "./service";
import type { ChatCompletionRequest } from "./service";

export const aiGatewayRoute = new Hono();

aiGatewayRoute.get("/api/ai-gateway/health", (c) => c.json({ ok: true, data: getAiGatewayModuleStatus() }));

aiGatewayRoute.post("/api/ai-gateway/chat", async (c) => {
  const site = normalizeRuntimeSite(requireSiteContext(c));
  const body = await readJson<ChatCompletionRequest>(c);
  const fallback = buildGatewayFallback(body);
  const result = await callGatewayChat({
    site,
    actor: resolveAuthUser(c),
    guestKey: readGuestKey(c),
    route: "ai-gateway.chat",
    body,
    fallback,
    quotaCost: 1,
  });

  return c.json({
    ...result.response,
    mode: result.mode,
    fallbackReason: result.fallbackReason,
  });
});

aiGatewayRoute.get("/api/ai-gateway/logs", authMiddleware, async (c) => {
  try {
    return ok(c, { items: await readAiGatewayLogs(requireSiteContext(c), requireAuthUser(c)) });
  } catch (error) {
    if (error instanceof AiGatewayPermissionError) {
      return fail(c, error.status, "AI_GATEWAY_FORBIDDEN", error.message);
    }
    throw error;
  }
});

async function readJson<T>(c: Context): Promise<T> {
  try {
    return await c.req.json<T>();
  } catch {
    return {} as T;
  }
}

function normalizeRuntimeSite(site: string) {
  return site === "com" ? "com" : "cn";
}

function readGuestKey(c: Context) {
  return c.req.header("x-forwarded-for") ?? c.req.header("cf-connecting-ip") ?? "guest";
}

function buildGatewayFallback(body: ChatCompletionRequest) {
  const prompt = body.messages?.map((message) => message.content).join("\n") ?? "";
  const goal = body.goal?.trim() || prompt.match(/"([^"]+)"/)?.[1] || "当前目标";
  const functionName = getFunctionName(body);
  const argumentsText =
    functionName?.includes("search")
      ? JSON.stringify({
          summary: `已进入演示模式：${goal}`,
          recommendation: "先用本地内容完成基础判断，AI 服务恢复后再生成更细的工具组合。",
          suggestedTools: [],
          suggestedArticles: [],
        })
      : JSON.stringify({
          title: `${goal} 的方案草稿`,
          aiAdvice: `### 演示模式\n\nAI 服务当前不可用或额度不足，先按“目标拆解、工具选择、结果校验”三步推进。\n\n1. 明确目标与交付物。\n2. 选择一个主工具完成初稿。\n3. 用另一个工具检查质量并补充遗漏。`,
        });

  return {
    choices: [
      {
        message: {
          tool_calls: functionName
            ? [
                {
                  type: "function",
                  function: {
                    name: functionName,
                    arguments: argumentsText,
                  },
                },
              ]
            : undefined,
          content: functionName ? undefined : argumentsText,
        },
      },
    ],
  };
}

function getFunctionName(body: ChatCompletionRequest) {
  const toolChoice = body.tool_choice as { function?: { name?: string } } | undefined;
  return toolChoice?.function?.name ?? (body.tools?.[0] as { function?: { name?: string } } | undefined)?.function?.name;
}
