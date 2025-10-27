"use client";

import React from 'react';

const LeavePageModal = ({ onCancel, onConfirm }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Leave Quiz Page?
        </h3>
        <p className="text-gray-600 mb-6">
          You have started answering. If you leave, your current progress and answers will be lost.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Stay
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Leave Anyway
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeavePageModal;
