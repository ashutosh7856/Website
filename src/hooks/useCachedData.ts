import { useState, useEffect, useRef, type DependencyList } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useCachedData<T>(
  key: string,
  fetchFn: () => Promise<T>,
  dependencies: DependencyList = []
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      // Check if we have valid cached data
      const cached = cache.get(key);
      const now = Date.now();

      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        // Use cached data
        setData(cached.data as T);
        setIsLoading(false);
        return;
      }

      // Fetch fresh data
      try {
        setIsLoading(true);
        setError(null);
        const result = await fetchFn();
        
        if (isMounted.current) {
          setData(result);
          // Store in cache
          cache.set(key, {
            data: result,
            timestamp: now,
          });
        }
      } catch (err) {
        if (isMounted.current) {
          console.error(err);
          setError('An error occurred while fetching data.');
        }
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    };

    fetchData();
    // Callers pass `dependencies` explicitly; `fetchFn` is usually an inline closure and must not retrigger the fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ...dependencies]);

  const invalidateCache = () => {
    cache.delete(key);
  };

  return { data, isLoading, error, invalidateCache };
}

// Utility function to clear all cache
export function clearAllCache() {
  cache.clear();
}

// Utility function to clear specific cache entry
export function clearCache(key: string) {
  cache.delete(key);
}
