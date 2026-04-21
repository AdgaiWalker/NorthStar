import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  inline?: boolean;
  className?: string;
  children: React.ReactNode;
}

export default function CodeBlock({ inline, className, children }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  if (inline) {
    return (
      <code className="rounded bg-bg-subtle px-1.5 py-0.5 text-[13px] font-medium text-sage-dark">
        {children}
      </code>
    );
  }

  const match = /language-(\w+)/.exec(className || '');
  const lang = match ? match[1] : 'text';
  const code = String(children).replace(/\n$/, '');

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative my-5 overflow-hidden rounded-lg border border-border-light">
      <div className="flex items-center justify-between border-b border-border-light bg-bg-subtle px-4 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
          {lang}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[11px] text-ink-muted transition-colors hover:text-sage"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? '已复制' : '复制'}
        </button>
      </div>
      <SyntaxHighlighter
        language={lang}
        style={oneLight}
        customStyle={{
          margin: 0,
          padding: '1rem 1.25rem',
          fontSize: '13px',
          lineHeight: '1.7',
          background: '#FAFAFA',
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
