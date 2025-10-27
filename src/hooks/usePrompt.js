// src/hooks/usePrompt.js - Next.js compatible version with custom modal
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function usePrompt(when, onNavigateAttempt) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);

  useEffect(() => {
    if (!when) return;

    const handleBeforeUnload = (e) => {
      if (when) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    // Handle browser refresh/close
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [when]);

  const showConfirmation = (targetUrl) => {
    if (when) {
      setPendingNavigation(targetUrl);
      setShowConfirm(true);
      return false;
    }
    return true;
  };

  const handleStay = () => {
    setShowConfirm(false);
    setPendingNavigation(null);
  };

  const handleLeave = () => {
    setShowConfirm(false);
    if (pendingNavigation) {
      if (onNavigateAttempt) {
        onNavigateAttempt(() => {
          router.push(pendingNavigation);
        });
      } else {
        router.push(pendingNavigation);
      }
    }
    setPendingNavigation(null);
  };

  const ConfirmModal = () => {
    if (!showConfirm) return null;

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
              onClick={handleStay}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Stay
            </button>
            <button
              onClick={handleLeave}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Leave Anyway
            </button>
          </div>
        </div>
      </div>
    );
  };

  return { showConfirmation, ConfirmModal };
}