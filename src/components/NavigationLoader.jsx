"use client";

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Global navigation loader component
 * Shows a loading overlay when navigating between pages while keeping current content visible
 */
const NavigationLoader = () => {
  const [isNavigating, setIsNavigating] = useState(false);
  const pathname = usePathname();
  const prevPathnameRef = useRef(pathname);

  useEffect(() => {
    // Listen to all link clicks in the document
    const handleClick = (e) => {
      // Check if the clicked element is a link
      let target = e.target;
      while (target && target.tagName !== 'A') {
        target = target.parentElement;
      }

      if (target && target.hasAttribute('href')) {
        const href = target.getAttribute('href');
        // Only show loader for internal navigation
        if (href.startsWith('/') && !target.hasAttribute('download')) {
          setIsNavigating(true);
        }
      }
    };

    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, []);

  // Detect pathname changes (when navigation completes)
  useEffect(() => {
    // Only hide if pathname actually changed from previous value
    if (prevPathnameRef.current !== pathname) {
      // Small delay to allow new page to render
      const timer = setTimeout(() => {
        setIsNavigating(false);
      }, 100);
      
      prevPathnameRef.current = pathname;
      
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  if (!isNavigating) return null;

  return (
    <div className="fixed inset-0 bg-white bg-opacity-75 z-[9999] flex items-center justify-center transition-opacity duration-300 pointer-events-none">
      <div className="relative w-16 h-16">
        {/* Circular ring spinner - navigation specific */}
        <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
      </div>
    </div>
  );
};

export default NavigationLoader;

