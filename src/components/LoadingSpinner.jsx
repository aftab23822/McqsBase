import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = () => (
  <div className="loading-spinner-container">
    <div className="loading-spinner">
      <div className="loading-spinner-dot"></div>
      <div className="loading-spinner-dot"></div>
      <div className="loading-spinner-dot"></div>
    </div>
  </div>
);

export default LoadingSpinner; 