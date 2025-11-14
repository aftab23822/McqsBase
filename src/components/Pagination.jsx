"use client";

import React, { useState } from 'react';

const Pagination = ({ currentPage, totalPages, onPageChange, disableNavigation = false }) => {
  const [jumpInput, setJumpInput] = useState('');

  const handleJump = () => {
    if (disableNavigation) return;
    const page = parseInt(jumpInput);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
    setJumpInput('');
  };

  const handlePrev = () => {
    if (disableNavigation) return;
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (disableNavigation) return;
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  
  const renderPageNumbers = () => {
  const pages = [];

  // Always show first page
  pages.push(1);

  // Show left ellipsis if needed
  if (currentPage > 3) {
    pages.push('...');
  }

  // Show middle pages (currentPage -1, currentPage, currentPage +1)
  for (let i = currentPage - 1; i <= currentPage + 1; i++) {
    if (i > 1 && i < totalPages) {
      pages.push(i);
    }
  }

  // Show right ellipsis if needed
  if (currentPage < totalPages - 2) {
    pages.push('...');
  }

  // Always show last page
  if (totalPages > 1) {
    pages.push(totalPages);
  }

  // Render page elements
  return pages.map((num, idx) =>
    num === '...' ? (
      <span key={`ellipsis-${idx}`} className="px-3 py-1 text-gray-500">
        ...
      </span>
    ) : (
      <button
        key={`page-${num}`}
        onClick={() => !disableNavigation && onPageChange(num)}
        disabled={disableNavigation}
        className={`px-3 py-1 rounded ${
          num === currentPage
            ? 'bg-green-700 text-white font-bold'
            : 'bg-white text-gray-700 border hover:bg-green-100'
        } ${disableNavigation ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {num}
      </button>
    )
  );
};


  return (
    <div className="flex flex-col items-center pt-6 gap-4">
      <div className="flex flex-wrap gap-2 justify-center">
        <button
          onClick={handlePrev}
          disabled={currentPage === 1 || disableNavigation}
          className="px-3 py-1 bg-white border rounded disabled:opacity-50"
        >
          ‹
        </button>

        {renderPageNumbers()}

        <button
          onClick={handleNext}
          disabled={currentPage === totalPages || disableNavigation}
          className="px-3 py-1 bg-white border rounded disabled:opacity-50"
        >
          ›
        </button>
      </div>

      {/* Jump to Page */}
      <div className="flex gap-2 mt-2">
        <input
          type="number"
          name="pagination-jump"
          min="1"
          max={totalPages}
          value={jumpInput}
          onChange={(e) => setJumpInput(e.target.value)}
          placeholder="Jump to"
          disabled={disableNavigation}
          className={`border px-3 py-1 rounded w-24 ${disableNavigation ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
        <button
          onClick={handleJump}
          disabled={disableNavigation}
          className={`bg-green-600 text-white px-4 py-1 rounded ${disableNavigation ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          GO
        </button>
      </div>
    </div>
  );
};

export default Pagination;
