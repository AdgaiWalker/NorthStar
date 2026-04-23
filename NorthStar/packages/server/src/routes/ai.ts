import { checkSensitiveWords } from "@ns/shared";
import { Hono } from "hono";
import { searchContentFromDb } from "../data/postgres";

interface SearchBody {
  query?: string;
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatCompletionRequest {
  model?: string;
  messages?: ChatMessage[];
  tools?: unknown[];
  tool_choice?: unknown;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  goal?: string;
}

interface ChatCompletionResponse {
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
}

export const aiRoute = new Hono();

aiRoute.post("/api/ai/search", async (c) => {
  let body: SearchBody = {};

  try {
    body = await c.req.json<SearchBody>();
  } catch {
    body = {};
  }

  const query = body.query?.trim();

  if (!query) {
    return c.json({ error: "query is required" }, 400);
  }

  const sensitive = checkSensitiveWords(query);
  if (sensitive.hit) {
    return c.json({ error: "query contains sensitive content" }, 400);
  }

  const localContext = await searchContentFromDb(query);
  const contextArticles = localContext?.articles.slice(0, 5) ?? [];
  const fallback = buildSearchFallback(query, contextArticles.map((article) => article.title));

  const answer = await callTextAI({
    messages: [
      {
        role: "system",
        content:
          "你是盘根校园站的校园生活问答助手。回答要简洁、真实、实用。若涉及具体校内事实而上下文不足，要明确说明仅供参考，不要编造。",
      },
      {
        role: "user",
        content: [
          contextArticles.length
            ? `站内已确认内容：\n${contextArticles.map((item) => `- ${item.title}: ${item.summary}`).join("\n")}`
            : "站内没有直接匹配的已确认内容。",
          `用户问题：${query}`,
          "请直接回答，控制在 180 字以内。",
        ].join("\n\n"),
      },
    ],
    fallback,
    temperature: 0.4,
  });

  const outputSensitive = checkSensitiveWords(answer);
  const safeAnswer = outputSensitive.hit ? fallback : answer;
  const chunks = splitChunks(safeAnswer);
  const encoder = new TextEncoder();

  const bodyStream = new ReadableStream<Uint8Array>({
    async start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: chunk })}\n\n`));
        await new Promise((resolve) => setTimeout(resolve, 12));
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(bodyStream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
});

aiRoute.post("/api/ai/write", async (c) => {
  let body: { topic?: string; spaceTitle?: string } = {};

  try {
    body = await c.req.json<{ topic?: string; spaceTitle?: string }>();
  } catch {
    body = {};
  }

  const topic = body.topic?.trim();

  if (!topic) {
    return c.json({ error: "topic is required" }, 400);
  }

  const sensitive = checkSensitiveWords(topic);
  if (sensitive.hit) {
    return c.json({ error: "topic contains sensitive content" }, 400);
  }

  const fallback = buildDraftFallback(topic, body.spaceTitle);
  const raw = await callTextAI({
    messages: [
      {
        role: "system",
        content:
          "你是盘根校园站的写作助手。请基于用户主题生成真实信息待补充的校园文章草稿。必须输出 JSON，字段为 directions、title 与 content。directions 是 3 条中文建议，content 使用 Markdown。",
      },
      {
        role: "user",
        content: `空间：${body.spaceTitle ?? "当前空间"}\n主题：${topic}\n请先给出 3 条写作建议方向，再生成一篇可由学生编辑确认后发布的文章草稿。`,
      },
    ],
    fallback: JSON.stringify(fallback.draft),
    temperature: 0.5,
  });

  const draft = parseDraft(raw) ?? fallback.draft;

  return c.json({
    reply: "我先给你整理了一版文章草稿。发布前请确认真实时间、地点、价格和联系人。",
    directions: draft.directions,
    draft,
  });
});

aiRoute.post("/api/ai/tools", async (c) => {
  let body: ChatCompletionRequest = {};

  try {
    body = await c.req.json<ChatCompletionRequest>();
  } catch {
    body = {};
  }

  const functionName = getFunctionName(body);
  const prompt = body.messages?.map((message) => message.content).join("\n") ?? "";
  const goal = body.goal?.trim() || extractQuotedText(prompt) || "提高效率";

  if (body.messages?.length) {
    if (!hasAIConfig()) {
      return c.json({ error: "AI config missing", fallbackReason: "missing_key" }, 503);
    }

    try {
      const response = await callChatCompletion(body, null);
      return c.json(response);
    } catch {
      return c.json({ error: "AI request failed", fallbackReason: "network_error" }, 502);
    }
  }

  return c.json({
    mode: "demo",
    fallbackReason: hasAIConfig() ? "" : "missing_key",
    title: `${goal} 的 AI 工具方案`,
    aiAdvice: "先明确任务输入和交付格式，再选择一个主工具和一个校验工具。",
    toolCalls: [
      {
        name: "recommend_tools",
        arguments: {
          goal,
          domains: ["writing", "productivity", "coding"],
        },
      },
    ],
  });
});

async function callTextAI(input: {
  messages: ChatMessage[];
  fallback: string;
  temperature?: number;
}) {
  if (!hasAIConfig()) return input.fallback;

  try {
    const response = await callChatCompletion(
      {
        messages: input.messages,
        temperature: input.temperature ?? 0.4,
        max_tokens: 1000,
      },
      null,
    );
    const text = response.choices?.[0]?.message?.content?.trim();
    return text || input.fallback;
  } catch {
    return input.fallback;
  }
}

async function callChatCompletion(body: ChatCompletionRequest, fallback: ChatCompletionResponse | null) {
  if (!hasAIConfig()) {
    if (fallback) return fallback;
    throw new Error("AI config missing");
  }

  try {
    const response = await fetch(`${getAIBaseURL()}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.AI_API_KEY}`,
      },
      body: JSON.stringify({
        ...body,
        model: body.model || process.env.AI_MODEL || "glm-4-flash",
        stream: false,
      }),
    });

    if (!response.ok) {
      if (fallback) return fallback;
      throw new Error(`AI request failed: ${response.status}`);
    }

    return (await response.json()) as ChatCompletionResponse;
  } catch {
    if (fallback) return fallback;
    throw new Error("AI request failed");
  }
}

function getAIBaseURL() {
  return (process.env.AI_BASE_URL || "https://open.bigmodel.cn/api/paas/v4").replace(/\/$/, "");
}

function hasAIConfig() {
  return Boolean(process.env.AI_API_KEY);
}

function buildSearchFallback(query: string, titles: string[]) {
  const contextLine = titles.length
    ? `我先参考了站内内容：${titles.slice(0, 3).join("、")}。`
    : "站内暂时没有完全匹配的已确认内容。";
  return `${contextLine} 关于“${query}”，建议先查看相关空间里的最新文章和动态；如果这是时效性问题，以现场公告、老师通知或同学最新反馈为准。`;
}

function buildDraftFallback(topic: string, spaceTitle?: string) {
  const title = topic.length > 28 ? `${topic.slice(0, 28)}...` : topic;
  return {
    draft: {
      directions: [
        `先核对“${topic}”涉及的时间、地点、价格或联系人`,
        `说明这条信息适合 ${spaceTitle ?? "当前空间"} 里的哪类同学`,
        "在文末写清确认日期，方便后续同学反馈变化",
      ],
      title,
      content: `# ${title}\n\n## 先确认范围\n这篇文章整理“${topic}”相关信息，发布前请补充真实时间、地点、价格或联系人。\n\n## 核心信息\n- 适用空间：${spaceTitle ?? "当前空间"}\n- 适合读者：正在查找该问题的同学\n- 更新建议：如果信息有时效性，请写明确认日期\n\n## 待补充\n请把你知道的准确信息补到这里，再发布。`,
    },
  };
}

function buildToolFallback(goal: string, functionName?: string): ChatCompletionResponse {
  const argumentsText =
    functionName?.includes("search")
      ? JSON.stringify({
          summary: `已分析“${goal}”。`,
          recommendation: "优先选择低学习成本、能直接产出结果的工具组合。",
          suggestedTools: ["ChatGPT", "Claude", "Perplexity"],
          suggestedArticles: ["AI 工具入门指南"],
        })
      : JSON.stringify({
          title: `${goal} 的 AI 工具方案`,
          aiAdvice: `### 建议方案\n\n1. 明确目标“${goal}”的输入和输出。\n2. 选择一个主工具完成初稿。\n3. 使用另一个工具交叉检查。`,
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

function parseDraft(raw: string) {
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned) as { directions?: unknown; title?: unknown; content?: unknown };
    if (typeof parsed.title === "string" && typeof parsed.content === "string") {
      return {
        directions: Array.isArray(parsed.directions)
          ? parsed.directions.filter((item): item is string => typeof item === "string").slice(0, 3)
          : [],
        title: parsed.title,
        content: parsed.content,
      };
    }
  } catch {
    return null;
  }

  return null;
}

function splitChunks(answer: string) {
  return answer.match(/.{1,16}/g) ?? [answer];
}

function getFunctionName(body: ChatCompletionRequest) {
  const toolChoice = body.tool_choice as { function?: { name?: string } } | undefined;
  return toolChoice?.function?.name ?? (body.tools?.[0] as { function?: { name?: string } } | undefined)?.function?.name;
}

function extractQuotedText(text: string) {
  return text.match(/"([^"]+)"/)?.[1];
}
