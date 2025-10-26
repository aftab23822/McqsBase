"use client";

import React from 'react';

const LeavePageModal = ({ onCancel, onConfirm }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold text-center mb-2">Leave Quiz Page?</h2>
        <p className="text-center text-gray-600 mb-4">
          You have started answering. If you leave, your current progress and answers will be lost.
        </p>

        <div className="flex justify-center gap-4 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Stay
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Leave Anyway
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeavePageModal;
