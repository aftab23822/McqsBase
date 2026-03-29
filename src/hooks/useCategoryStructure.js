'use client';

import { useState, useEffect } from 'react';

/**
 * Fetch merged category structure from GET /api/categories/structure
 */
export function useCategoryStructure(type) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/categories/structure?type=${encodeURIComponent(type)}`);
        const json = await res.json();
        if (cancelled) return;
        if (json.success) {
          setData(json.data);
        } else {
          setError(json.error || 'Failed to load category structure');
        }
      } catch (e) {
        if (!cancelled) setError(e.message || 'Network error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [type]);

  return { data, loading, error };
}
