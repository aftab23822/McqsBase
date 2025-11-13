"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import QuizRightSideBar from '../QuizRightSideBar';
import QuizMcqCard from '../QuizMcqCard';
import Pagination from '../Pagination';
import ResultModal from '../ResultModal';
import LeavePageModal from '../LeavePageModal';
import Breadcrumb from '../Breadcrumb';
import { usePageFromUrl } from '../../hooks/usePageFromUrl';

const normalizeAnswer = (value = '') =>
  value
    .replace(/^[A-Z][.、)] ?/i, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const BaseQuiz = ({ quizData, title, currentPage, setCurrentPage, totalPages, quizPerPage, subjectSlug }) => {
  const router = useRouter();
  const pathname = usePathname();
  const pageFromUrl = usePageFromUrl();
  let extractedSlug = '';
  if (pathname && pathname.startsWith('/quiz/')) {
    extractedSlug = pathname.replace('/quiz/', '').split('?')[0];
  }
  const finalSubjectSlug = subjectSlug || extractedSlug || '';

  if (!finalSubjectSlug && process.env.NODE_ENV === 'development') {
    console.warn('BaseQuiz: subjectSlug is empty!', { subjectSlug, pathname, extractedSlug });
  }

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
      const updated = {
        ...prev,
        [question]: {
          selected,
          correct,
          isCorrect: normalizeAnswer(selected) === normalizeAnswer(correct)
        }
      };
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
      // Scroll happens in useEffect when quizData updates
      setCurrentPage(nextPage);
      updateUrl(nextPage);
    }
  };

  // Sync URL with page changes on mount and when URL changes
  useEffect(() => {
    const pageNum = Number.isFinite(pageFromUrl) && pageFromUrl > 0 ? pageFromUrl : 1;
    const maxPage = totalPages > 0 ? totalPages : pageNum;
    const nextPage = Math.min(pageNum, maxPage);

    setCurrentPage((prev) => (prev === nextPage ? prev : nextPage));
  }, [pageFromUrl, totalPages, setCurrentPage]);

  // Update URL when page changes
  const updateUrl = (page) => {
    if (typeof window === 'undefined') {
      return;
    }
    const params = new URLSearchParams(window.location.search || '');
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

  // Scroll to top when page changes and data is loaded
  const prevPageRef = useRef(currentPage);
  useEffect(() => {
    // Only scroll if page actually changed and we have data
    if (prevPageRef.current !== currentPage && quizData && quizData.length > 0) {
      prevPageRef.current = currentPage;
      // Use requestAnimationFrame to ensure DOM is updated before scrolling
      requestAnimationFrame(() => {
        window.scrollTo(0, 0);
      });
    } else if (prevPageRef.current === currentPage) {
      // Update ref if page hasn't changed but this is initial load
      prevPageRef.current = currentPage;
    }
  }, [currentPage, quizData]);

  // Generate breadcrumb items - extract subject name from title
  const getSubjectName = () => {
    if (!title) return 'Subject';
    // Remove " Quiz" suffix, "(Page X)" pattern, and any trailing whitespace
    return title
      .replace(/\s*\(Page\s+\d+\)/gi, '') // Remove "(Page X)"
      .replace(/\s*Quiz\s*$/i, '') // Remove " Quiz"
      .trim() || 'Subject';
  };

  const humanizePart = (segment = '') =>
    segment
      .split('-')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Quiz', href: '/quiz' },
  ];

  if (finalSubjectSlug) {
    const slugParts = finalSubjectSlug.split('/').filter(Boolean);
    if (slugParts.length >= 1) {
      const subjectPart = slugParts[0];
      const subjectHref = `/quiz/${subjectPart}`;
      breadcrumbItems.push({
        label: humanizePart(subjectPart),
        href: subjectHref,
      });

      let accumulated = subjectPart;
      for (let i = 1; i < slugParts.length; i += 1) {
        accumulated += `/${slugParts[i]}`;
        breadcrumbItems.push({
          label: humanizePart(slugParts[i]),
          href: `/quiz/${accumulated}`,
        });
      }
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
        <div className="col-span-2 p-62rounded-lg space-y-6">
          <div className="p-1 sm:p-6 md:p-10 space-y-6 pb-20">
            {/* Breadcrumb Navigation */}
            <Breadcrumb items={breadcrumbItems} />
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
