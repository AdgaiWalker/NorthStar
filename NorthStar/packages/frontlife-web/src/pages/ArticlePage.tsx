import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { AlertTriangle, Bookmark, CheckCircle, FileText, Flag, Pencil } from 'lucide-react';
import { ErrorState, LoadingState } from '@/components/LoadingState';
import { api, type ArticleDetail, type ArticleSummary } from '@/services/api';
import CodeBlock from '@/components/CodeBlock';
import ImageRenderer from '@/components/ImageRenderer';
import Callout, { extractCalloutFromBlockquote } from '@/components/Callout';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/store/useUserStore';

export default function ArticlePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const token = useUserStore((state) => state.token);
  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [helpfulDone, setHelpfulDone] = useState(false);
  const [changeOpen, setChangeOpen] = useState(false);
  const [changeNote, setChangeNote] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [message, setMessage] = useState('');
  const [previousArticleId, setPreviousArticleId] = useState<string | null>(null);
  const [nextArticleId, setNextArticleId] = useState<string | null>(null);
  const [spaceArticles, setSpaceArticles] = useState<ArticleSummary[]>([]);
  const headings = article ? extractHeadings(article.content) : [];

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    api
      .getArticle(id)
      .then((result) => {
        if (!cancelled) {
          setArticle(result.article);
          setPreviousArticleId(result.previousArticleId);
          setNextArticleId(result.nextArticleId);
          api
            .getSpace(result.article.space.id)
            .then((spaceResult) => {
              if (!cancelled) setSpaceArticles(spaceResult.articles);
            })
            .catch(() => undefined);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : '文章加载失败');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const markHelpful = async () => {
    if (!token) return navigate('/login');
    if (!article || helpfulDone) return;
    const result = await api.markArticleHelpful(article.id);
    setArticle({ ...article, helpfulCount: result.helpfulCount, confirmedAt: result.confirmedAt });
    setHelpfulDone(true);
    setMessage('已确认有帮助');
  };

  const submitChange = async () => {
    if (!token) return navigate('/login');
    if (!article || !changeNote.trim()) return;
    const result = await api.markArticleChanged(article.id, changeNote.trim());
    setArticle({
      ...article,
      changedCount: result.changedCount,
      changeNotes: [result.feedback, ...article.changeNotes],
    });
    setChangeNote('');
    setChangeOpen(false);
    setMessage('变化反馈已提交');
  };

  const submitReport = async () => {
    if (!token) return navigate('/login');
    if (!article || !reportReason.trim()) return;
    await api.reportContent({
      targetType: 'article',
      targetId: article.id,
      reason: reportReason.trim(),
    });
    setReportReason('');
    setReportOpen(false);
    setMessage('举报已提交');
  };

  const favoriteArticle = async () => {
    if (!token) return navigate('/login');
    if (!article) return;
    await api.favorite({ targetType: 'article', targetId: article.id });
    setMessage('已收藏');
  };

  return (
    <div className="mx-auto max-w-content-max overflow-x-hidden px-4 py-6 sm:px-5 sm:py-8">
      {loading && <LoadingState label="正在加载文章..." />}
      {!loading && error && <ErrorState message={error} />}
      {!loading && !error && article && (
        <div className="lg:grid lg:grid-cols-[200px_minmax(0,1fr)_190px] lg:gap-4 xl:grid-cols-[220px_minmax(0,1fr)_210px] xl:gap-5">
          <aside className="sticky top-[72px] hidden max-h-[calc(100vh-88px)] overflow-y-auto rounded-2xl border border-border-light bg-bg-subtle p-4 lg:block">
            <div className="mb-3 text-xs font-semibold tracking-wider text-ink-muted">同空间</div>
            <div className="space-y-1">
              {spaceArticles.length === 0 && (
                <div className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-sage">{article.title}</div>
              )}
              {spaceArticles.map((item) => (
                <Link
                  key={item.id}
                  to={`/article/${item.id}`}
                  className={cn(
                    'block rounded-lg px-3 py-2 text-sm transition-colors',
                    item.id === article.id
                      ? 'bg-white font-medium text-sage'
                      : 'text-ink-secondary hover:bg-white hover:text-sage',
                  )}
                >
                  {item.title}
                </Link>
              ))}
            </div>
          </aside>

        <article className="min-w-0 rounded-2xl border border-border-light bg-surface p-5 sm:p-6">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3 sm:gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sage-light text-sage">
              <FileText size={20} />
            </div>
            <div className="flex flex-wrap items-center justify-end gap-1">
              <button
                onClick={() => {
                  if (!token) return navigate('/login');
                  setReportOpen((value) => !value);
                }}
                className="rounded-lg px-2 py-1 text-xs text-ink-faint transition-colors hover:bg-bg-subtle hover:text-rose-custom"
              >
                <Flag size={14} className="mr-1 inline" />
                举报
              </button>
              <button
                onClick={favoriteArticle}
                className="rounded-lg px-2 py-1 text-xs text-ink-faint transition-colors hover:bg-bg-subtle hover:text-sage"
              >
                <Bookmark size={14} className="mr-1 inline" />
                收藏
              </button>
            </div>
          </div>

          <h1 className="break-words font-display text-[28px] font-bold leading-tight text-ink sm:text-[30px]">{article.title}</h1>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-ink-faint">
            <span>{article.author.name}</span>
            <span>{article.helpfulCount} 人确认</span>
            {article.confirmedAt && <span>确认于 {new Date(article.confirmedAt).toLocaleDateString()}</span>}
          </div>

          {article.changedCount > 0 && (
            <div className="mt-5 rounded-xl border border-amber-light bg-amber-light p-4 text-sm leading-6 text-amber-custom">
              <AlertTriangle size={15} className="mr-1 inline" />
              {article.changedCount} 人反馈可能有变化
              {article.changeNotes[0] && <div className="mt-1 text-xs">{article.changeNotes[0].note}</div>}
            </div>
          )}

          {reportOpen && (
            <div className="mt-5 rounded-xl border border-border-light bg-bg-subtle p-4">
              <textarea
                value={reportReason}
                onChange={(event) => setReportReason(event.target.value)}
                placeholder="请说明举报原因"
                className="h-20 w-full resize-none rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-sage"
              />
              <button onClick={submitReport} className="mt-2 rounded-lg bg-sage px-4 py-2 text-sm font-medium text-white">
                提交举报
              </button>
            </div>
          )}

          <div className="markdown-body mt-7 min-w-0 break-words text-[16px] leading-[1.9] text-ink">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw, rehypeSanitize]}
              components={{
                p: ({ node: _node, ...props }) => <p className="mb-4 break-words" {...props} />,
                h2: ({ node: _node, children, ...props }) => {
                  const id = String(children).toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-');
                  return (
                    <h2 id={id} className="mb-4 mt-9 border-b-2 border-border-light pb-2 font-display text-[22px] font-bold text-ink" {...props}>
                      {children}
                    </h2>
                  );
                },
                blockquote: ({ node: _node, children, ...props }) => {
                  const callout = extractCalloutFromBlockquote(children);
                  if (callout) return <Callout type={callout.type}>{callout.content}</Callout>;
                  return (
                    <blockquote className="my-4 rounded-r-md border-l-[3px] border-sage bg-sage-light px-4 py-3 text-[14px] text-ink-secondary" {...props}>
                      {children}
                    </blockquote>
                  );
                },
                code: ({ node: _node, inline, className, children, ...props }: any) => (
                  <CodeBlock inline={inline} className={className} {...props}>
                    {children}
                  </CodeBlock>
                ),
                img: ({ node: _node, ...props }: any) => <ImageRenderer {...props} />,
                table: ({ node: _node, ...props }) => (
                  <div className="my-4 overflow-x-auto">
                    <table className="w-full min-w-[520px] border-collapse text-[14px]" {...props} />
                  </div>
                ),
                th: ({ node: _node, ...props }) => (
                  <th className="border border-border bg-bg-subtle px-3.5 py-2.5 text-left font-semibold" {...props} />
                ),
                td: ({ node: _node, ...props }) => <td className="border border-border px-3.5 py-2.5" {...props} />,
              }}
            >
              {article.content}
            </ReactMarkdown>
          </div>

          <div className="mt-8 border-t border-border-light pt-5">
            <div className="font-display text-base font-bold text-ink">这篇内容对你有帮助吗？</div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={markHelpful}
                className={cn(
                  'min-h-10 rounded-lg border px-4 py-2 text-sm font-medium transition-all',
                  helpfulDone ? 'border-sage bg-sage text-white' : 'border-border text-ink-secondary hover:border-sage hover:text-sage',
                )}
              >
                <CheckCircle size={14} className="mr-1 inline" />
                有帮助
              </button>
              <button
                onClick={() => {
                  if (!token) return navigate('/login');
                  setChangeOpen((value) => !value);
                }}
                className="min-h-10 rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink-secondary transition-all hover:border-sage hover:text-sage"
              >
                <Pencil size={14} className="mr-1 inline" />
                有变化
              </button>
            </div>
            {changeOpen && (
              <div className="mt-4 rounded-xl border border-border-light bg-bg-subtle p-4">
                <input
                  value={changeNote}
                  onChange={(event) => setChangeNote(event.target.value)}
                  placeholder="什么变了？"
                  className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-sage"
                />
                <button onClick={submitChange} className="mt-3 rounded-lg bg-sage px-4 py-2 text-sm font-medium text-white">
                  提交反馈
                </button>
              </div>
            )}
            {message && <div className="mt-3 text-sm text-sage">{message}</div>}
          </div>

          <nav className="mt-8 flex flex-col justify-between gap-3 border-t border-border-light pt-5 sm:flex-row">
            {previousArticleId ? (
              <Link to={`/article/${previousArticleId}`} className="rounded-xl border border-border-light px-4 py-3 text-sm text-ink-secondary transition-colors hover:border-sage hover:text-sage">
                上一篇
              </Link>
            ) : (
              <div />
            )}
            {nextArticleId && (
              <Link to={`/article/${nextArticleId}`} className="rounded-xl border border-border-light px-4 py-3 text-sm text-ink-secondary transition-colors hover:border-sage hover:text-sage">
                下一篇
              </Link>
            )}
          </nav>
        </article>

          <aside className="sticky top-[72px] hidden max-h-[calc(100vh-88px)] overflow-y-auto rounded-2xl border border-border-light bg-surface p-4 lg:block">
            <div className="mb-3 text-xs font-semibold tracking-wider text-ink-muted">目录</div>
            {headings.length === 0 && <div className="text-sm text-ink-faint">暂无目录</div>}
            {headings.map((heading) => (
              <a key={heading.id} href={`#${heading.id}`} className="block rounded-lg px-3 py-2 text-sm text-ink-secondary hover:bg-bg-subtle hover:text-sage">
                {heading.text}
              </a>
            ))}
            <div className="mt-4 border-t border-border-light pt-3 text-xs leading-6 text-ink-muted">
              <div>{article.helpfulCount} 人确认</div>
              <div>更新于 {new Date(article.updatedAt).toLocaleDateString()}</div>
              {article.changedCount > 0 && <div className="text-amber-custom">{article.changedCount} 条变化反馈</div>}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function extractHeadings(content: string) {
  return content
    .split('\n')
    .map((line) => line.match(/^##\s+(.+)$/)?.[1])
    .filter((text): text is string => Boolean(text))
    .map((text) => ({ text, id: text.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-') }));
}
