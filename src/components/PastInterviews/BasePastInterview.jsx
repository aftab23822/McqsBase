"use client";

import React, { useEffect } from 'react';
import PastInterviewCard from '../PastInterviewCard';
import PastInterviewsRightSideBar from '../PastInterviewsRightSideBar';
import Pagination from '../Pagination';

const BasePastInterview = ({ pastInterviewData, title, currentPage, setCurrentPage, totalPages, interviewsPerPage }) => {
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, [currentPage]);

  return (
    <section className="full-screen px-4 py-8 bg-gray-100">
      <div className="max-w-screen-xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-2">
        {/* Main Content */}
        <div className="col-span-2 p-62rounded-lg space-y-6">
          <div className="p-1 sm:p-6 md:p-10 space-y-6 pb-20">
            <h1 className="text-2xl font-bold mb-4 text-center text-gray-800">
              {title || "Interview Questions Shared by Candidates"}
            </h1>
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
        </div>
        {/* Sidebar */}
        <div className="h-fit top-20">
          <PastInterviewsRightSideBar />
        </div>
      </div>
    </section>
  );
};

export default BasePastInterview;
