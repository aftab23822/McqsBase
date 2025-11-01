"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import QuizRightSideBar from '../QuizRightSideBar';
import QuizMcqCard from '../QuizMcqCard';
import Pagination from '../Pagination';
import ResultModal from '../ResultModal';
import LeavePageModal from '../LeavePageModal';

const BaseQuiz = ({ quizData, title, currentPage, setCurrentPage, totalPages, quizPerPage, ...rest }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [userAnswers, setUserAnswers] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [pageScore, setPageScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(300);
  const [timerStarted, setTimerStarted] = useState(false);
  const [endReason, setEndReason] = useState('');
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const timerRef = useRef(null);
  const [quizSessionId, setQuizSessionId] = useState(Date.now());

  // Store handlers in refs so they can be accessed by confirmLeavePage
  const handlersRef = useRef({ handleClick: null, handleBeforeUnload: null });

  // Intercept navigation attempts when quiz is active
  useEffect(() => {
    const shouldBlockNavigation = () => {
      // Block if timer has started (quiz is active)
      return timerStarted && Object.keys(userAnswers).length > 0 && !showModal;
    };

    const handleClick = (e) => {
      if (!shouldBlockNavigation()) return;

      // Find the nearest link element
      let target = e.target;
      while (target && target.tagName !== 'A') {
        target = target.parentElement;
      }

      if (target && target.hasAttribute('href') && target.getAttribute('href').startsWith('/')) {
        e.preventDefault();
        e.stopPropagation();
        
        const href = target.getAttribute('href');
        setPendingNavigation(href);
        setShowLeaveModal(true);
      }
    };

    const handleBeforeUnload = (e) => {
      if (shouldBlockNavigation()) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    handlersRef.current = { handleClick, handleBeforeUnload };

    window.addEventListener('click', handleClick, true);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('click', handleClick, true);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [timerStarted, userAnswers, showModal]);
  
  const confirmLeavePage = () => {
    setShowLeaveModal(false);
    resetPage();
    
    if (pendingNavigation) {
      // Temporarily remove the listener to allow navigation
      if (handlersRef.current.handleClick && handlersRef.current.handleBeforeUnload) {
        window.removeEventListener('click', handlersRef.current.handleClick, true);
        window.removeEventListener('beforeunload', handlersRef.current.handleBeforeUnload);
      }
      
      // Small delay to ensure listeners are removed
      setTimeout(() => {
        window.location.href = pendingNavigation;
      }, 100);
    }
  };

  const cancelLeavePage = () => {
    setPendingNavigation(null);
    setShowLeaveModal(false);
  };

  const startTimer = () => {
    if (!timerStarted) {
      setTimerStarted(true);
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleFinishPage(userAnswers, 'timeout');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const resetPage = () => {
    clearInterval(timerRef.current);
    setUserAnswers({});
    setPageScore(0);
    setTimeLeft(300);
    setTimerStarted(false);
    setEndReason('');
  };

  const handleAnswer = (question, selected, correct) => {
    if (!timerStarted) startTimer();

    setUserAnswers(prev => {
      const updated = { ...prev, [question]: { selected, correct } };
      if (Object.keys(updated).length === quizData.length) {
        clearInterval(timerRef.current);
        handleFinishPage(updated, 'completed');
      }

      return updated;
    });
  };

  const handleFinishPage = (answers = userAnswers, reason = 'manual') => {
    let score = 0;
    Object.values(answers).forEach(ans => {
      if (ans.selected === ans.correct) score++;
    });
    setPageScore(score);
    setEndReason(reason);
    setShowModal(true);
  };

  const handleRetry = () => {
    resetPage();
    setShowModal(false);
    setQuizSessionId(Date.now());
  };

  const handleNext = () => {
    if (!showModal && Object.keys(userAnswers).length > 0) {
      clearInterval(timerRef.current);
      handleFinishPage(userAnswers, 'manual');
    } else {
      resetPage();
      setShowModal(false);
      const nextPage = Math.min(currentPage + 1, totalPages);
      setCurrentPage(nextPage);
      updateUrl(nextPage);
    }
  };

  // Sync URL with page changes on mount and when URL changes
  useEffect(() => {
    const pageParam = searchParams.get('page');
    const pageNum = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1;
    
    // Only update if URL page differs from current page state and is valid
    if (pageNum !== currentPage && pageNum >= 1) {
      // Only sync if totalPages is loaded (greater than 0) and pageNum is within range
      if (totalPages > 0 && pageNum > totalPages) {
        return; // Invalid page, don't update
      }
      setCurrentPage(pageNum);
    }
  }, [searchParams, totalPages, currentPage, setCurrentPage]);

  // Update URL when page changes
  const updateUrl = (page) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page === 1) {
      params.delete('page');
    } else {
      params.set('page', page.toString());
    }
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.push(newUrl, { scroll: false });
  };

  const handlePageChange = (page) => {
    if (page === currentPage) return;
    if (!showModal && Object.keys(userAnswers).length > 0) {
      clearInterval(timerRef.current);
      handleFinishPage(userAnswers, 'manual');
    } else {
      resetPage();
      setCurrentPage(page);
      updateUrl(page);
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  return (
    <section className="full-screen px-4 py-8 bg-gray-100">
      <div className="max-w-screen-xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-2">
        <div className="col-span-2 p-62rounded-lg space-y-6">
          <div className="p-1 sm:p-6 md:p-10 space-y-6 pb-20">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-center sm:text-left gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                {title} (Page {currentPage})
              </h1>
              <div className="text-red-600 font-semibold text-sm sm:text-base sm:text-right sm:self-end">
                Time Left: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
              </div>
            </div>
            {quizData.map((mcq, index) => (
              <QuizMcqCard
                key={`${quizSessionId}-${currentPage}-${index}`}
                questionNumber={(currentPage - 1) * quizPerPage + index + 1}
                correctAnswer={mcq.answer}
                {...mcq}
                onAnswer={handleAnswer}
                disabled={showModal}
                userAnswers={userAnswers}
              />
            ))}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              disableNavigation={showModal}
            />
            {showModal && (
              <ResultModal
                score={pageScore}
                total={quizData.length}
                reason={endReason}
                onRetry={handleRetry}
                onNext={handleNext}
              />
            )}
            {showLeaveModal && (
              <LeavePageModal
                onCancel={cancelLeavePage}
                onConfirm={confirmLeavePage}
              />
            )}
          </div>
        </div>
        {/* Right Sidebar - now scrolls with content */}
        <div className="h-fit top-20">
          <QuizRightSideBar />
        </div>
      </div>
    </section>
  );
};

export default BaseQuiz;
