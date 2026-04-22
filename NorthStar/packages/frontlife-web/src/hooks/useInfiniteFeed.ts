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
  const fetchingRef = useRef(false);
  const pageRef = useRef(1);
  const hasMoreRef = useRef(true);

  const loadMore = useCallback(async () => {
    if (fetchingRef.current || !hasMoreRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    try {
      const result = await fetchData(pageRef.current);
      setItems((prev) => [...prev, ...result.items]);
      hasMoreRef.current = result.hasMore;
      setHasMore(result.hasMore);
      pageRef.current += 1;
      setPage((p) => p + 1);
    } finally {
      fetchingRef.current = false;
      setLoading(false);
      setInitialLoading(false);
    }
  }, [fetchData]);

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
