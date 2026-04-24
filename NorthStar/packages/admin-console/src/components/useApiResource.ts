import { useCallback, useEffect, useState } from "react";

export function useApiResource<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);

    void load()
      .then((nextData) => {
        setData(nextData);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "请求失败，请稍后重试");
        setData(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [load]);

  useEffect(() => {
    let active = true;

    void load()
      .then((nextData) => {
        if (!active) return;
        setData(nextData);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "请求失败，请稍后重试");
        setData(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [load]);

  return { data, error, loading, refresh };
}
