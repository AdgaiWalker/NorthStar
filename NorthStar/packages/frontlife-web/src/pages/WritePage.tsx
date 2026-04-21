import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { KNOWLEDGE_BASES } from '@/data/mock';
import { cn } from '@/lib/utils';
import { generateWritingReply, type WritingStep } from '@/services/AIService';

const steps = ['选择知识库', 'AI 对话', '调整结构', '确认发布'];

export default function WritePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selectedKb, setSelectedKb] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ role: 'ai' | 'user'; text: string }[]>([]);
  const [writingSteps, setWritingSteps] = useState<WritingStep[]>([]);
  const [input, setInput] = useState('');
  const [outline, setOutline] = useState<string[]>([]);
  const [preview, setPreview] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  const sendMsg = async () => {
    if (!input.trim() || aiLoading) return;
    const userText = input.trim();
    setInput('');
    setAiError('');

    const newMessages = [...messages, { role: 'user' as const, text: userText }];
    setMessages(newMessages);

    const newSteps: WritingStep[] = [...writingSteps, { role: 'user' as const, content: userText }];
    setWritingSteps(newSteps);

    setAiLoading(true);
    try {
      const reply = await generateWritingReply(newSteps);
      setMessages((prev) => [...prev, { role: 'ai', text: reply }]);
      setWritingSteps((prev) => [...prev, { role: 'ai', content: reply }]);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : 'AI 服务暂时不可用');
    } finally {
      setAiLoading(false);
    }
  };

  const extractOutline = (text: string): string[] => {
    const lines = text.split('\n');
    const headings: string[] = [];
    for (const line of lines) {
      const match = line.match(/^##\s+(.+)$/);
      if (match) headings.push(match[1].trim());
    }
    return headings;
  };

  const renderStep = () => {
    if (step === 0) {
      return (
        <div className="rounded-lg border border-border-light bg-surface p-6"
        >
          <div className="mb-1 text-[15px] font-semibold"
          >选择知识库</div>
          <div className="mb-4 text-[13px] text-ink-muted"
          >文章将归入所选知识库</div>
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3"
          >
            {Object.values(KNOWLEDGE_BASES).map((kb) => (
              <button
                key={kb.id}
                onClick={() => setSelectedKb(kb.id)}
                className={cn(
                  'rounded-lg border p-4 text-center transition-all',
                  selectedKb === kb.id
                    ? 'border-sage bg-sage-light'
                    : 'border-border hover:border-sage hover:bg-sage-light'
                )}
              >
                <div className="mb-1 text-2xl"
                >{kb.icon}</div>
                <div className="text-sm font-medium"
                >{kb.name}</div>
              </button>
            ))}
          </div>
          <div className="mt-5 flex justify-end"
          >
            <button
              disabled={!selectedKb}
              onClick={() => setStep(1)}
              className="rounded bg-sage px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sage-dark disabled:opacity-40"
            >
              下一步
            </button>
          </div>
        </div>
      );
    }

    if (step === 1) {
      return (
        <div>
          <div className="mb-3 max-h-[400px] min-h-[300px] overflow-y-auto rounded-lg border border-border-light bg-surface p-5"
          >
            <div className="mb-3.5"
            >
              <div className="rounded-lg border-l-[3px] border-sage bg-bg-subtle px-4 py-3 text-[14px] leading-relaxed"
              >
                你好！我是你的写作助手。你想分享什么内容？随便说，我来帮你整理。
              </div>
            </div>
            {messages.map((m, i) => (
              <div key={i} className="mb-3.5"
              >
                <div
                  className={cn(
                    'rounded-lg px-4 py-3 text-[14px] leading-relaxed',
                    m.role === 'ai'
                      ? 'border-l-[3px] border-sage bg-bg-subtle'
                      : 'bg-sage-light text-right font-medium text-sage-dark'
                  )}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          {aiLoading && (
            <div className="mb-2 flex items-center gap-2 text-xs text-ink-muted"
            >
              <Sparkles size={13} className="animate-pulse text-sage" />
              AI 正在思考...
            </div>
          )}
          {aiError && (
            <div className="mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600"
            >
              {aiError}
              <button
                onClick={() => sendMsg()}
                className="ml-2 font-medium underline hover:text-red-700"
              >
                重试
              </button>
            </div>
          )}
          <div className="flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMsg()}
              placeholder="描述你想分享的内容..."
              disabled={aiLoading}
              className="h-11 flex-1 rounded-lg border border-border bg-white px-4 text-[14px] outline-none focus:border-sage disabled:opacity-50"
            />
            <button
              onClick={sendMsg}
              disabled={aiLoading}
              className="rounded-lg bg-sage px-5 text-[13px] font-medium text-white transition-colors hover:bg-sage-dark disabled:opacity-50"
            >
              发送
            </button>
          </div>
          <div className="mt-5 flex justify-between"
          >
            <button
              onClick={() => setStep(0)}
              className="rounded-lg border border-border bg-white px-4 py-2 text-sm transition-colors hover:bg-bg-subtle"
            >
              上一步
            </button>
            <button
              onClick={() => {
                const lastAi = [...messages].reverse().find((m) => m.role === 'ai');
                const extracted = lastAi ? extractOutline(lastAi.text) : [];
                setOutline(extracted.length > 0 ? extracted : ['整体介绍', '具体细节', '总结建议']);
                setStep(2);
              }}
              disabled={aiLoading || messages.length === 0}
              className="rounded bg-sage px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sage-dark disabled:opacity-40"
            >
              下一步
            </button>
          </div>
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="rounded-lg border border-border-light bg-surface p-6"
        >
          <div className="mb-5 text-[15px] font-semibold"
          >调整文章结构</div>
          {outline.map((item, i) => (
            <div
              key={i}
              className="mb-2 flex items-center justify-between rounded-lg border border-border-light bg-bg-subtle px-4 py-2.5 text-[14px]"
            >
              <span>
                {i + 1}. {item}
              </span>
              <button
                onClick={() => setOutline(outline.filter((_, idx) => idx !== i))}
                className="text-xs text-ink-faint transition-colors hover:text-ink-muted"
              >
                删除
              </button>
            </div>
          ))}
          <input
            placeholder="添加新章节..."
            className="mt-3 h-9 w-full rounded-lg border border-border bg-white px-3 text-[13px] outline-none focus:border-sage"
            onKeyDown={(e) => {
              const target = e.target as HTMLInputElement;
              if (e.key === 'Enter' && target.value.trim()) {
                setOutline([...outline, target.value]);
                target.value = '';
              }
            }}
          />
          <div className="mt-5 flex justify-between"
          >
            <button
              onClick={() => setStep(1)}
              className="rounded-lg border border-border bg-white px-4 py-2 text-sm transition-colors hover:bg-bg-subtle"
            >
              上一步
            </button>
            <button
              onClick={() => {
                const lastAi = [...messages].reverse().find((m) => m.role === 'ai');
                if (lastAi) {
                  setPreview(lastAi.text);
                } else {
                  setPreview(
                    outline.map((o) => `## ${o}\n\n（待补充内容）`).join('\n\n')
                  );
                }
                setStep(3);
              }}
              className="rounded bg-sage px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sage-dark"
            >
              下一步
            </button>
          </div>
        </div>
      );
    }

    // Step 3: Preview
    return (
      <div>
        <div className="mb-5 rounded-lg border border-border-light bg-surface p-6 text-[15px] leading-relaxed"
        >
          {preview.split('\n\n').map((p, i) => {
            if (p.startsWith('## ')) {
              return (
                <h2 key={i} className="mb-3 mt-5 font-display text-xl font-bold"
                >
                  {p.replace('## ', '')}
                </h2>
              );
            }
            return (
              <p key={i} className="mb-3"
              >
                {p}
              </p>
            );
          })}
        </div>
        <div className="flex items-center justify-between"
        >
          <button
            onClick={() => setStep(2)}
            className="rounded-lg border border-border bg-white px-4 py-2 text-sm transition-colors hover:bg-bg-subtle"
          >
            上一步
          </button>
          <button
            onClick={() => {
              alert('文章已发布！');
              navigate('/');
            }}
            className="rounded bg-sage px-7 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sage-dark"
          >
            ✓ 确认发布
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-[720px] px-4 py-5"
    >
      <div className="mb-6 flex items-center justify-between"
      >
        <h1 className="font-display text-2xl font-bold"
        >写文章</h1>
      </div>

      {/* Steps */}
      <div className="mb-6 flex overflow-hidden rounded-lg border border-border-light"
      >
        {steps.map((s, i) => (
          <div
            key={i}
            className={cn(
              'flex-1 py-2.5 text-center text-xs font-medium transition-all',
              i === step
                ? 'bg-sage-light font-semibold text-sage'
                : i < step
                  ? 'text-sage'
                  : 'text-ink-muted'
            )}
          >
            {s}
          </div>
        ))}
      </div>

      {renderStep()}
    </div>
  );
}
