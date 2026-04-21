import { useState, useEffect, useRef, useCallback } from 'react';

interface UseInfiniteFeedOptions<T> {
  fetchData: (page: number) => Promise<{ items: T[]; hasMore: boolean }>;
  pageSize?: number;
}

export function useInfiniteFeed<T>(options: UseInfiniteFeedOptions<T>) {
  const { fetchData } = options;
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const result = await fetchData(page);
      setItems((prev) => [...prev, ...result.items]);
      setHasMore(result.hasMore);
      setPage((p) => p + 1);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [fetchData, page, loading, hasMore]);

  useEffect(() => {
    loadMore();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  return { items, loading, initialLoading, hasMore, loaderRef };
}
