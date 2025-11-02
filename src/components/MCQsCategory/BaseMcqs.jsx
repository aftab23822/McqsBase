"use client";

import React, { useEffect, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import McqCard from '../McqCard';
import RightSideBar from '../RightSideBar';
import Pagination from '../Pagination';
import { generateQuestionSlug } from '../../../lib/utils/slugGenerator.js';

const BaseMcqs = ({ mcqsData, title, currentPage, setCurrentPage, totalPages, mcqsPerPage, subjectSlug }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const prevPageRef = useRef(currentPage);

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
  const handlePageChange = (page) => {
    setCurrentPage(page);
    const params = new URLSearchParams(searchParams.toString());
    if (page === 1) {
      params.delete('page');
    } else {
      params.set('page', page.toString());
    }
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.push(newUrl, { scroll: false });
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

  return (
    <section className="full-screen px-4 py-8 bg-gray-100">
      <div className="max-w-screen-xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-2">
        {/* Left Column */}
        <div className="col-span-2 p-62rounded-lg space-y-6">
          <div className="p-1 sm:p-6 md:p-10 space-y-6 pb-20">
            <h1 className="text-2xl font-bold mb-4 text-center text-gray-800">
              {title}
            </h1>
            {mcqsData.map((mcq, index) => {
              // Use stored slug if available, otherwise generate one (backward compatibility)
              const questionSlug = mcq.slug || generateQuestionSlug(mcq.question, mcq._id?.toString() || '');
              // Only generate URL if we have a valid subject slug
              const questionUrl = finalSubjectSlug 
                ? `/mcqs/${finalSubjectSlug}/question/${questionSlug}`
                : '#';
              
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
                    } : undefined}
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
            />
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