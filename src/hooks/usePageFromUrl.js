"use client";

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';

const DEFAULT_PAGE = 1;

/**
 * Reads the current `page` query parameter from the URL.
 * Consumers should wrap usage in a <Suspense> boundary when rendered from a Server Component.
 */
export function usePageFromUrl(defaultValue = DEFAULT_PAGE) {
  const searchParams = useSearchParams();

  return useMemo(() => {
    const raw = searchParams.get('page');
    if (!raw) return defaultValue;

    const parsed = parseInt(raw, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
    return defaultValue;
  }, [searchParams, defaultValue]);
}
