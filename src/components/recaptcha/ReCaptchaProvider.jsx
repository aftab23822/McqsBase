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

  return (
    <ReCaptchaContext.Provider value={value}>
      {children}
      {/* Debug indicator - remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div 
          style={{
            position: 'fixed',
            bottom: '10px',
            right: '10px',
            background: isReady ? '#10B981' : '#F59E0B',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            zIndex: 9999,
            opacity: 0.8
          }}
        >
          reCAPTCHA: {isReady ? 'Ready' : 'Loading...'}
        </div>
      )}
    </ReCaptchaContext.Provider>
  );
}; 