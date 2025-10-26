// src/hooks/usePrompt.js - Next.js compatible version
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function usePrompt(when, onNavigateAttempt) {
  const router = useRouter();

  useEffect(() => {
    if (!when) return;

    const handleBeforeUnload = (e) => {
      if (when) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    const handleRouteChange = () => {
      if (when) {
        const shouldProceed = window.confirm(
          'You have unsaved changes. Are you sure you want to leave?'
        );
        if (shouldProceed && onNavigateAttempt) {
          onNavigateAttempt(() => {
            // Proceed with navigation
          });
        }
        return shouldProceed;
      }
      return true;
    };

    // Handle browser refresh/close
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Note: Next.js router events for navigation blocking would need more complex setup
    // For now, we'll rely on beforeunload for browser navigation

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [when, onNavigateAttempt, router]);
}