"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * Hook to get initial page number from URL query params
 * @returns {number} Page number from URL or 1 if not present
 */
export function usePageFromUrl() {
  const searchParams = useSearchParams();
  const pageParam = searchParams.get('page');
  return pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1;
}

