/**
 * 双链 [[...]] 解析与渲染工具
 *
 * 语法定义：
 *   - [[标题]]                 => 文档链接，匹配文章标题
 *   - [[标题|别名]]            => 文档链接，显示别名
 *   - [[标题#锚点]]            => 文档链接带锚点
 *   - [[tool:ID]]             => 工具链接
 *   - [[tool:ID|别名]]         => 工具链接
 *   - [[solution:ID]]         => 方案链接（本地存储，暂不可路由）
 *   - [[solution:ID|别名]]
 */

export type WikiLinkTarget =
  | { kind: 'doc'; title: string; alias?: string; anchor?: string }
  | { kind: 'tool'; id: string; alias?: string }
  | { kind: 'solution'; id: string; alias?: string };

const WIKILINK_RE = /\[\[([^\]]+)\]\]/g;

/**
 * 将 `[[...]]` 语法解析为结构化信息。
 */
export const parseWikiLink = (raw: string): WikiLinkTarget | null => {
  const inner = raw.trim();
  if (!inner) return null;

  // tool:xxx
  if (inner.startsWith('tool:')) {
    const rest = inner.slice(5); // 去掉 "tool:"
    const [idPart, ...aliasParts] = rest.split('|');
    const id = (idPart || '').trim();
    const alias = aliasParts.length ? aliasParts.join('|').trim() : undefined;
    return { kind: 'tool', id, alias };
  }

  // solution:xxx
  if (inner.startsWith('solution:')) {
    const rest = inner.slice(9);
    const [idPart, ...aliasParts] = rest.split('|');
    const id = (idPart || '').trim();
    const alias = aliasParts.length ? aliasParts.join('|').trim() : undefined;
    return { kind: 'solution', id, alias };
  }

  // 默认：文档
  const [mainPart, ...aliasParts] = inner.split('|');
  const main = (mainPart || '').trim();
  const alias = aliasParts.length ? aliasParts.join('|').trim() : undefined;

  const hashIdx = main.indexOf('#');
  if (hashIdx >= 0) {
    const title = main.slice(0, hashIdx).trim();
    const anchor = main.slice(hashIdx + 1).trim();
    return { kind: 'doc', title, anchor: anchor || undefined, alias };
  }

  return { kind: 'doc', title: main, alias };
};

/**
 * 解析文本中的所有 [[...]]，返回 segments：
 *   - string：普通文本片段
 *   - WikiLinkTarget：已解析的链接
 */
export type WikiLinkSegment = string | WikiLinkTarget;

export const parseWikiLinks = (text: string): WikiLinkSegment[] => {
  const segments: WikiLinkSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = WIKILINK_RE.exec(text))) {
    if (match.index > lastIndex) {
      segments.push(text.slice(lastIndex, match.index));
    }
    const parsed = parseWikiLink(match[1]);
    if (parsed) {
      segments.push(parsed);
    } else {
      // 无法解析，保留原文
      segments.push(match[0]);
    }
    lastIndex = WIKILINK_RE.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push(text.slice(lastIndex));
  }

  return segments;
};

/**
 * 检查给定文本中是否包含 [[...]] 语法
 */
export const hasWikiLinks = (text: string): boolean => WIKILINK_RE.test(text);

// --------------------------
// 预处理：将 [[...]] 转换为标准 Markdown 链接
// --------------------------
import { MOCK_ARTICLES, MOCK_TOOLS } from '@/constants';

const resolveDocHref = (title: string): string | null => {
  const art = MOCK_ARTICLES.find((a) => a.title === title);
  return art ? `/article/${art.id}` : null;
};

const resolveToolHref = (id: string): string | null => {
  const t = MOCK_TOOLS.find((x) => x.id === id);
  return t ? `/tool/${t.id}` : null;
};

/**
 * 将 Markdown 文本中的 [[...]] 转换为标准链接，供 react-markdown 解析。
 * - 文档链接：[[Title]] => [Title](/article/xxx)
 * - 工具链接：[[tool:ID|alias]] => [alias](/tool/xxx)
 * - 方案链接：暂不支持跳转，保留文本
 */
export const preprocessWikiLinks = (md: string): string => {
  return md.replace(/\[\[([^\]]+)\]\]/g, (_, inner: string) => {
    const parsed = parseWikiLink(inner);
    if (!parsed) return `[[${inner}]]`;

    if (parsed.kind === 'doc') {
      const href = resolveDocHref(parsed.title);
      const label = parsed.alias || parsed.title;
      const suffix = parsed.anchor ? `#${parsed.anchor}` : '';
      if (href) return `[${label}](${href}${suffix})`;
      // 不存在的文档，显式提示
      return `\`未找到：${label}\``;
    }

    if (parsed.kind === 'tool') {
      const href = resolveToolHref(parsed.id);
      const label = parsed.alias || parsed.id;
      if (href) return `[${label}](${href})`;
      return `\`未找到：${label}\``;
    }

    if (parsed.kind === 'solution') {
      // 方案本地存储，暂不支持路由
      const label = parsed.alias || parsed.id;
      return `\`未找到：${label}\``;
    }

    return `[[${inner}]]`;
  });
};
