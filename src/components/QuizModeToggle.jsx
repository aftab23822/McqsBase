"use client";

import React, { useState, useEffect } from 'react';
import { Play, BookOpen } from 'lucide-react';

const QuizModeToggle = ({ isEnabled, onToggle }) => {
  const [isOn, setIsOn] = useState(isEnabled || false);

  useEffect(() => {
    setIsOn(isEnabled);
  }, [isEnabled]);

  const handleToggle = () => {
    const newState = !isOn;
    setIsOn(newState);
    onToggle(newState);
  };

  return (
    <div className="flex items-center gap-3 bg-white rounded-lg shadow-md p-3 border border-gray-200">
      <div className="flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">Quiz Mode</span>
      </div>
      <button
        onClick={handleToggle}
        className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
          isOn ? 'bg-gradient-to-r from-purple-500 to-indigo-600' : 'bg-gray-300'
        }`}
        role="switch"
        aria-checked={isOn}
        aria-label="Toggle Quiz Mode"
      >
        <span
          className={`inline-flex items-center justify-center h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
            isOn ? 'translate-x-8' : 'translate-x-1'
          }`}
        >
          {isOn && (
            <Play className="w-3 h-3 text-purple-600" fill="currentColor" />
          )}
        </span>
      </button>
      {isOn && (
        <div className="flex items-center gap-1 text-xs text-purple-600 font-semibold animate-pulse">
          <Play className="w-4 h-4" />
          <span>Active</span>
        </div>
      )}
    </div>
  );
};

export default QuizModeToggle;

