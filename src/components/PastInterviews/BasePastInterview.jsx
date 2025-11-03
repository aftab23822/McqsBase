"use client";

import React, { useEffect } from 'react';
import PastInterviewCard from '../PastInterviewCard';
import Pagination from '../Pagination';

const BasePastInterview = ({ pastInterviewData, title, currentPage, setCurrentPage, totalPages, interviewsPerPage }) => {
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, [currentPage]);

  return (
    <div className="p-1 sm:p-6 md:p-10 space-y-6 pb-20">
      {pastInterviewData.map((q, index) => (
        <PastInterviewCard
          key={index}
          questionNumber={(currentPage - 1) * interviewsPerPage + index + 1}
          correctAnswer={q.answer}
          {...q}
        />
      ))}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default BasePastInterview;
