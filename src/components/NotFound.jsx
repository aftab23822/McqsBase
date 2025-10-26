"use client";

import React from 'react';

const NotFound = () => (
  <div className="min-h-screen bg-gradient-to-br from-red-50 to-gray-100 py-8">
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
          <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h1 className="text-6xl font-bold text-red-600 mb-4">404</h1>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Page Not Found</h2>
        <p className="text-lg text-gray-600 max-w-md mx-auto">
          Oops! The page you're looking for doesn't exist. It might have been moved or deleted.
        </p>
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="space-y-6">
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-blue-800 font-medium mb-1">What you can do:</p>
                <ul className="text-blue-700 text-sm space-y-1 text-left">
                  <li>• Check the URL for any typos</li>
                  <li>• Use the navigation menu to find what you're looking for</li>
                  <li>• Go back to the homepage and start over</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/" 
              className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Go to Homepage
            </a>
            <button 
              onClick={() => window.history.back()} 
              className="inline-flex items-center justify-center gap-2 bg-gray-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-gray-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Go Back
            </button>
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="text-center mt-8">
        <p className="text-sm text-gray-500">
          If you believe this is an error, please contact our support team.
        </p>
      </div>
    </div>
  </div>
);

export default NotFound; 