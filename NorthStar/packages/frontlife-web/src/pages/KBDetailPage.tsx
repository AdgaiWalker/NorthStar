import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import {
  CheckCircle,
  Pencil,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  MessageSquare,
} from 'lucide-react';
import { getKB, getArticle, getUser, getKBPosts, TAG_LABELS } from '@/data/mock';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { generateSummary } from '@/services/AIService';
import CodeBlock from '@/components/CodeBlock';
import ImageRenderer from '@/components/ImageRenderer';
import Callout, { extractCalloutFromBlockquote } from '@/components/Callout';

export default function KBDetailPage() {
  const { kbId, articleId } = useParams<{ kbId: string; articleId?: string }>();
  const navigate = useNavigate();
  const kb = getKB(kbId!);
  const bookmarks = useAppStore((s) => s.bookmarks);
  const toggleBookmark = useAppStore((s) => s.toggleBookmark);

  const [currentArticleId, setCurrentArticleId] = useState(
    articleId || kb?.articles[0]
  );
  const article = getArticle(currentArticleId);
  const [fbHelpful, setFbHelpful] = useState(false);
  const [fbChanged, setFbChanged] = useState(false);
  const [showChangeForm, setShowChangeForm] = useState(false);
  const [activeHeading, setActiveHeading] = useState('');
  const [aiSummary, setAiSummary] = useState('');
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiSummaryError, setAiSummaryError] = useState('');
  const [activeTab, setActiveTab] = useState<'articles' | 'discussions'>('articles');

  const showAiSummaryBtn = article && article.content.length > 1000;

  useEffect(() => {
    if (articleId) setCurrentArticleId(articleId);
  }, [articleId]);

  // Extract headings for TOC
  const headings = article
    ? extractHeadings(article.content)
    : [];

  const currentIdx = kb?.articles.indexOf(currentArticleId!) ?? -1;
  const prevArticle = currentIdx > 0 ? kb!.articles[currentIdx - 1] : null;
  const nextArticle =
    currentIdx < (kb?.articles.length ?? 0) - 1
      ? kb!.articles[currentIdx + 1]
      : null;

  // Scroll spy for TOC
  useEffect(() => {
    if (!headings.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveHeading(entry.target.id);
          }
        });
      },
      { rootMargin: '-80px 0px -60% 0px' }
    );
    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [headings, currentArticleId]);

  const scrollToHeading = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const switchArticle = (aid: string) => {
    setCurrentArticleId(aid);
    navigate(`/kb/${kbId}/${aid}`);
    window.scrollTo(0, 0);
  };

  if (!kb) {
    return (
      <div className="px-5 py-20 text-center text-ink-muted">
        内容不存在
      </div>
    );
  }

  const kbPosts = getKBPosts(kb.id);
  const author = article ? getUser(article.authorId) : null;
  const isBookmarked = article ? bookmarks[article.id] : false;

  return (
    <div className="flex min-h-[calc(100vh-var(--nav-h))]">
      {/* Left Sidebar - Article Tree */}
      <aside className="sticky top-nav-h hidden h-[calc(100vh-var(--nav-h))] w-[240px] shrink-0 overflow-y-auto border-r border-border-light bg-bg-subtle lg:block">
        <div className="border-b border-border-light px-4 pb-4 pt-5">
          <div className="mb-1.5 text-2xl">{kb.icon}</div>
          <div className="font-display text-[17px] font-bold leading-snug text-ink">
            {kb.name}
          </div>
          <div className="mt-1 text-xs text-ink-muted">
            {kb.articles.length} 篇文章 · {kb.saves} 收藏
          </div>
        </div>
        <div className="py-2">
          {kb.articles.map((aid) => {
            const a = getArticle(aid);
            if (!a) return null;
            const active = aid === currentArticleId;
            return (
              <button
                key={aid}
                onClick={() => switchArticle(aid)}
                className={cn(
                  'flex w-full items-center gap-2 px-4 py-2.5 text-left text-[13px] transition-all',
                  active
                    ? 'border-l-[3px] border-sage bg-sage-light font-semibold text-sage'
                    : 'border-l-[3px] border-transparent text-ink-secondary hover:bg-bg-subtle hover:text-ink'
                )}
              >
                {a.title}
              </button>
            );
          })}
        </div>
      </aside>

      {/* Middle TOC - only show in articles tab */}
      {activeTab === 'articles' && (
        <aside className="sticky top-nav-h hidden h-[calc(100vh-var(--nav-h))] w-[200px] shrink-0 overflow-y-auto py-6 pl-6 pr-3 xl:block">
          <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
            目录
          </div>
          {headings.map((h) => (
            <button
              key={h.id}
              onClick={() => scrollToHeading(h.id)}
              className={cn(
                'block w-full border-l-2 py-1.5 pl-3 text-left text-[13px] leading-relaxed transition-all',
                activeHeading === h.id
                  ? 'border-sage bg-sage-light font-semibold text-sage'
                  : 'border-border-light text-ink-muted hover:border-ink-muted hover:text-ink'
              )}
            >
              {h.text}
            </button>
          ))}
        </aside>
      )}

      {/* Content */}
      <article className="min-w-0 flex-1 px-4 py-6 md:px-10 md:py-8 lg:max-w-[720px]">
        {/* Tab Switcher */}
        <div className="mb-6 flex gap-1 rounded-lg border border-border-light bg-bg-subtle p-1">
          <button
            onClick={() => setActiveTab('articles')}
            className={cn(
              'flex-1 rounded-md py-2 text-sm font-medium transition-all',
              activeTab === 'articles'
                ? 'bg-white text-ink shadow-sm'
                : 'text-ink-muted hover:text-ink'
            )}
          >
            文章 ({kb.articles.length})
          </button>
          <button
            onClick={() => setActiveTab('discussions')}
            className={cn(
              'flex-1 rounded-md py-2 text-sm font-medium transition-all',
              activeTab === 'discussions'
                ? 'bg-white text-ink shadow-sm'
                : 'text-ink-muted hover:text-ink'
            )}
          >
            讨论 ({kbPosts.length})
          </button>
        </div>

        {activeTab === 'articles' && article && (
          <>
            <h1 className="font-display text-[28px] font-bold leading-tight text-ink">
              {article.title}
            </h1>

        <div className="mb-7 mt-3 flex flex-wrap items-center justify-between gap-y-2 border-b border-border-light pb-5 text-[13px] text-ink-muted">
          <div className="flex flex-wrap items-center gap-2.5">
            <span>{author!.name}</span>
            <span>·</span>
            <span>更新于 {article.updatedAt}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <EyeIcon /> {article.views}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-sage-light px-2.5 py-1 text-[11px] text-sage">
              <CheckCircle size={11} />
              确认于{article.confirmedAgo}
            </span>
            <button
              onClick={() => toggleBookmark(article.id)}
              className={cn(
                'flex items-center gap-1 text-xs transition-colors',
                isBookmarked ? 'text-sage' : 'text-ink-faint hover:text-sage'
              )}
            >
              <Bookmark size={14} fill={isBookmarked ? 'currentColor' : 'none'} />
              {isBookmarked ? '已收藏' : '收藏'}
            </button>
          </div>
        </div>

        {showAiSummaryBtn && !aiSummary && (
          <div className="mb-5">
            <button
              onClick={async () => {
                if (!article) return;
                setAiSummaryLoading(true);
                setAiSummaryError('');
                try {
                  const summary = await generateSummary(article.content);
                  setAiSummary(summary);
                } catch (e) {
                  setAiSummaryError(e instanceof Error ? e.message : '生成摘要失败');
                } finally {
                  setAiSummaryLoading(false);
                }
              }}
              disabled={aiSummaryLoading}
              className="inline-flex items-center gap-1.5 rounded-full border border-sage-light bg-sage-light px-3.5 py-1.5 text-xs font-medium text-sage transition-colors hover:bg-sage hover:text-white disabled:opacity-50"
            >
              <Sparkles size={13} />
              {aiSummaryLoading ? 'AI 正在生成摘要...' : 'AI 生成摘要'}
            </button>
            {aiSummaryError && (
              <div className="mt-2 text-xs text-red-500">{aiSummaryError}</div>
            )}
          </div>
        )}

        {aiSummary && (
          <div className="mb-6 rounded-lg border border-sage-light bg-sage-light/30 p-4">
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-sage">
              <Sparkles size={13} />
              AI 摘要
            </div>
            <p className="text-[14px] leading-relaxed text-ink-secondary">{aiSummary}</p>
          </div>
        )}

        <div className="markdown-body text-[16px] leading-[1.9] text-ink">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw, rehypeSanitize]}
            components={{
              h2: ({ node, ...props }) => (
                <h2
                  id={props.id || slugify(String(props.children))}
                  className="mt-9 mb-4 border-b-2 border-border-light pb-2 font-display text-[22px] font-bold text-ink"
                  {...props}
                />
              ),
              p: ({ node, ...props }) => (
                <p className="mb-4" {...props} />
              ),
              blockquote: ({ node, children, ...props }) => {
                const callout = extractCalloutFromBlockquote(children);
                if (callout) {
                  return <Callout type={callout.type}>{callout.content}</Callout>;
                }
                return (
                  <blockquote
                    className="my-4 rounded-r-md border-l-[3px] border-sage bg-sage-light px-4 py-3 text-[14px] text-ink-secondary"
                    {...props}
                  >
                    {children}
                  </blockquote>
                );
              },
              code: ({ node, inline, className, children, ...props }: any) => (
                <CodeBlock inline={inline} className={className} {...props}>
                  {children}
                </CodeBlock>
              ),
              img: ({ node, ...props }: any) => <ImageRenderer {...props} />,
              table: ({ node, ...props }) => (
                <div className="my-4 overflow-x-auto">
                  <table
                    className="w-full border-collapse text-[14px]"
                    {...props}
                  />
                </div>
              ),
              th: ({ node, ...props }) => (
                <th
                  className="border border-border bg-bg-subtle px-3.5 py-2.5 text-left font-semibold"
                  {...props}
                />
              ),
              td: ({ node, ...props }) => (
                <td className="border border-border px-3.5 py-2.5" {...props} />
              ),
            }}
          >
            {injectHeadingIds(article.content)}
          </ReactMarkdown>
        </div>

        {/* Feedback */}
        <div className="mt-12 border-t border-border pt-7">
          <div className="font-display text-base font-bold text-ink">
            这篇内容对你有帮助吗？
          </div>
          <div className="mt-1 text-[13px] text-ink-muted">
            你的反馈帮助作者保持内容准确
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => setFbHelpful(!fbHelpful)}
              className={cn(
                'rounded border px-6 py-2.5 text-sm font-medium transition-all',
                fbHelpful
                  ? 'border-sage bg-sage text-white'
                  : 'border-border bg-white text-ink-secondary hover:border-sage hover:text-sage'
              )}
            >
              <CheckCircle size={14} className="mr-1.5 inline" />
              有帮助
            </button>
            <button
              onClick={() => {
                setFbChanged(!fbChanged);
                setShowChangeForm(!showChangeForm);
              }}
              className={cn(
                'rounded border px-6 py-2.5 text-sm font-medium transition-all',
                fbChanged
                  ? 'border-sage bg-sage text-white'
                  : 'border-border bg-white text-ink-secondary hover:border-sage hover:text-sage'
              )}
            >
              <Pencil size={14} className="mr-1.5 inline" />
              有变化
            </button>
          </div>
          {showChangeForm && (
            <div className="mt-4 rounded-lg border border-border-light bg-bg-subtle p-4">
              <input
                type="text"
                placeholder="什么变了？告诉我们新的信息..."
                className="h-10 w-full rounded-lg border border-border bg-white px-3 text-[13px] outline-none focus:border-sage"
              />
              <button className="mt-3 rounded-lg bg-sage px-5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-sage-dark">
                提交反馈
              </button>
            </div>
          )}
        </div>

        {/* Article Nav */}
        <div className="mt-10 flex justify-between gap-4 border-t border-border pt-6">
          {prevArticle ? (
            <button
              onClick={() => switchArticle(prevArticle)}
              className="max-w-[45%] rounded-lg border border-border-light p-3 text-left transition-all hover:border-sage hover:text-sage"
            >
              <div className="mb-1 flex items-center gap-1 text-[11px] text-ink-faint">
                <ChevronLeft size={12} /> 上一篇
              </div>
              <div className="text-[13px] font-medium">
                {getArticle(prevArticle)?.title}
              </div>
            </button>
          ) : (
            <div />
          )}
          {nextArticle ? (
            <button
              onClick={() => switchArticle(nextArticle)}
              className="max-w-[45%] rounded-lg border border-border-light p-3 text-right transition-all hover:border-sage hover:text-sage"
            >
              <div className="mb-1 flex items-center justify-end gap-1 text-[11px] text-ink-faint">
                下一篇 <ChevronRight size={12} />
              </div>
              <div className="text-[13px] font-medium">
                {getArticle(nextArticle)?.title}
              </div>
            </button>
          ) : (
            <div />
          )}
        </div>
      </>
    )}

    {activeTab === 'discussions' && (
      <div className="space-y-4">
        {kbPosts.length === 0 && (
          <div className="py-20 text-center text-ink-muted">
            该知识库暂无讨论
          </div>
        )}
        {kbPosts.map((post: any) => {
          const u = getUser(post.authorId);
          return (
            <button
              key={post.id}
              onClick={() => navigate(`/post/${post.id}`)}
              className="mb-3 w-full rounded-lg border border-border-light bg-surface p-5 text-left transition-all hover:border-border hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="mb-2 flex items-center gap-2">
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white"
                  style={{ background: u.color }}
                >
                  {u.name[0]}
                </div>
                <span className="text-[13px] font-medium text-ink-secondary">
                  {u.name}
                </span>
                <span className="text-xs text-ink-faint">· {post.time}</span>
              </div>
              <p className="line-clamp-3 text-[17px] font-medium leading-relaxed text-ink">
                {post.content}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {post.tags.map((t: string) => (
                  <span
                    key={t}
                    className="rounded-full bg-bg-subtle px-2 py-0.5 text-[11px] font-medium text-ink-muted"
                  >
                    {TAG_LABELS[t]}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-4 text-xs text-ink-faint">
                <span className="flex items-center gap-1">
                  <MessageSquare size={12} /> {post.replies.length}
                </span>
                <span className="flex items-center gap-1">
                  <EyeIcon /> {post.views}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    )}
  </article>
    </div>
  );
}

function extractHeadings(content: string): { id: string; text: string }[] {
  const lines = content.split('\n');
  const headings: { id: string; text: string }[] = [];
  lines.forEach((line) => {
    const match = line.match(/^##\s+(.+)$/);
    if (match) {
      const text = match[1];
      headings.push({ id: slugify(text), text });
    }
  });
  return headings;
}

function injectHeadingIds(content: string): string {
  return content.replace(/^##\s+(.+)$/gm, (_, text) => {
    return `## ${text}\n<a id="${slugify(text)}"></a>`;
  });
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 40);
}

function EyeIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
