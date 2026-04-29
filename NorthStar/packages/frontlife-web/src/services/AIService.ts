import { API_ENDPOINTS } from '@ns/shared';

const DEFAULT_MODEL = '669cc27692d644298c7142a4c4434101.Ro803ebmEB9VfWxf';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface StreamChunk {
  content: string;
  done: boolean;
}

function aiHeaders() {
  const token = getPersistedToken();
  return {
    'Content-Type': 'application/json',
    'x-pangen-site': 'cn',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function getPersistedToken() {
  try {
    const raw = window.localStorage.getItem('frontlife-user-storage');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { token?: string | null } };
    return parsed.state?.token ?? null;
  } catch {
    return null;
  }
}

// ===== 1. 流式对话（AI 写作等实时场景） =====

export const streamChat = async (
  messages: ChatMessage[],
  onChunk: (chunk: StreamChunk) => void,
  options?: { temperature?: number; model?: string }
): Promise<void> => {
  const model = options?.model || DEFAULT_MODEL;

  const res = await fetch(API_ENDPOINTS.AI_CHAT, {
    method: 'POST',
    headers: aiHeaders(),
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      temperature: options?.temperature ?? 0.7,
    }),
  });

  if (!res.ok || !res.body) {
    throw new Error(`AI 服务不可用 (${res.status})`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;
        if (!trimmed.startsWith('data: ')) continue;

        const jsonStr = trimmed.slice(6);
        try {
          const json = JSON.parse(jsonStr);
          const delta = json.choices?.[0]?.delta?.content;
          if (typeof delta === 'string') {
            onChunk({ content: delta, done: false });
          }
        } catch {
          // ignore malformed SSE line
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  onChunk({ content: '', done: true });
};

// ===== 2. AI 搜索（首页搜索框，本地无结果时调用） =====

export interface AISearchResult {
  answer: string;
  relatedTopics?: string[];
}

export const aiSearch = async (
  query: string,
  contextArticles?: { title: string; summary: string }[]
): Promise<AISearchResult> => {
  const context = contextArticles?.length
    ? `以下是我们知识库中的相关文章，供你参考（如果用户问题和这些文章无关，请直接回答用户问题）：\n${contextArticles.map((a) => `- ${a.title}: ${a.summary}`).join('\n')}\n\n`
    : '';

  const res = await fetch(API_ENDPOINTS.AI_CHAT, {
    method: 'POST',
    headers: aiHeaders(),
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: 'system',
          content:
            '你是盘根校园的 AI 助手，专门帮助大学生解答校园生活问题。回答要简洁、实用、口语化，像学长学姐在群里回答问题一样自然。如果用户问题涉及校园具体信息但你不知道，请诚实说明，不要编造。',
        },
        {
          role: 'user',
          content: `${context}用户问题："${query}"\n\n请直接给出回答，不要输出 markdown 代码块。`,
        },
      ],
      temperature: 0.5,
      max_tokens: 800,
    }),
  });

  if (!res.ok) {
    throw new Error(`AI 搜索不可用 (${res.status})`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const answer = data.choices?.[0]?.message?.content?.trim() || '';

  if (!answer) {
    throw new Error('AI 返回空结果');
  }

  return { answer };
};

// ===== 3. AI 摘要（长文章自动生成摘要） =====

export const generateSummary = async (content: string): Promise<string> => {
  const res = await fetch(API_ENDPOINTS.AI_CHAT, {
    method: 'POST',
    headers: aiHeaders(),
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: 'system',
          content:
            '请为以下文章生成一段 100-150 字的中文摘要，突出核心观点和实用信息。摘要要简洁、准确，不加入评价。',
        },
        {
          role: 'user',
          content: content.slice(0, 6000),
        },
      ],
      temperature: 0.3,
      max_tokens: 300,
    }),
  });

  if (!res.ok) {
    throw new Error(`AI 摘要不可用 (${res.status})`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return data.choices?.[0]?.message?.content?.trim() || '';
};

// ===== 4. AI 对话式写作（引导式提问 + 排版） =====

export interface WritingStep {
  role: 'ai' | 'user';
  content: string;
}

export const generateWritingReply = async (
  steps: WritingStep[]
): Promise<string> => {
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: `你是盘根校园的写作助手，帮助用户把零散的想法整理成结构清晰的文章。

工作方式：
1. 先了解用户想分享什么（通过提问）
2. 追问关键细节（价格、时间、地点、注意事项等）
3. 基于用户回答，生成文章大纲和正文
4. 使用 Markdown 格式输出

语气要求：
- 像热心的学长学姐
- 问题要具体，不要泛泛而谈
- 每次只问 1-2 个问题，不要一次性问太多`,
    },
  ];

  for (const step of steps) {
    messages.push({
      role: step.role === 'ai' ? 'assistant' : 'user',
      content: step.content,
    });
  }

  const res = await fetch(API_ENDPOINTS.AI_CHAT, {
    method: 'POST',
    headers: aiHeaders(),
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 1200,
    }),
  });

  if (!res.ok) {
    throw new Error(`AI 写作助手不可用 (${res.status})`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return data.choices?.[0]?.message?.content?.trim() || '';
};
