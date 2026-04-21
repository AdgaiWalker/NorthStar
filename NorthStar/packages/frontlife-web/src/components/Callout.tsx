import { Info, AlertTriangle, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CalloutType = 'note' | 'warning' | 'tip';

interface CalloutProps {
  type: CalloutType;
  children: React.ReactNode;
}

const ICONS: Record<CalloutType, React.ReactNode> = {
  note: <Info size={16} />,
  warning: <AlertTriangle size={16} />,
  tip: <Lightbulb size={16} />,
};

const STYLES: Record<CalloutType, string> = {
  note: 'border-blue-custom bg-blue-light text-blue-custom',
  warning: 'border-amber-custom bg-amber-light text-amber-custom',
  tip: 'border-sage bg-sage-light text-sage',
};

export default function Callout({ type, children }: CalloutProps) {
  return (
    <div
      className={cn(
        'my-4 rounded-lg border px-4 py-3.5',
        STYLES[type]
      )}
    >
      <div className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold"
      >
        {ICONS[type]}
        <span className="capitalize">
          {type === 'note' && '提示'}
          {type === 'warning' && '注意'}
          {type === 'tip' && '技巧'}
        </span>
      </div>
      <div className="text-[14px] leading-relaxed text-ink-secondary"
      >
        {children}
      </div>
    </div>
  );
}

export function extractCalloutFromBlockquote(
  children: React.ReactNode
): { type: CalloutType; content: React.ReactNode } | null {
  const text = extractText(children);
  const match = text.match(/^\s*\[!(note|warning|tip)\]\s*(.*)$/s);
  if (!match) return null;

  const type = match[1] as CalloutType;
  const contentText = match[2].trim();

  // Return plain text content; if multiline, preserve line breaks
  const lines = contentText.split('\n').filter((l) => l.trim());
  const content: React.ReactNode =
    lines.length > 1 ? (
      lines.map((line, i) => (
        <p key={i} className="mb-1 last:mb-0">{line.trim()}</p>
      ))
    ) : (
      contentText
    );

  return { type, content };
}

function extractText(node: React.ReactNode): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (node && typeof node === 'object' && 'props' in node) {
    return extractText((node as { props: { children?: React.ReactNode } }).props.children);
  }
  return '';
}
