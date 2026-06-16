"use client";

import { useEffect } from 'react';

export default function useRobotsNoindex(shouldNoindex) {
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    const selector = 'meta[name="robots"][data-managed-by="mcqsbase"]';
    let tag = document.head.querySelector(selector);

    if (shouldNoindex) {
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', 'robots');
        tag.setAttribute('data-managed-by', 'mcqsbase');
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', 'noindex,follow');
    } else if (tag) {
      tag.remove();
    }

    return () => {
      const current = document.head.querySelector(selector);
      if (current) current.remove();
    };
  }, [shouldNoindex]);
}
