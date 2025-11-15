"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import McqCard from '../McqCard';
import QuizMcqCard from '../QuizMcqCard';
import QuizModeToggle from '../QuizModeToggle';
import ResultModal from '../ResultModal';
import LeavePageModal from '../LeavePageModal';
import RightSideBar from '../RightSideBar';
import Pagination from '../Pagination';
import Breadcrumb from '../Breadcrumb';
import { generateQuestionSlug } from '../../../lib/utils/slugGenerator.js';
import { usePageFromUrl } from '../../hooks/usePageFromUrl';

const normalizeAnswer = (value = '') =>
  value
    .replace(/^[A-Z][.、)] ?/i, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const BaseMcqs = ({ mcqsData, title, currentPage, setCurrentPage, totalPages, mcqsPerPage, subjectSlug }) => {
  const router = useRouter();
  const pathname = usePathname();
  const prevPageRef = useRef(currentPage);
  const pageFromUrl = usePageFromUrl();

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
      const saved = localStorage.getItem('mcqsQuizMode');
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
      localStorage.setItem('mcqsQuizMode', enabled.toString());
    }
    if (!enabled) {
      resetQuiz();
    }
  };

  // Extract subject slug from pathname if not provided as prop (fallback)
  // First try prop, then pathname, with better extraction
  let extractedSlug = '';
  if (pathname && pathname.startsWith('/mcqs/')) {
    const parts = pathname.replace('/mcqs/', '').split('/');
    extractedSlug = parts[0].split('?')[0];
  }
  const finalSubjectSlug = subjectSlug || extractedSlug || '';
  
  // Debug: Log if slug is empty (remove in production)
  if (!finalSubjectSlug && process.env.NODE_ENV === 'development') {
    console.warn('BaseMcqs: subjectSlug is empty!', { subjectSlug, pathname, extractedSlug });
  }

  // Sync URL with page changes on mount and when URL changes
  useEffect(() => {
    const pageNum = Number.isFinite(pageFromUrl) && pageFromUrl > 0 ? pageFromUrl : 1;
    const maxPage = totalPages > 0 ? totalPages : pageNum;
    const nextPage = Math.min(pageNum, maxPage);

    setCurrentPage((prev) => (prev === nextPage ? prev : nextPage));
  }, [pageFromUrl, totalPages, setCurrentPage]);

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
      if (Object.keys(updated).length === mcqsData.length) {
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
        localStorage.setItem('mcqsQuizMode', 'false');
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
      if (typeof window === 'undefined') {
        return;
      }
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
  };

  // Scroll to top when page changes and data is loaded
  useEffect(() => {
    // Only scroll if page actually changed and we have data
    if (prevPageRef.current !== currentPage && mcqsData && mcqsData.length > 0) {
      prevPageRef.current = currentPage;
      // Use double requestAnimationFrame to ensure DOM is fully updated before scrolling
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.scrollTo(0, 0);
        });
      });
    } else {
      // Update ref to current page for tracking
      prevPageRef.current = currentPage;
    }
  }, [currentPage, mcqsData]);

  // Generate breadcrumb items - extract subject name from title
  const getSubjectName = () => {
    if (!title) return 'Subject';
    // Remove " MCQs" suffix and any trailing whitespace
    return title.replace(/\s*MCQs\s*$/i, '').trim() || 'Subject';
  };

  const humanizePart = (segment = '') =>
    segment
      .split('-')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'MCQs', href: '/mcqs' },
  ];

  if (finalSubjectSlug) {
    const slugParts = finalSubjectSlug.split('/').filter(Boolean);
    if (slugParts.length >= 1) {
      const subjectPart = slugParts[0];
      const subjectHref = `/mcqs/${subjectPart}`;
      breadcrumbItems.push({
        label: humanizePart(subjectPart),
        href: subjectHref,
      });

      let accumulated = subjectPart;
      for (let i = 1; i < slugParts.length; i += 1) {
        accumulated += `/${slugParts[i]}`;
        breadcrumbItems.push({
          label: humanizePart(slugParts[i]),
          href: `/mcqs/${accumulated}`,
        });
      }
      // Ensure last breadcrumb is marked as current (no link)
      const lastIndex = breadcrumbItems.length - 1;
      breadcrumbItems[lastIndex] = {
        ...breadcrumbItems[lastIndex],
        href: undefined,
      };
    }
  } else {
    breadcrumbItems.push({ label: getSubjectName() });
  }

  return (
    <section className="full-screen px-4 py-8 bg-gray-100">
      <div className="max-w-screen-xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-2">
        {/* Left Column */}
        <div className="col-span-2 p-62rounded-lg space-y-6">
          <div className="p-1 sm:p-6 md:p-10 space-y-6 pb-20">
            {/* Breadcrumb Navigation */}
            <Breadcrumb items={breadcrumbItems} />
            <h1 className="text-2xl font-bold text-center text-gray-800 mb-4">
              {title} (Page {currentPage})
            </h1>
            <div className="flex flex-row items-center justify-center gap-3 mb-4 w-full">
              <QuizModeToggle isEnabled={quizMode} onToggle={handleQuizModeToggle} />
              {quizMode && (
                <div className="text-red-600 font-semibold text-sm sm:text-base">
                  Time Left: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                </div>
              )}
            </div>
            {mcqsData.map((mcq, index) => {
              // Always use stored slug from database for consistency and performance
              // If slug doesn't exist, generate one (will be saved on first access)
              const questionSlug = mcq.slug || generateQuestionSlug(mcq.question);
              // Only generate URL if we have a valid subject slug
              const questionUrl = finalSubjectSlug 
                ? `/mcqs/${finalSubjectSlug}/question/${questionSlug}`
                : '#';
              
              // Store page number and category path when clicking question link
              const handleQuestionClick = () => {
                if (finalSubjectSlug && typeof window !== 'undefined') {
                  sessionStorage.setItem('mcqsReturnPage', currentPage.toString());
                  sessionStorage.setItem('mcqsReturnCategory', finalSubjectSlug);
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
                    onClick={!finalSubjectSlug ? (e) => {
                      e.preventDefault();
                      console.error('Cannot generate question URL: subjectSlug is missing!', {
                        subjectSlug,
                        pathname,
                        extractedSlug,
                        mcqId: mcq._id
                      });
                    } : handleQuestionClick}
                  >
                    <McqCard
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
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              disableNavigation={showModal}
            />
            {showModal && (
              <ResultModal
                score={pageScore}
                total={mcqsData.length}
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
          <RightSideBar />
        </div>
      </div>
    </section>
  );
};

export default BaseMcqs; 