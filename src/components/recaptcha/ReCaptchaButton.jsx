"use client";

import React, { useState } from 'react';
import { useReCaptcha } from './ReCaptchaProvider';

const ReCaptchaButton = ({ 
  children, 
  onSubmit, 
  disabled = false, 
  className = '', 
  loadingText = 'Verifying...',
  action = 'submit',
  ...props 
}) => {
  const { isReady, executeRecaptcha } = useReCaptcha();
  const [isVerifying, setIsVerifying] = useState(false);

  const handleClick = async (e) => {
    e.preventDefault();
    
    if (disabled || isVerifying || !isReady) {
      return;
    }

    setIsVerifying(true);

    try {
      // Execute reCAPTCHA
      const token = await executeRecaptcha(action);
      
      // Call the original onSubmit with the token
      await onSubmit(token);
    } catch (error) {
      console.error('reCAPTCHA verification failed:', error);
      // You can show an error message here if needed
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <button
      {...props}
      onClick={handleClick}
      disabled={disabled || isVerifying || !isReady}
      className={`${className} ${isVerifying ? 'opacity-75 cursor-not-allowed' : ''}`}
    >
      {isVerifying ? (
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
          {loadingText}
        </div>
      ) : (
        children
      )}
    </button>
  );
};

export default ReCaptchaButton; 