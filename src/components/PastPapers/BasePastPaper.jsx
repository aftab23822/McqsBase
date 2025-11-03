"use client";

import React, { useEffect } from 'react';
import PastPaperMcqCard from '../PastPaperMcqCard';
import PastPapersRightSideBar from '../PastPapersRightSideBar';
import Pagination from '../Pagination';
import Breadcrumb from '../Breadcrumb';

const BasePastPaper = ({ pastpaperData, title, currentPage, setCurrentPage, totalPages, mcqsPerPage, breadcrumbItems }) =>  {
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
        <div className="col-span-2 p-62rounded-lg space-y-6">
          <div className="p-1 sm:p-6 md:p-10 space-y-6 pb-20">
            {/* Breadcrumb Navigation */}
            {breadcrumbItems && <Breadcrumb items={breadcrumbItems} />}
            {pastpaperData.map((mcq, index) => (
              <PastPaperMcqCard
                key={index}
                questionNumber={(currentPage - 1) * mcqsPerPage + index + 1}
                correctAnswer={mcq.answer}
                {...mcq}
              />
            ))}
            {/* Pagination Component */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
        {/* Right Sidebar - now scrolls with content */}
        <div className="h-fit top-20">
          <PastPapersRightSideBar />
        </div>
      </div>
    </section>
  );
};

export default BasePastPaper;
