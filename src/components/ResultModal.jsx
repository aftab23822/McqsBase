"use client";

import React from 'react';

const ResultModal = ({ score, total, reason, onRetry, onNext }) => {
  const percent = ((score / total) * 100).toFixed(2);
  const reasonMap = {
    timeout: 'Time is up! ⏰',
    manual: 'You moved to another page.',
    completed: 'You answered all the questions. ✅',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold text-center mb-2">Quiz Results</h2>
        <p className="text-center text-gray-600 mb-4">{reasonMap[reason]}</p>

        <div className="text-center mb-4">
          <p className="text-lg font-semibold text-green-700">Score: {score} / {total}</p>
          <p className="text-md text-blue-600 font-medium">Percentage: {percent}%</p>
        </div>

        <div className="flex justify-center gap-4 mt-6">
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            Retry
          </button>
          <button
            onClick={onNext}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Next Page
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultModal;
