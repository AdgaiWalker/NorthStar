import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, BookOpen, CheckCircle, Flag, LoaderCircle, MessageCircle, Sparkles } from 'lucide-react';
import { ErrorState, LoadingState } from '@/components/LoadingState';
import { api, type ArticleSummary, type PostRecord, type SpaceSummary } from '@/services/api';
import { useUserStore } from '@/store/useUserStore';

export default function SpacePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const permissions = useUserStore((state) => state.permissions);
  const userName = useUserStore((state) => state.userName);
  const token = useUserStore((state) => state.token);
  const [space, setSpace] = useState<SpaceSummary | null>(null);
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportPostId, setReportPostId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [message, setMessage] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postTag, setPostTag] = useState('share');
  const [activePost, setActivePost] = useState<PostRecord | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [writingOpen, setWritingOpen] = useState(false);
  const [writingTopic, setWritingTopic] = useState('');
  const [writingReply, setWritingReply] = useState('');
  const [writingDirections, setWritingDirections] = useState<string[]>([]);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [writingLoading, setWritingLoading] = useState(false);
  const [writingError, setWritingError] = useState('');
  const [writingSuccess, setWritingSuccess] = useState('');
  const [publishingArticle, setPublishingArticle] = useState(false);
  const [postSubmitting, setPostSubmitting] = useState(false);
  const [postError, setPostError] = useState('');
  const [replyError, setReplyError] = useState('');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    Promise.all([api.getSpace(id), api.getSpacePosts(id)])
      .then(([spaceResult, postsResult]) => {
        if (cancelled) return;
        setSpace(spaceResult.space);
        setArticles(spaceResult.articles);
        setPosts(postsResult.posts);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : '空间加载失败');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const parentArticles = articles.filter((article) => !article.parentId);
  const childArticles = articles.filter((article) => article.parentId);

  const submitPostReport = async (postId: string) => {
    if (!token) return navigate('/login');
    if (!reportReason.trim()) return;
    await api.reportContent({
      targetType: 'post',
      targetId: postId,
      reason: reportReason.trim(),
    });
    setReportPostId(null);
    setReportReason('');
    setMessage('举报已提交');
  };

  const publishPost = async () => {
    if (!token) return navigate('/login');
    if (!id || !postContent.trim()) return;
    setPostError('');
    setPostSubmitting(true);
    try {
      const result = await api.createPost({
        spaceId: id,
        content: postContent.trim(),
        tags: [postTag],
        authorName: userName ?? '张同学',
      });
      setPosts((current) => [result.post, ...current]);
      setPostContent('');
      setMessage('已发布');
    } catch (err) {
      setPostError(err instanceof Error ? err.message : '发布失败，请稍后重试');
    } finally {
      setPostSubmitting(false);
    }
  };

  const submitReply = async () => {
    if (!token) return navigate('/login');
    if (!activePost || !replyContent.trim()) return;
    setReplyError('');
    try {
      const result = await api.replyToPost(activePost.id, replyContent.trim());
      const updatedPost: PostRecord = {
        ...activePost,
        replies: [result.reply, ...(activePost.replies ?? [])],
        replyCount: activePost.replyCount + 1,
      };
      setActivePost(updatedPost);
      setPosts((current) => current.map((post) => (post.id === updatedPost.id ? updatedPost : post)));
      setReplyContent('');
    } catch (err) {
      setReplyError(err instanceof Error ? err.message : '回复失败，请稍后重试');
    }
  };

  const solvePost = async (post: PostRecord) => {
    if (!token) return navigate('/login');
    const result = await api.markPostSolved(post.id);
    const updatedPost = { ...post, solved: result.post.solved ?? true };
    setPosts((current) => current.map((item) => (item.id === post.id ? updatedPost : item)));
    if (activePost?.id === post.id) setActivePost(updatedPost);
  };

  const generateDraft = async () => {
    if (!token) return navigate('/login');
    if (!space || !writingTopic.trim()) return;
    setWritingError('');
    setWritingSuccess('');
    setWritingLoading(true);
    try {
      const result = await api.generateArticleDraft({
        topic: writingTopic.trim(),
        spaceTitle: space.title,
      });
      setWritingReply(result.reply);
      setWritingDirections(result.directions);
      setDraftTitle(result.draft.title);
      setDraftContent(result.draft.content);
    } catch (err) {
      setWritingError(err instanceof Error ? err.message : '草稿生成失败，请稍后重试');
    } finally {
      setWritingLoading(false);
    }
  };

  const publishArticle = async () => {
    if (!token) return navigate('/login');
    if (!space || !draftTitle.trim() || !draftContent.trim()) return;
    setWritingError('');
    setWritingSuccess('');
    setPublishingArticle(true);
    try {
      const result = await api.createArticle({
        spaceId: space.id,
        title: draftTitle.trim(),
        content: draftContent.trim(),
        authorName: userName ?? '张同学',
      });
      setArticles((current) => [result.article, ...current]);
      setWritingOpen(false);
      setWritingTopic('');
      setWritingReply('');
      setWritingDirections([]);
      setDraftTitle('');
      setDraftContent('');
      setWritingSuccess('文章已发布，已回到当前空间知识区。');
      setMessage('文章已发布');
    } catch (err) {
      setWritingError(err instanceof Error ? err.message : '文章发布失败，请检查内容后重试');
    } finally {
      setPublishingArticle(false);
    }
  };

  return (
    <div className="mx-auto max-w-content-max overflow-x-hidden px-4 py-6 sm:px-5 sm:py-8">
      {loading && <LoadingState label="正在加载空间..." />}
      {!loading && error && <ErrorState message={error} />}
      {!loading && !error && space && (
        <div className="lg:grid lg:grid-cols-[210px_minmax(0,1fr)_190px] lg:gap-4 xl:grid-cols-[230px_minmax(0,1fr)_220px] xl:gap-5">
          <aside className="sticky top-[72px] hidden max-h-[calc(100vh-88px)] overflow-y-auto rounded-2xl border border-border-light bg-bg-subtle p-4 lg:block">
            <div className="mb-3 text-xs font-semibold tracking-wider text-ink-muted">文章树</div>
            <div className="space-y-2">
              {parentArticles.map((article) => {
                const children = childArticles.filter((item) => item.parentId === article.id);
                return (
                  <div key={article.id}>
                    <Link to={`/article/${article.id}`} className="block rounded-lg px-3 py-2 text-sm leading-5 text-ink-secondary hover:bg-white hover:text-sage">
                      {article.title}
                    </Link>
                    {children.length > 0 && (
                      <div className="ml-3 mt-1 space-y-1 border-l border-sage-light pl-2">
                        {children.map((child) => (
                          <Link key={child.id} to={`/article/${child.id}`} className="block rounded-md px-2 py-1.5 text-xs text-ink-muted hover:bg-white hover:text-sage">
                            {child.title}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>

          <main className="min-w-0">
          <header className="rounded-2xl border border-border-light bg-surface p-5 sm:p-6">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-sage-light text-sage">
              <BookOpen size={20} />
            </div>
            <h1 className="break-words font-display text-[28px] font-bold leading-tight text-ink">{space.title}</h1>
            <p className="mt-2 text-sm leading-7 text-ink-muted">{space.description}</p>
            <div className="mt-4 flex flex-wrap gap-3 text-xs text-ink-faint">
              <span>{space.articleCount} 篇文章</span>
              <span>{space.helpfulCount} 人确认</span>
              <span>{space.maintainer.name} 维护</span>
            </div>
          </header>

          <section id="knowledge" className="mt-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-[15px] font-semibold text-ink-secondary">知识体系</h2>
              {token && permissions.canWrite && (
                <button onClick={() => setWritingOpen((value) => !value)} className="rounded-lg bg-sage px-3 py-1.5 text-xs font-medium text-white">
                  AI 写文章
                </button>
              )}
            </div>
            {writingSuccess && !writingOpen && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-sage-light bg-sage-light px-4 py-3 text-sm text-sage-dark">
                <CheckCircle size={16} className="shrink-0" />
                {writingSuccess}
              </div>
            )}
            {writingOpen && (
              <div className="mb-4 rounded-2xl border border-border-light bg-surface p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-ink-secondary">
                  <Sparkles size={16} className="text-sage" />
                  AI 对话式写作
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-ink-muted sm:grid-cols-4">
                  {['主题', '方向', '草稿', '发布'].map((step, index) => (
                    <div
                      key={step}
                      className={[
                        'rounded-lg border px-3 py-2',
                        index === 0 || writingDirections.length > 0
                          ? 'border-sage-light bg-sage-light text-sage-dark'
                          : 'border-border-light bg-bg-subtle',
                      ].join(' ')}
                    >
                      {step}
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input
                    value={writingTopic}
                    onChange={(event) => setWritingTopic(event.target.value)}
                    placeholder="例如：三食堂烤冷面窗口测评"
                    className="h-10 min-w-0 flex-1 rounded-lg border border-border px-3 text-sm outline-none focus:border-sage"
                  />
                  <button
                    onClick={generateDraft}
                    disabled={writingLoading || !writingTopic.trim()}
                    className="inline-flex h-10 items-center justify-center rounded-lg bg-sage px-4 text-sm font-medium text-white disabled:bg-ink-faint"
                  >
                    {writingLoading && <LoaderCircle size={15} className="mr-1.5 animate-spin" />}
                    生成草稿
                  </button>
                </div>
                {writingError && (
                  <div className="mt-3 flex gap-2 rounded-xl bg-rose-light p-3 text-sm leading-6 text-rose-custom">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                    {writingError}
                  </div>
                )}
                {writingReply && <div className="mt-3 rounded-xl bg-sage-light p-3 text-sm leading-6 text-sage-dark">{writingReply}</div>}
                {writingDirections.length > 0 && (
                  <div className="mt-3 rounded-xl border border-border-light bg-bg-subtle p-3">
                    <div className="mb-2 text-xs font-semibold text-ink-secondary">建议方向</div>
                    <div className="space-y-2">
                      {writingDirections.map((direction) => (
                        <div key={direction} className="flex gap-2 text-sm leading-6 text-ink-secondary">
                          <CheckCircle size={15} className="mt-1 shrink-0 text-sage" />
                          <span className="min-w-0 break-words">{direction}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {draftContent && (
                  <div className="mt-3 space-y-2">
                    <input
                      value={draftTitle}
                      onChange={(event) => setDraftTitle(event.target.value)}
                      className="h-10 w-full rounded-lg border border-border px-3 text-sm font-semibold outline-none focus:border-sage"
                    />
                    <textarea
                      value={draftContent}
                      onChange={(event) => setDraftContent(event.target.value)}
                      className="h-56 w-full resize-none rounded-lg border border-border px-3 py-2 text-sm leading-6 outline-none focus:border-sage"
                    />
                    <button
                      onClick={publishArticle}
                      disabled={publishingArticle || !draftTitle.trim() || !draftContent.trim()}
                      className="inline-flex w-full items-center justify-center rounded-lg bg-sage px-4 py-2 text-sm font-medium text-white disabled:bg-ink-faint sm:w-auto"
                    >
                      {publishingArticle && <LoaderCircle size={15} className="mr-1.5 animate-spin" />}
                      发布文章
                    </button>
                  </div>
                )}
              </div>
            )}
            <div className="space-y-3">
              {parentArticles.map((article) => {
                const children = childArticles.filter((item) => item.parentId === article.id);
                return (
                <div
                  key={article.id}
                  className="rounded-2xl border border-border-light bg-surface p-5 transition-all hover:border-sage hover:shadow-sm"
                >
                  <Link to={`/article/${article.id}`} className="block">
                    <div className="break-words font-display text-[18px] font-bold leading-6 text-ink">{article.title}</div>
                  </Link>
                  <p className="mt-2 break-words text-sm leading-6 text-ink-muted md:line-clamp-2">{article.summary}</p>
                  <div className="mt-3 text-xs text-ink-faint">{article.helpfulCount} 人确认有帮助</div>
                  {children.length > 0 && (
                    <div className="mt-4 space-y-2 border-l-2 border-sage-light pl-3">
                      {children.map((child) => (
                        <Link key={child.id} to={`/article/${child.id}`} className="block rounded-lg bg-bg-subtle px-3 py-2 text-sm text-ink-secondary">
                          {child.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
              })}
            </div>
          </section>

          <section id="updates" className="mt-7">
            <h2 className="mb-3 text-[15px] font-semibold text-ink-secondary">最新动态</h2>
            {token && permissions.canPost && (
              <div className="mb-4 rounded-2xl border border-border-light bg-surface p-4">
                <textarea
                  value={postContent}
                  onChange={(event) => setPostContent(event.target.value)}
                  placeholder="在这里说点什么..."
                  className="h-20 w-full resize-none rounded-xl border border-border bg-bg-subtle px-3 py-2 text-sm outline-none focus:border-sage"
                />
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <select
                    value={postTag}
                    onChange={(event) => setPostTag(event.target.value)}
                    className="h-10 min-w-0 rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-sage"
                  >
                    <option value="share">#分享</option>
                    <option value="help">#求助</option>
                    <option value="secondhand">#二手</option>
                    <option value="event">#活动</option>
                    <option value="discussion">#讨论</option>
                  </select>
                  <button
                    onClick={publishPost}
                    disabled={postSubmitting || !postContent.trim()}
                    className="inline-flex h-10 items-center justify-center rounded-lg bg-sage px-4 text-sm font-medium text-white disabled:bg-ink-faint"
                  >
                    {postSubmitting && <LoaderCircle size={15} className="mr-1.5 animate-spin" />}
                    发布
                  </button>
                </div>
                {postError && <div className="mt-2 text-sm text-rose-custom">{postError}</div>}
              </div>
            )}
            <div className="space-y-3">
              {posts.map((post) => (
                <div key={post.id} className="rounded-2xl border border-border-light bg-surface p-4">
                  <div className="mb-2 flex items-center justify-between gap-2 text-xs text-ink-muted">
                    <span className="flex items-center gap-2">
                      <MessageCircle size={14} className="text-sage" />
                      {post.author.name}
                    </span>
                    <button onClick={() => (token ? setReportPostId(post.id) : navigate('/login'))} className="text-ink-faint hover:text-rose-custom">
                      <Flag size={13} className="mr-1 inline" />
                      举报
                    </button>
                  </div>
                  <button onClick={() => setActivePost(post)} className="block w-full break-words text-left text-[15px] leading-7 text-ink">
                    {post.content}
                  </button>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-faint">
                    {post.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-bg-subtle px-2 py-0.5">
                        #{tag === 'help' ? '求助' : tag === 'secondhand' ? '二手' : tag === 'event' ? '活动' : tag === 'discussion' ? '讨论' : '分享'}
                      </span>
                    ))}
                    <span>{post.replyCount} 条回复</span>
                    {post.solved && <span className="text-sage">已解决</span>}
                    {token && post.tags.includes('help') && !post.solved && (
                      <button onClick={() => solvePost(post)} className="text-sage">
                        标记解决了
                      </button>
                    )}
                  </div>
                  {reportPostId === post.id && (
                    <div className="mt-3 rounded-xl border border-border-light bg-bg-subtle p-3">
                      <input
                        value={reportReason}
                        onChange={(event) => setReportReason(event.target.value)}
                        placeholder="请说明举报原因"
                        className="h-9 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-sage"
                      />
                      <button onClick={() => submitPostReport(post.id)} className="mt-2 rounded-lg bg-sage px-3 py-1.5 text-xs font-medium text-white">
                        提交举报
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {message && <div className="mt-3 text-sm text-sage">{message}</div>}
          </section>
          </main>

          <aside className="sticky top-[72px] hidden h-fit rounded-2xl border border-border-light bg-surface p-4 lg:block">
            <div className="mb-3 text-xs font-semibold tracking-wider text-ink-muted">目录</div>
            <a href="#knowledge" className="block rounded-lg px-3 py-2 text-sm text-ink-secondary hover:bg-bg-subtle hover:text-sage">知识体系</a>
            <a href="#updates" className="block rounded-lg px-3 py-2 text-sm text-ink-secondary hover:bg-bg-subtle hover:text-sage">最新动态</a>
          </aside>
        </div>
      )}
      {activePost && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/30 px-4" onClick={() => setActivePost(null)}>
          <div className="max-h-[82vh] w-full max-w-[560px] overflow-y-auto rounded-2xl bg-white p-4 shadow-lg sm:p-5" onClick={(event) => event.stopPropagation()}>
            <div className="mb-2 text-xs text-ink-muted">{activePost.author.name}</div>
            <p className="break-words text-[17px] font-medium leading-8 text-ink">{activePost.content}</p>
            <div className="mt-5 border-t border-border-light pt-4">
              {token && activePost.tags.includes('help') && !activePost.solved && (
                <button onClick={() => solvePost(activePost)} className="mb-3 rounded-lg bg-sage-light px-3 py-1.5 text-xs font-medium text-sage">
                  标记解决了
                </button>
              )}
              <div className="mb-3 text-sm font-semibold text-ink-secondary">回复</div>
              <div className="space-y-3">
                {(activePost.replies ?? []).map((reply) => (
                  <div key={reply.id} className="rounded-xl bg-bg-subtle p-3">
                    <div className="text-xs text-ink-muted">{reply.author.name}</div>
                    <div className="mt-1 break-words text-sm leading-6 text-ink">{reply.content}</div>
                    <div className="mt-1 text-xs text-ink-faint">{reply.starCount} 星标</div>
                  </div>
                ))}
              </div>
              {replyError && <div className="mt-3 text-sm text-rose-custom">{replyError}</div>}
              {token ? <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <input
                  value={replyContent}
                  onChange={(event) => setReplyContent(event.target.value)}
                  placeholder="写回复..."
                  className="h-10 min-w-0 flex-1 rounded-lg border border-border px-3 text-sm outline-none focus:border-sage"
                />
                <button onClick={submitReply} className="rounded-lg bg-sage px-4 text-sm font-medium text-white">
                  回复
                </button>
              </div> : (
                <button onClick={() => navigate('/login')} className="mt-4 rounded-lg bg-sage px-4 py-2 text-sm font-medium text-white">
                  登录后回复
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
