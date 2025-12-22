export interface TocItem {
  depth: number; // 1-6
  id: string;
  text: string;
}

export const createSlugger = () => {
  const counts = new Map<string, number>();

  const normalize = (raw: string): string => {
    const base = String(raw || '').trim().toLowerCase();
    const hyphenated = base
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
    return hyphenated || 'section';
  };

  return (rawText: string): string => {
    const base = normalize(rawText);
    const prev = counts.get(base) ?? 0;
    const next = prev + 1;
    counts.set(base, next);
    return prev === 0 ? base : `${base}-${next}`;
  };
};

const parseAttrs = (raw: string): Record<string, string> => {
  const out: Record<string, string> = {};
  const text = String(raw || '');
  const re = /(\w+)\s*=\s*"([^"]*)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    out[m[1]] = m[2];
  }
  return out;
};

// 预处理：把自定义容器语法转换成“标准 Markdown 可解析结构”。
export const preprocessDocMarkdown = (markdown: string): string => {
  const lines = String(markdown || '').replace(/\r\n/g, '\n').split('\n');
  const out: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // :::video{...}:::
    const videoMatch = line.match(/^:::video\{(.+)\}:::\s*$/);
    if (videoMatch) {
      const attrs = parseAttrs(videoMatch[1]);
      const src = attrs.src || '';
      const caption = attrs.caption || '';

      out.push('');
      out.push('```pangen-video');
      out.push(`src=${src}`);
      if (caption) out.push(`caption=${caption}`);
      out.push('```');
      out.push('');
      continue;
    }

    // :::callout{...}
    const calloutStart = line.match(/^:::callout\{(.+)\}\s*$/);
    if (calloutStart) {
      // 只有找到闭合行（:::）才做转换，避免误吞后续内容。
      let endIndex = -1;
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].trim() === ':::') {
          endIndex = j;
          break;
        }
      }
      if (endIndex === -1) {
        out.push(line);
        continue;
      }

      const attrs = parseAttrs(calloutStart[1]);
      const type = (attrs.type || 'info').toLowerCase();
      const title = (attrs.title || '').trim();
      const bodyLines = lines.slice(i + 1, endIndex);
      i = endIndex; // consume closing

      out.push('');
      out.push(`> [!${type}]${title ? ` ${title}` : ''}`);
      out.push('>');
      for (const bl of bodyLines) {
        out.push(bl.trim().length === 0 ? '>' : `> ${bl}`);
      }
      out.push('');
      continue;
    }

    out.push(line);
  }

  return out.join('\n');
};

const stripInlineMd = (text: string): string =>
  text
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1') // links
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .trim();

export const extractDocToc = (markdown: string): TocItem[] => {
  const processed = preprocessDocMarkdown(markdown);
  const slug = createSlugger();
  const toc: TocItem[] = [];

  const lines = processed.split('\n');
  let inFence = false;

  for (const line of lines) {
    const fence = line.match(/^```/);
    if (fence) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const m = line.match(/^(#{1,6})\s+(.+?)\s*$/);
    if (!m) continue;

    const depth = m[1].length;
    const text = stripInlineMd(m[2]);
    const id = slug(text);
    toc.push({ depth, text, id });
  }

  return toc;
};
