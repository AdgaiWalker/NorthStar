import { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  TrendingUp,
  Clock,
  Calendar,
  Search,
} from 'lucide-react';
import { useInfiniteFeed } from '@/hooks/useInfiniteFeed';
import { FEED } from '@/data/mock';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import SmartCard from '@/components/SmartCard';
import FeedSkeleton, { FeedSkeletonList } from '@/components/FeedSkeleton';
import type { FeedItem } from '@/types';

const PAGE_SIZE = 5;

function generateContextCards(): {
  title: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
  action: () => string;
}[] {
  const hour = new Date().getHours();
  const cards: {
    title: string;
    desc: string;
    icon: React.ReactNode;
    color: string;
    action: () => string;
  }[] = [];

  cards.push({
    title: '校园美食地图',
    desc: '二食堂麻辣烫窗口搬迁了，空间更大',
    icon: <TrendingUp size={14} />,
    color: 'bg-sage-light text-sage',
    action: () => '/kb/food',
  });

  if (hour >= 10 && hour <= 13) {
    cards.push({
      title: '三食堂新窗口',
      desc: '今天新开了烤冷面，8块钱一大份',
      icon: <Sparkles size={14} />,
      color: 'bg-amber-light text-amber-custom',
      action: () => '/kb/food',
    });
  }

  if (hour >= 18 && hour <= 22) {
    cards.push({
      title: '图书馆自习',
      desc: '主馆到 22:00，三楼自习室到 23:00',
      icon: <Clock size={14} />,
      color: 'bg-blue-light text-blue-custom',
      action: () => '/kb/freeboard',
    });
  }

  if (hour >= 8 && hour <= 18) {
    cards.push({
      title: '选课避雷',
      desc: '大学生心理健康课推荐，平时分高',
      icon: <Calendar size={14} />,
      color: 'bg-rose-light text-rose-custom',
      action: () => '/kb/academic',
    });
  }

  if (hour > 9) {
    cards.push({
      title: '二手好物',
      desc: '考研资料 50 块打包，电风扇 20 块',
      icon: <TrendingUp size={14} />,
      color: 'bg-sage-light text-sage',
      action: () => '/kb/secondhand',
    });
  }

  return cards.slice(0, 4);
}

export default function HomePage() {
  const navigate = useNavigate();
  const setShowSearch = useAppStore((s) => s.setShowSearch);
  const contextCards = useMemo(() => generateContextCards(), []);

  const sortedFeed = useMemo(() => {
    return [...FEED].sort((a, b) => b.lastActivityAt - a.lastActivityAt);
  }, []);

  const fetchData = useCallback(
    async (page: number) => {
      const start = (page - 1) * PAGE_SIZE;
      const end = start + PAGE_SIZE;
      const items = sortedFeed.slice(start, end);
      return { items, hasMore: end < sortedFeed.length };
    },
    [sortedFeed]
  );

  const { items, initialLoading, loading, hasMore, loaderRef } =
    useInfiniteFeed<FeedItem>({ fetchData });

  return (
    <div className="mx-auto max-w-content-max px-4 pb-32 md:px-5">
      {/* 搜索框 */}
      <div className="pt-6 pb-4 md:pt-10 md:pb-6">
        <div
          className="flex h-14 cursor-pointer items-center gap-3 rounded-2xl border border-border-light bg-bg-subtle px-5 transition-all hover:border-ink-faint hover:shadow-sm"
          onClick={() => setShowSearch(true)}
        >
          <Search size={18} className="text-ink-faint" />
          <span className="text-[15px] text-ink-faint">
            想知道什么？
          </span>
        </div>
      </div>

      {/* Context Cards */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {contextCards.map((card, i) => (
          <button
            key={i}
            onClick={() => navigate(card.action())}
            className="flex flex-col rounded-2xl border border-border-light bg-surface p-4 text-left transition-all hover:shadow-md hover:-translate-y-0.5"
          >
            <div
              className={cn(
                'mb-2 inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
                card.color
              )}
            >
              {card.icon}
              推荐
            </div>
            <div className="text-[15px] font-semibold text-ink">
              {card.title}
            </div>
            <div className="mt-0.5 text-[13px] text-ink-muted line-clamp-2">
              {card.desc}
            </div>
          </button>
        ))}
      </div>

      {/* Stream Header */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-ink-secondary">
          最近
        </h2>
      </div>

      {/* Life Stream */}
      <div className="md:mx-auto md:max-w-reader-max">
        {initialLoading && <FeedSkeletonList count={3} />}

        {!initialLoading &&
          items.map((item, i) => (
            <div
              key={`${item.type}-${i}`}
              className="animate-in fade-in slide-in-from-bottom-3 fill-mode-backwards duration-500"
              style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
            >
              <SmartCard item={item} index={i} />
            </div>
          ))}

        {loading && !initialLoading && <FeedSkeleton />}

        {!initialLoading && !hasMore && items.length > 0 && (
          <div className="py-8 text-center text-xs text-ink-faint">
            已经到底了
          </div>
        )}

        <div ref={loaderRef} className="h-4" />
      </div>
    </div>
  );
}
