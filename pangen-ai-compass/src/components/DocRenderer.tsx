import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { createSlugger, preprocessDocMarkdown } from '../utils/docMarkdown';
import { preprocessWikiLinks } from '../utils/wikilink';

type DocRendererProps = {
  markdown: string;
};

const getPlainText = (children: React.ReactNode): string => {
  const parts: string[] = [];
  const walk = (node: React.ReactNode) => {
    if (node == null || node === false) return;
    if (typeof node === 'string' || typeof node === 'number') {
      parts.push(String(node));
      return;
    }
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (React.isValidElement(node)) {
      const el = node as React.ReactElement<any>;
      walk(el.props.children);
      return;
    }
  };
  walk(children);
  return parts.join('').replace(/\s+/g, ' ').trim();
};

const parseKeyValueLines = (text: string): Record<string, string> => {
  const out: Record<string, string> = {};
  const lines = String(text || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  for (const line of lines) {
    const idx = line.indexOf('=');
    if (idx <= 0) continue;
    const k = line.slice(0, idx).trim();
    const v = line.slice(idx + 1).trim();
    if (!k) continue;
    out[k] = v;
  }
  return out;
};

const isHttpsMp4 = (src: string) => /^https:\/\/.+\.mp4(\?.*)?$/i.test(String(src || '').trim());

const VideoBlock: React.FC<{ src: string; caption?: string }> = ({ src, caption }) => {
  if (!isHttpsMp4(src)) {
    return (
      <div className="my-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <div className="font-semibold">视频块格式不正确</div>
        <div className="mt-1">目前仅支持 https 的直链 mp4，例如：:::video{'{'}src=&quot;https://.../demo.mp4&quot;caption=&quot;...&quot;{'}'}:::</div>
      </div>
    );
  }

  return (
    <figure className="my-4">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-black">
        <video className="h-auto w-full" controls playsInline preload="metadata" src={src} />
      </div>
      {caption ? <figcaption className="mt-2 text-sm text-slate-500">{caption}</figcaption> : null}
    </figure>
  );
};

const getCalloutStyle = (type: string) => {
  switch (type) {
    case 'tip':
      return { box: 'border-emerald-200 bg-emerald-50 text-emerald-950', title: 'text-emerald-900' };
    case 'warning':
      return { box: 'border-amber-200 bg-amber-50 text-amber-950', title: 'text-amber-900' };
    case 'danger':
    case 'error':
      return { box: 'border-rose-200 bg-rose-50 text-rose-950', title: 'text-rose-900' };
    case 'note':
      return { box: 'border-slate-200 bg-slate-50 text-slate-950', title: 'text-slate-900' };
    case 'info':
    default:
      return { box: 'border-sky-200 bg-sky-50 text-sky-950', title: 'text-sky-900' };
  }
};

const tryParseCalloutHeader = (children: React.ReactNode) => {
  // 期望第一个段落形如："[!tip] 标题"
  const text = getPlainText(children);
  const m = text.match(/^\[!(\w+)\]\s*(.*)$/);
  if (!m) return null;
  return {
    type: (m[1] || 'info').toLowerCase(),
    title: (m[2] || '').trim(),
  };
};

export const DocRenderer: React.FC<DocRendererProps> = ({ markdown }) => {
  const processed = preprocessDocMarkdown(markdown);
  const withWikiLinks = preprocessWikiLinks(processed);
  const slugger = createSlugger();

  const Heading = (Tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6') => {
    const Comp: React.FC<any> = ({ children, className, ...rest }) => {
      const text = getPlainText(children);
      const id = slugger(text);
      const merged = [className, 'scroll-mt-24'].filter(Boolean).join(' ');
      return (
        <Tag id={id} className={merged} {...rest}>
          {children}
        </Tag>
      );
    };
    return Comp;
  };

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: Heading('h1'),
        h2: Heading('h2'),
        h3: Heading('h3'),
        h4: Heading('h4'),
        h5: Heading('h5'),
        h6: Heading('h6'),
        pre: ({ children, ...props }: any) => {
          const childArray = React.Children.toArray(children);
          const onlyChild = childArray.length === 1 ? childArray[0] : null;
          if (React.isValidElement(onlyChild)) {
            const el = onlyChild as React.ReactElement<any>;
            if (el.props['data-pangen-block']) {
              return <>{onlyChild}</>;
            }
          }
          return <pre {...props}>{children}</pre>;
        },
        code: (codeProps: any) => {
          const { inline, className, children, ...props } = codeProps;
          const match = /language-(\S+)/.exec(className || '');
          const lang = match?.[1] || '';

          if (!inline && lang === 'pangen-video') {
            const kv = parseKeyValueLines(String(children));
            return (
              <div data-pangen-block="pangen-video">
                <VideoBlock src={kv.src || ''} caption={kv.caption} />
              </div>
            );
          }

          return (
            <code className={className} {...props}>
              {children}
            </code>
          );
        },
        blockquote: ({ children, ...props }: any) => {
          const arr = React.Children.toArray(children);
          const first = arr[0];

          if (React.isValidElement(first) && first.type === 'p') {
            const firstEl = first as React.ReactElement<any>;
            const header = tryParseCalloutHeader(firstEl.props.children);
            if (header) {
              const style = getCalloutStyle(header.type);

              // body：跳过第一个段落（标题），并去掉可能的空段落
              const body = arr
                .slice(1)
                .filter((n) => {
                  if (!React.isValidElement(n)) return true;
                  if ((n as React.ReactElement<any>).type !== 'p') return true;
                  const t = getPlainText((n as React.ReactElement<any>).props.children);
                  return t.length > 0;
                });

              return (
                <div className={`my-4 rounded-xl border px-4 py-3 ${style.box}`}>
                  <div className={`text-sm font-semibold ${style.title}`}>{header.title || '提示'}</div>
                  {body.length ? <div className="mt-2 text-sm leading-relaxed">{body}</div> : null}
                </div>
              );
            }
          }

          return <blockquote {...props}>{children}</blockquote>;
        },
      }}
    >
      {withWikiLinks}
    </ReactMarkdown>
  );
};
