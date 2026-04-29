import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { AlertTriangle, Bookmark, CheckCircle, ExternalLink, FileText, Flag, LoaderCircle, Pencil, ShieldCheck, X } from 'lucide-react';
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
  const [reloadKey, setReloadKey] = useState(0);
  const [helpfulDone, setHelpfulDone] = useState(false);
  const [changeOpen, setChangeOpen] = useState(false);
  const [changeNote, setChangeNote] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [message, setMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [previousArticleId, setPreviousArticleId] = useState<string | null>(null);
  const [nextArticleId, setNextArticleId] = useState<string | null>(null);
  const [spaceArticles, setSpaceArticles] = useState<ArticleSummary[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');
  const headings = article ? extractHeadings(article.content) : [];

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    setActionError('');

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
  }, [id, reloadKey]);

  const markHelpful = async () => {
    if (!token) return navigate('/login');
    if (!article || helpfulDone) return;
    setActionError('');
    try {
      const result = await api.markArticleHelpful(article.id);
      setArticle({ ...article, helpfulCount: result.helpfulCount, confirmedAt: result.confirmedAt });
      setHelpfulDone(true);
      setMessage('已确认有帮助');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '确认失败，请稍后重试。');
    }
  };

  const submitChange = async () => {
    if (!token) return navigate('/login');
    if (!article || !changeNote.trim()) return;
    setActionError('');
    try {
      const result = await api.markArticleChanged(article.id, changeNote.trim());
      setArticle({
        ...article,
        changedCount: result.changedCount,
        changeNotes: [result.feedback, ...article.changeNotes],
      });
      setChangeNote('');
      setChangeOpen(false);
      setMessage('变化反馈已提交');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '变化反馈提交失败，请稍后重试。');
    }
  };

  const submitReport = async () => {
    if (!token) return navigate('/login');
    if (!article || !reportReason.trim()) return;
    setActionError('');
    try {
      await api.reportContent({
        targetType: 'article',
        targetId: article.id,
        reason: reportReason.trim(),
      });
      setReportReason('');
      setReportOpen(false);
      setMessage('举报已提交');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '举报提交失败，请稍后重试。');
    }
  };

  const favoriteArticle = async () => {
    if (!token) return navigate('/login');
    if (!article) return;
    setActionError('');
    try {
      await api.favorite({ targetType: 'article', targetId: article.id });
      setMessage('已收藏');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '收藏失败，请稍后重试。');
    }
  };

  const resolveChanged = async () => {
    if (!token || !article) return;
    setActionError('');
    try {
      await api.resolveArticleChanged(article.id);
      setArticle({ ...article, changedCount: 0, changeNotes: [] });
      setMessage('已确认内容更新，变化标记已解除');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '解除变化标记失败');
    }
  };

  const startEdit = () => {
    if (!article) return;
    setIsEditing(true);
    setEditTitle(article.title);
    setEditContent(article.content);
    setEditSummary(article.summary || '');
    setEditError('');
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditTitle('');
    setEditContent('');
    setEditSummary('');
    setEditError('');
  };

  const submitEdit = async () => {
    if (!token || !article) return;
    if (!editTitle.trim() || !editContent.trim()) {
      setEditError('标题和内容不能为空');
      return;
    }
    setEditError('');
    setEditSubmitting(true);
    try {
      const result = await api.updateArticle(article.id, {
        title: editTitle.trim(),
        content: editContent.trim(),
        summary: editSummary.trim() || undefined,
      });
      setArticle(result.article);
      cancelEdit();
      setMessage('文章已更新');
    } catch (err) {
      setEditError(err instanceof Error ? err.message : '更新失败，请稍后重试');
    } finally {
      setEditSubmitting(false);
    }
  };

  const userId = useUserStore((state) => state.userId);
  const isAuthor = article && userId && article.author.id === String(userId);

  return (
    <div className="mx-auto max-w-content-max overflow-x-hidden px-4 py-6 sm:px-5 sm:py-8">
      {loading && <LoadingState label="正在加载文章..." />}
      {!loading && error && (
        <ErrorState
          title="文章加载失败"
          message={error}
          onRetry={() => setReloadKey((value) => value + 1)}
          onBack={() => navigate('/')}
          backLabel="返回首页"
        />
      )}
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
              {isAuthor && (
                <button
                  onClick={isEditing ? cancelEdit : startEdit}
                  className="rounded-lg px-2 py-1 text-xs text-ink-faint transition-colors hover:bg-bg-subtle hover:text-sage"
                >
                  {isEditing ? (
                    <>
                      <X size={14} className="mr-1 inline" />
                      取消
                    </>
                  ) : (
                    <>
                      <Pencil size={14} className="mr-1 inline" />
                      编辑
                    </>
                  )}
                </button>
              )}
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

          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-ink-secondary">标题</label>
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-lg border border-border bg-bg-subtle px-3 py-2 text-sm outline-none focus:border-sage"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-ink-secondary">摘要</label>
                <input
                  value={editSummary}
                  onChange={(e) => setEditSummary(e.target.value)}
                  placeholder="文章摘要（可选）"
                  className="w-full rounded-lg border border-border bg-bg-subtle px-3 py-2 text-sm outline-none focus:border-sage"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-ink-secondary">内容（支持 Markdown）</label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={15}
                  className="w-full resize-none rounded-lg border border-border bg-bg-subtle px-3 py-2 text-sm font-mono outline-none focus:border-sage"
                />
              </div>
              {editError && <div className="text-sm text-rose-custom">{editError}</div>}
              <div className="flex gap-2">
                <button
                  onClick={submitEdit}
                  disabled={editSubmitting}
                  className="inline-flex h-10 items-center justify-center rounded-lg bg-sage px-4 text-sm font-medium text-white disabled:bg-ink-faint"
                >
                  {editSubmitting && <LoaderCircle size={15} className="mr-1.5 animate-spin" />}
                  保存更改
                </button>
                <button
                  onClick={cancelEdit}
                  disabled={editSubmitting}
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium text-ink-secondary hover:bg-bg-subtle"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="break-words font-display text-[28px] font-bold leading-tight text-ink sm:text-[30px]">{article.title}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-ink-faint">
            <span className="font-medium text-ink-secondary">{article.author.name}</span>
            {article.author.helpedCount != null && article.author.helpedCount > 0 && (
              <span className="flex items-center gap-1 text-sage">
                <ShieldCheck size={12} />
                累计帮助 {article.author.helpedCount} 人
              </span>
            )}
            <span>{article.helpfulCount} 人确认</span>
            {article.confirmedAt && <span>确认于 {new Date(article.confirmedAt).toLocaleDateString()}</span>}
          </div>

          {article.changedCount > 0 && (
            <div className="mt-5 rounded-xl border border-amber-light bg-amber-light p-4 text-sm leading-6 text-amber-custom">
              <div className="flex items-center justify-between">
                <span>
                  <AlertTriangle size={15} className="mr-1 inline" />
                  {article.changedCount} 人反馈可能有变化
                </span>
                {isAuthor && (
                  <button
                    onClick={resolveChanged}
                    className="rounded-lg bg-amber-custom px-3 py-1 text-xs font-medium text-white transition-colors hover:opacity-90"
                  >
                    已更新，解除标记
                  </button>
                )}
              </div>
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
            {actionError && <div className="mt-3 text-sm text-rose-custom">{actionError}</div>}
          </div>
            </>
          )}

          {!isEditing && (
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
          )}

          {!isEditing && (
          <div className="mt-6 rounded-xl border border-border-light bg-bg-subtle px-4 py-3 text-center">
            <a
              href="https://xyzidea.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-ink-faint transition-colors hover:text-sage"
            >
              AI 还能做什么？看看全球站
              <ExternalLink size={10} />
            </a>
          </div>
          )}
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
