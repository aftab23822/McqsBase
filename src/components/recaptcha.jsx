"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import Script from 'next/script';

const ReCaptchaContext = createContext();

// Default placeholder value for unconfigured reCAPTCHA keys
const PLACEHOLDER_SITE_KEY = 'your-recaptcha-site-key';

export const ReCaptchaProvider = ({ children, siteKey }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);

  // Validate siteKey
  const isValidKey = siteKey && siteKey !== PLACEHOLDER_SITE_KEY;

  useEffect(() => {
    // Add callback function to window for reCAPTCHA
    if (typeof window !== 'undefined') {
      window.recaptchaCallback = () => {
        setIsLoaded(true);
      };
    }
  }, []);

  // Don't render reCAPTCHA if no valid key is provided
  if (!isValidKey) {
    console.warn('reCAPTCHA site key not configured. Please set NEXT_PUBLIC_RECAPTCHA_SITE_KEY in your environment variables.');
    return (
      <ReCaptchaContext.Provider value={{ siteKey: null, isLoaded: false, loadError: 'Site key not configured' }}>
        {children}
        {/* No indicator shown when reCAPTCHA is not configured */}
      </ReCaptchaContext.Provider>
    );
  }

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Check if reCAPTCHA is already available (e.g., on navigation after initial load)
    const checkExisting = () => {
      if (typeof window !== 'undefined' && window.grecaptcha) {
        setIsReady(true);
      }
    };

    // Check if already loaded
    checkExisting();

    // Also handle the case when it loads via the Script component
    if (isLoaded) {
      const checkReady = () => {
        if (typeof window !== 'undefined' && window.grecaptcha && window.grecaptcha.ready) {
          window.grecaptcha.ready(() => {
            setIsReady(true);
          });
        }
      };
      checkReady();
    }
  }, [isLoaded]);

  return (
    <ReCaptchaContext.Provider value={{ siteKey, isLoaded, loadError }}>
      <Script
        src={`https://www.google.com/recaptcha/api.js?render=${siteKey}&onload=recaptchaCallback`}
        strategy="afterInteractive"
        onError={() => setLoadError('Failed to load reCAPTCHA')}
        onLoad={() => setIsLoaded(true)}
      />
      {children}
      {/* reCAPTCHA Status Indicator */}
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
          transition: 'all 0.3s ease'
        }}
      >
        🛡️ reCAPTCHA: {isReady ? 'Ready' : 'Loading...'}
      </div>
    </ReCaptchaContext.Provider>
  );
};

export const useReCaptcha = () => {
  const context = useContext(ReCaptchaContext);
  if (!context) {
    throw new Error('useReCaptcha must be used within a ReCaptchaProvider');
  }
  return context;
};

export const ReCaptchaButton = ({ 
  onSubmit, 
  disabled, 
  className, 
  loadingText, 
  action, 
  children 
}) => {
  const { siteKey } = useReCaptcha();
  const [isLoading, setIsLoading] = useState(false);
  
  // Check if reCAPTCHA is available
  const isRecaptchaAvailable = typeof window !== 'undefined' && window.grecaptcha;
  
  const handleClick = async () => {
    if (!siteKey) {
      console.error('reCAPTCHA site key not configured');
      alert('reCAPTCHA is not configured. Please contact the administrator.');
      return;
    }

    if (!isRecaptchaAvailable) {
      console.error('reCAPTCHA not available');
      alert('reCAPTCHA is not loaded yet. Please wait a moment and try again.');
      return;
    }

    setIsLoading(true);
    try {
      // Execute reCAPTCHA v3
      const token = await new Promise((resolve, reject) => {
        if (!window.grecaptcha) {
          reject(new Error('reCAPTCHA not loaded'));
          return;
        }
        
        window.grecaptcha.ready(() => {
          window.grecaptcha.execute(siteKey, { action })
            .then(resolve)
            .catch(reject);
        });
      });
      
      await onSubmit(token);
    } catch (error) {
      console.error('ReCAPTCHA error:', error);
      alert('reCAPTCHA verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isLoading || !siteKey}
      className={className}
    >
      {isLoading ? loadingText : children}
    </button>
  );
};
