"use client";

import { useEffect, useState } from 'react';

const DEFAULT_PAGE = 1;

function parsePageFromSearch(search, fallback) {
  try {
    const params = new URLSearchParams(search || '');
    const raw = params.get('page');
    if (!raw) return fallback;
    const parsed = parseInt(raw, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

/**
 * Reads the current `page` query parameter from `window.location.search`.
 * Keeps the value in sync when the user navigates backwards/forwards.
 */
export function usePageFromUrl(defaultValue = DEFAULT_PAGE) {
  const isBrowser = typeof window !== 'undefined';

  const [page, setPage] = useState(() => {
    if (!isBrowser) {
      return defaultValue;
    }
    return parsePageFromSearch(window.location.search, defaultValue);
  });

  useEffect(() => {
    if (!isBrowser) {
      return () => {};
    }

    const syncFromLocation = () => {
      setPage(parsePageFromSearch(window.location.search, defaultValue));
    };

    syncFromLocation();
    window.addEventListener('popstate', syncFromLocation);

    return () => {
      window.removeEventListener('popstate', syncFromLocation);
    };
  }, [defaultValue, isBrowser]);

  return page;
}
