import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { Sparkles, Send, BookOpen, ChevronDown } from 'lucide-react';
import { KNOWLEDGE_BASES } from '@/data/mock';
import { cn } from '@/lib/utils';
import { generateWritingReply, type WritingStep } from '@/services/AIService';

const GREETING =
  '你好！我是你的写作助手。你想分享什么内容？随便说，我来帮你整理成一篇文章。';

export default function WritePage() {
  const navigate = useNavigate();
  const [selectedKb, setSelectedKb] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ role: 'ai' | 'user'; text: string }[]>([]);
  const [writingSteps, setWritingSteps] = useState<WritingStep[]>([]);
  const [input, setInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [preview, setPreview] = useState('');

  // Auto-start conversation on mount
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{ role: 'ai', text: GREETING }]);
      setWritingSteps([{ role: 'ai', content: GREETING }]);
    }
  }, []);

  const sendMsg = async () => {
    if (!input.trim() || aiLoading) return;
    const userText = input.trim();
    setInput('');
    setAiError('');

    const newMessages = [...messages, { role: 'user' as const, text: userText }];
    setMessages(newMessages);

    const newSteps: WritingStep[] = [
      ...writingSteps,
      { role: 'user' as const, content: userText },
    ];
    setWritingSteps(newSteps);

    setAiLoading(true);
    try {
      const reply = await generateWritingReply(newSteps);
      setMessages((prev) => [...prev, { role: 'ai', text: reply }]);
      setWritingSteps((prev) => [...prev, { role: 'ai', content: reply }]);
      // Auto-update preview with the latest AI response if it looks like article content
      if (reply.includes('## ') || reply.includes('# ')) {
        setPreview(reply);
      }
    } catch (e) {
      setAiError(e instanceof Error ? e.message : 'AI 服务暂时不可用');
    } finally {
      setAiLoading(false);
    }
  };

  const handlePublish = () => {
    if (!preview.trim()) {
      alert('请先和 AI 对话生成文章内容');
      return;
    }
    alert('文章已发布！');
    navigate('/');
  };

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-5">
      {/* Header + KB Selector */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-ink">写文章</h1>

        <div className="relative">
          <select
            value={selectedKb ?? ''}
            onChange={(e) => setSelectedKb(e.target.value || null)}
            className="h-10 appearance-none rounded-lg border border-border bg-white pl-9 pr-8 text-sm text-ink outline-none focus:border-sage"
          >
            <option value="">选择知识库</option>
            {Object.values(KNOWLEDGE_BASES).map((kb) => (
              <option key={kb.id} value={kb.id}>
                {kb.name}
              </option>
            ))}
          </select>
          <BookOpen
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
          />
          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted"
          />
        </div>
      </div>

      {/* Two columns */}
      <div className="flex flex-col gap-4 lg:flex-row" style={{ minHeight: '60vh' }}>
        {/* Left: AI Chat */}
        <div className="flex w-full flex-col rounded-lg border border-border-light bg-surface lg:w-[400px]">
          <div className="flex items-center gap-1.5 border-b border-border-light px-4 py-3 text-xs font-medium text-sage">
            <Sparkles size={13} />
            AI 写作助手
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <div key={i} className="mb-3.5">
                <div
                  className={cn(
                    'rounded-lg px-3.5 py-2.5 text-[13px] leading-relaxed',
                    m.role === 'ai'
                      ? 'border-l-[3px] border-sage bg-bg-subtle text-ink'
                      : 'bg-sage-light text-right font-medium text-sage-dark'
                  )}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {aiLoading && (
              <div className="flex items-center gap-2 py-2 text-xs text-ink-muted">
                <Sparkles size={13} className="animate-pulse text-sage" />
                AI 正在思考...
              </div>
            )}
            {aiError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                {aiError}
                <button
                  onClick={() => sendMsg()}
                  className="ml-2 font-medium underline hover:text-red-700"
                >
                  重试
                </button>
              </div>
            )}
          </div>

          <div className="border-t border-border-light p-3">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMsg()}
                placeholder="描述你想分享的内容..."
                disabled={aiLoading}
                className="h-10 flex-1 rounded-lg border border-border bg-white px-3 text-[13px] outline-none focus:border-sage disabled:opacity-50"
              />
              <button
                onClick={sendMsg}
                disabled={aiLoading || !input.trim()}
                className="flex h-10 items-center rounded-lg bg-sage px-4 text-[13px] font-medium text-white transition-colors hover:bg-sage-dark disabled:opacity-50"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Preview */}
        <div className="min-w-0 flex-1 rounded-lg border border-border-light bg-surface">
          <div className="flex items-center justify-between border-b border-border-light px-5 py-3">
            <span className="text-xs font-medium text-ink-muted">实时预览</span>
            {preview && (
              <span className="text-[11px] text-sage">已生成文章</span>
            )}
          </div>
          <div className="markdown-body p-6 text-[15px] leading-[1.8] text-ink">
            {preview ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw, rehypeSanitize]}
              >
                {preview}
              </ReactMarkdown>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-ink-muted">
                <Sparkles size={32} className="mb-3 opacity-30" />
                <p className="text-sm">和 AI 对话，文章内容会在这里实时预览</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Publish bar */}
      <div className="mt-5 flex items-center justify-end gap-3">
        <button
          onClick={() => navigate(-1)}
          className="rounded-lg border border-border bg-white px-5 py-2.5 text-sm transition-colors hover:bg-bg-subtle"
        >
          取消
        </button>
        <button
          onClick={handlePublish}
          disabled={!preview.trim()}
          className={cn(
            'rounded-lg px-7 py-2.5 text-sm font-medium text-white transition-colors',
            preview.trim()
              ? 'bg-sage hover:bg-sage-dark'
              : 'cursor-not-allowed bg-ink-faint'
          )}
        >
          发布文章
        </button>
      </div>
    </div>
  );
}
