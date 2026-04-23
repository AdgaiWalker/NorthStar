import { useState, useEffect, useRef, useCallback } from 'react';

interface UseInfiniteFeedOptions<T> {
  fetchData: (page: number) => Promise<{ items: T[]; hasMore: boolean }>;
  pageSize?: number;
}

export function useInfiniteFeed<T>(options: UseInfiniteFeedOptions<T>) {
  const { fetchData } = options;
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const fetchingRef = useRef(false);
  const pageRef = useRef(1);
  const hasMoreRef = useRef(true);

  const loadMore = useCallback(async () => {
    if (fetchingRef.current || !hasMoreRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    setError('');
    try {
      const result = await fetchData(pageRef.current);
      setItems((prev) => [...prev, ...result.items]);
      hasMoreRef.current = result.hasMore;
      setHasMore(result.hasMore);
      pageRef.current += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : '内容加载失败，请稍后重试。';
      setError(message);
      hasMoreRef.current = false;
      setHasMore(false);
    } finally {
      fetchingRef.current = false;
      setLoading(false);
      setInitialLoading(false);
    }
  }, [fetchData]);

  useEffect(() => {
    loadMore();
  }, [loadMore]);

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

  const retry = useCallback(() => {
    pageRef.current = 1;
    hasMoreRef.current = true;
    setItems([]);
    setHasMore(true);
    setInitialLoading(true);
    setError('');
    void loadMore();
  }, [loadMore]);

  return { items, loading, initialLoading, hasMore, error, retry, loaderRef };
}
