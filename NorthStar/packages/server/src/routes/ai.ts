import { checkSensitiveWords } from "@ns/shared";
import { Hono } from "hono";
import type { Context } from "hono";
import { searchContentFromDb } from "../data/postgres";
import { resolveAuthUser } from "../middleware/auth";
import { requireSiteContext } from "../middleware/site";
import { generateGatewayText } from "../modules/ai-gateway/service";

interface SearchBody {
  query?: string;
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
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

  const answer = await generateGatewayText({
    site: normalizeRuntimeSite(requireSiteContext(c)),
    actor: resolveAuthUser(c),
    guestKey: readGuestKey(c),
    route: "campus.ai_search",
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
    quotaCost: 1,
  });

  const outputSensitive = checkSensitiveWords(answer.text);
  const safeAnswer = outputSensitive.hit ? fallback : answer.text;
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
  const raw = await generateGatewayText({
    site: normalizeRuntimeSite(requireSiteContext(c)),
    actor: resolveAuthUser(c),
    guestKey: readGuestKey(c),
    route: "campus.ai_write",
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
    quotaCost: 1,
  });

  const draft = parseDraft(raw.text) ?? fallback.draft;

  return c.json({
    reply: "我先给你整理了一版文章草稿。发布前请确认真实时间、地点、价格和联系人。",
    directions: draft.directions,
    draft,
  });
});

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

function normalizeRuntimeSite(site: string) {
  return site === "com" ? "com" : "cn";
}

function readGuestKey(c: Context) {
  return c.req.header("x-forwarded-for") ?? c.req.header("cf-connecting-ip") ?? "guest";
}
