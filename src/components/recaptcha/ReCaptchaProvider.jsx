"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

const ReCaptchaContext = createContext();

export const useReCaptcha = () => {
  const context = useContext(ReCaptchaContext);
  if (!context) {
    throw new Error('useReCaptcha must be used within a ReCaptchaProvider');
  }
  return context;
};

export const ReCaptchaProvider = ({ children, siteKey }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Check if reCAPTCHA is already loaded
    if (window.grecaptcha) {
      setIsLoaded(true);
      setIsReady(true);
      return;
    }

    // Load reCAPTCHA script
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      setIsLoaded(true);
      // Wait for grecaptcha to be ready
      const checkReady = () => {
        if (window.grecaptcha && window.grecaptcha.ready) {
          window.grecaptcha.ready(() => {
            setIsReady(true);
          });
        } else {
          setTimeout(checkReady, 100);
        }
      };
      checkReady();
    };

    script.onerror = () => {
      console.error('Failed to load reCAPTCHA script');
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup script if component unmounts
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [siteKey]);

  const executeRecaptcha = async (action = 'submit') => {
    if (!isReady || !window.grecaptcha) {
      throw new Error('reCAPTCHA not ready');
    }

    try {
      const token = await window.grecaptcha.execute(siteKey, { action });
      return token;
    } catch (error) {
      console.error('reCAPTCHA execution failed:', error);
      throw new Error('reCAPTCHA verification failed');
    }
  };

  const value = {
    isLoaded,
    isReady,
    executeRecaptcha,
  };

  const resolveEnvironment = () => {
    if (typeof window === 'undefined') {
      return (
        process.env.VERCEL_ENV ||
        process.env.NODE_ENV ||
        'production'
      );
    }

    return (
      process.env.VERCEL_ENV ||
      process.env.NODE_ENV ||
      'production'
    );
  };

  const environment = resolveEnvironment();

  return (
    <ReCaptchaContext.Provider value={value}>
      {children}
      {environment !== 'production' && (
        <div
          style={{
            position: 'fixed',
            bottom: '10px',
            right: '10px',
            background: isReady ? '#10B981' : '#F59E0B',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '500',
            zIndex: 9999,
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease',
          }}
        >
          🛡️ reCAPTCHA: {isReady ? 'Ready' : 'Loading...'}
        </div>
      )}
    </ReCaptchaContext.Provider>
  );
}; 