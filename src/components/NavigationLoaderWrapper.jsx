"use client";

import dynamic from 'next/dynamic';

// Client-side navigation loader wrapper
// Using dynamic import with ssr: false in a Client Component
const NavigationLoaderWrapper = dynamic(() => import('./NavigationLoader'), {
  ssr: false
});

export default NavigationLoaderWrapper;

