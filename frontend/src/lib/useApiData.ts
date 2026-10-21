import { useState, useEffect, useCallback } from 'react';
import { api } from './api';

export function useApiData<T>(fetcher: () => Promise<T>, deps: any[] = []): [T | null, boolean, () => void] {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    fetcher()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, deps);

  useEffect(() => {
    load();
    const unsubscribe = api.subscribe(() => {
      load();
    });
    return () => unsubscribe();
  }, [load]);

  return [data, loading, load];
}
