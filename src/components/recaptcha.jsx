"use client";

import React, { createContext, useContext, useState } from 'react';

const ReCaptchaContext = createContext();

export const ReCaptchaProvider = ({ children, siteKey }) => {
  return (
    <ReCaptchaContext.Provider value={{ siteKey }}>
      {children}
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
  const [isLoading, setIsLoading] = useState(false);
  
  const handleClick = async () => {
    setIsLoading(true);
    try {
      // Simulate reCAPTCHA verification - replace with actual implementation
      const token = 'mock-recaptcha-token';
      await onSubmit(token);
    } catch (error) {
      console.error('ReCAPTCHA error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={className}
    >
      {isLoading ? loadingText : children}
    </button>
  );
};
