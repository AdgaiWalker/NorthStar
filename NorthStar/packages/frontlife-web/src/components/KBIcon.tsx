import {
  Utensils,
  GraduationCap,
  ClipboardList,
  Monitor,
  Printer,
  Package,
  Guitar,
  MessageCircle,
  type LucideProps,
} from 'lucide-react';
import type { KnowledgeBase } from '@/types';

const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  Utensils,
  GraduationCap,
  ClipboardList,
  Monitor,
  Printer,
  Package,
  Guitar,
  MessageCircle,
};

const COLOR_MAP: Record<string, string> = {
  Utensils: 'bg-sage-light text-sage',
  GraduationCap: 'bg-amber-light text-amber-custom',
  ClipboardList: 'bg-rose-light text-rose-custom',
  Monitor: 'bg-blue-light text-blue-custom',
  Printer: 'bg-bg-subtle text-ink-muted',
  Package: 'bg-sage-light text-sage',
  Guitar: 'bg-amber-light text-amber-custom',
  MessageCircle: 'bg-blue-light text-blue-custom',
};

interface KBIconProps {
  iconName: KnowledgeBase['iconName'];
  size?: number;
  withBg?: boolean;
}

export default function KBIcon({ iconName, size = 24, withBg = false }: KBIconProps) {
  const Icon = ICON_MAP[iconName] ?? MessageCircle;
  const color = COLOR_MAP[iconName] ?? 'bg-bg-subtle text-ink-muted';

  if (withBg) {
    return (
      <div className={`flex items-center justify-center rounded-xl ${color}`} style={{ width: size * 2, height: size * 2 }}>
        <Icon size={size} />
      </div>
    );
  }

  return <Icon size={size} className={color.split(' ')[1]} />;
}
