"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import PastPaperMcqCard from '../PastPaperMcqCard';
import QuizMcqCard from '../QuizMcqCard';
import QuizModeToggle from '../QuizModeToggle';
import ResultModal from '../ResultModal';
import LeavePageModal from '../LeavePageModal';
import PastPapersRightSideBar from '../PastPapersRightSideBar';
import Pagination from '../Pagination';
import Breadcrumb from '../Breadcrumb';
import { generateQuestionSlug } from '../../../lib/utils/slugGenerator.js';

const normalizeAnswer = (value = '') =>
  value
    .replace(/^[A-Z][.、)] ?/i, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const BasePastPaper = ({ pastpaperData, title, currentPage, setCurrentPage, totalPages, mcqsPerPage, breadcrumbItems, categoryPath }) =>  {
  const router = useRouter();
  const pathname = usePathname();
  
  // Quiz mode state
  const [quizMode, setQuizMode] = useState(false);
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
  const handlersRef = useRef({ handleClick: null, handleBeforeUnload: null });

  // Load quiz mode preference from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pastPapersQuizMode');
      if (saved === 'true') {
        setQuizMode(true);
      }
    }
  }, []);

  // Save quiz mode preference to localStorage
  const handleQuizModeToggle = (enabled) => {
    // If turning off Quiz Mode and there are attempted answers, show confirmation
    if (!enabled && Object.keys(userAnswers).length > 0) {
      setPendingNavigation('toggle-off');
      setShowLeaveModal(true);
      return;
    }
    
    setQuizMode(enabled);
    if (typeof window !== 'undefined') {
      localStorage.setItem('pastPapersQuizMode', enabled.toString());
    }
    if (!enabled) {
      resetQuiz();
    }
  };

  // Quiz mode functions
  const startTimer = () => {
    if (!timerStarted && quizMode) {
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

  const resetQuiz = () => {
    clearInterval(timerRef.current);
    setUserAnswers({});
    setPageScore(0);
    setTimeLeft(300);
    setTimerStarted(false);
    setEndReason('');
    setShowModal(false);
  };

  const handleAnswer = (question, selected, correct) => {
    if (!timerStarted) startTimer();

    setUserAnswers(prev => {
      const updated = {
        ...prev,
        [question]: {
          selected,
          correct,
          isCorrect: normalizeAnswer(selected) === normalizeAnswer(correct)
        }
      };
      if (Object.keys(updated).length === pastpaperData.length) {
        clearInterval(timerRef.current);
        handleFinishPage(updated, 'completed');
      }

      return updated;
    });
  };

  const handleFinishPage = (answers = userAnswers, reason = 'manual') => {
    let score = 0;
    Object.values(answers).forEach(ans => {
      if (ans?.isCorrect === true) {
        score += 1;
      } else if (ans?.selected && ans?.correct) {
        if (normalizeAnswer(ans.selected) === normalizeAnswer(ans.correct)) {
          score += 1;
        }
      }
    });
    setPageScore(score);
    setEndReason(reason);
    setShowModal(true);
  };

  const handleRetry = () => {
    resetQuiz();
    setQuizSessionId(Date.now());
  };

  const handleNext = () => {
    if (!showModal && Object.keys(userAnswers).length > 0) {
      clearInterval(timerRef.current);
      handleFinishPage(userAnswers, 'manual');
    } else {
      resetQuiz();
      setShowModal(false);
      const nextPage = Math.min(currentPage + 1, totalPages);
      setCurrentPage(nextPage);
      handlePageChange(nextPage);
    }
  };

  // Intercept navigation attempts when quiz is active
  useEffect(() => {
    if (!quizMode) return;

    const shouldBlockNavigation = () => {
      return timerStarted && Object.keys(userAnswers).length > 0 && !showModal;
    };

    const handleClick = (e) => {
      if (!shouldBlockNavigation()) return;

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
  }, [quizMode, timerStarted, userAnswers, showModal]);

  const confirmLeavePage = () => {
    setShowLeaveModal(false);
    
    // If this is a Quiz Mode toggle, turn off Quiz Mode
    if (pendingNavigation === 'toggle-off') {
      resetQuiz();
      setQuizMode(false);
      if (typeof window !== 'undefined') {
        localStorage.setItem('pastPapersQuizMode', 'false');
      }
      setPendingNavigation(null);
      return;
    }
    
    resetQuiz();
    
    if (pendingNavigation) {
      if (handlersRef.current.handleClick && handlersRef.current.handleBeforeUnload) {
        window.removeEventListener('click', handlersRef.current.handleClick, true);
        window.removeEventListener('beforeunload', handlersRef.current.handleBeforeUnload);
      }
      
      setTimeout(() => {
        window.location.href = pendingNavigation;
      }, 100);
    }
  };

  const cancelLeavePage = () => {
    setPendingNavigation(null);
    setShowLeaveModal(false);
  };

  // Reset quiz when page changes
  useEffect(() => {
    if (quizMode) {
      resetQuiz();
      setQuizSessionId(Date.now());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, quizMode]);

  // Update URL when page changes
  const handlePageChange = (page) => {
    if (page === currentPage) return;
    
    if (quizMode && !showModal && Object.keys(userAnswers).length > 0) {
      clearInterval(timerRef.current);
      handleFinishPage(userAnswers, 'manual');
    } else {
      setCurrentPage(page);
      // Update URL with page query parameter
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search || '');
        if (page === 1) {
          params.delete('page');
        } else {
          params.set('page', page.toString());
        }
        // Remove trailing slash before adding query parameters
        // Use window.location.pathname to get the actual current pathname
        const currentPathname = window.location.pathname || pathname;
        const cleanPathname = currentPathname.replace(/\/$/, '');
        const queryString = params.toString();
        const newUrl = queryString ? `${cleanPathname}?${queryString}` : pathname;
        // Use window.history.pushState to avoid Next.js adding trailing slash back
        window.history.pushState({}, '', newUrl);
      }
    }
  };

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, [currentPage]);

  return (
    <section className="full-screen px-4 py-8 bg-gray-100">
      <div className="max-w-screen-xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-2">
        {/* Left Column */}
        <div className="col-span-2 space-y-6">
          <div className="p-1 sm:p-6 md:p-10 space-y-6 pb-20">
            {/* Breadcrumb Navigation */}
            {breadcrumbItems && <Breadcrumb items={breadcrumbItems} />}
            {title && (
              <h1 className="text-2xl font-bold text-center text-gray-800 mb-4">
                {title} (Page {currentPage})
              </h1>
            )}
            <div className="flex flex-row items-center justify-center gap-3 mb-4 w-full">
              <QuizModeToggle isEnabled={quizMode} onToggle={handleQuizModeToggle} />
              {quizMode && (
                <div className="text-red-600 font-semibold text-sm sm:text-base">
                  Time Left: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                </div>
              )}
            </div>
            {pastpaperData.map((mcq, index) => {
              // Generate question URL for SEO - similar to MCQs
              const questionSlug = mcq.slug || generateQuestionSlug(mcq.question);
              const questionUrl = categoryPath 
                ? `/past-papers/${categoryPath}/question/${questionSlug}`
                : '#';
              
              // Store page number and category path when clicking question link
              const handleQuestionClick = () => {
                if (categoryPath && typeof window !== 'undefined') {
                  sessionStorage.setItem('pastPapersReturnPage', currentPage.toString());
                  sessionStorage.setItem('pastPapersReturnCategory', categoryPath);
                }
              };
              
              if (quizMode) {
                return (
                  <QuizMcqCard
                    key={`${quizSessionId}-${currentPage}-${index}`}
                    questionNumber={(currentPage - 1) * mcqsPerPage + index + 1}
                    correctAnswer={mcq.answer}
                    {...mcq}
                    onAnswer={handleAnswer}
                    disabled={showModal}
                    userAnswers={userAnswers}
                  />
                );
              }
              
              return (
                <div key={mcq._id?.toString() || index} className="group">
                  <Link 
                    href={questionUrl}
                    className="block hover:opacity-95 transition-opacity"
                    onClick={!categoryPath ? (e) => {
                      e.preventDefault();
                      console.error('Cannot generate question URL: categoryPath is missing!', {
                        categoryPath,
                        mcqId: mcq._id
                      });
                    } : handleQuestionClick}
                  >
                    <PastPaperMcqCard
                      questionNumber={(currentPage - 1) * mcqsPerPage + index + 1}
                      correctAnswer={mcq.answer}
                      {...mcq}
                    />
                  </Link>
                  <div className="mt-2 text-center">
                    <Link
                      href={questionUrl}
                      className="inline-block text-sm text-blue-600 hover:text-blue-800 font-medium"
                      onClick={handleQuestionClick}
                    >
                      View Full Question →
                    </Link>
                  </div>
                </div>
              );
            })}
            {/* Pagination Component */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              disableNavigation={showModal}
            />
            {showModal && (
              <ResultModal
                score={pageScore}
                total={pastpaperData.length}
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
        <div className="col-span-1 h-fit top-20">
          <PastPapersRightSideBar />
        </div>
      </div>
    </section>
  );
};

export default BasePastPaper;
