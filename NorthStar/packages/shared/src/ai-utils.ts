/** 从可能包含非 JSON 文本的响应中提取 JSON 子串 */
export const extractLikelyJson = (text: string): string => {
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first === -1 || last === -1 || last <= first) return text;
  return text.slice(first, last + 1);
};

/** 安全解析 JSON，尝试多种容错策略 */
export const safeParseJsonObject = (raw: string): unknown => {
  const base = extractLikelyJson(String(raw || '')).trim();
  const candidates: string[] = [];

  if (base) candidates.push(base);
  if (base.startsWith('{{')) candidates.push(base.slice(1));
  if (base.endsWith('}}')) candidates.push(base.slice(0, -1));
  if (base.startsWith('{{') && base.endsWith('}}')) candidates.push(base.slice(1, -1));

  for (const c of candidates) {
    try {
      return JSON.parse(c);
    } catch {
      // try next
    }
  }

  return JSON.parse(base || '{}');
};

/** 智谱 Chat API 响应类型 */
export type ZhipuChatResponse = {
  choices?: Array<{
    message?: {
      content?: unknown;
      tool_calls?: Array<{
        function?: {
          arguments?: unknown;
        };
      }>;
    };
  }>;
};

/** 将各种格式的值规范化为 string[] */
export const normalizeStringArray = (value: unknown): string[] => {
  const out: string[] = [];
  const visit = (v: unknown) => {
    if (typeof v === 'string') {
      const s = v.trim();
      if (s) out.push(s);
      return;
    }
    if (Array.isArray(v)) {
      for (const item of v) visit(item);
      return;
    }
    if (v == null) return;
    const s = String(v).trim();
    if (s) out.push(s);
  };
  visit(value);
  return out;
};

type UnknownRecord = Record<string, unknown>;
export const isRecord = (v: unknown): v is UnknownRecord =>
  !!v && typeof v === 'object' && !Array.isArray(v);
