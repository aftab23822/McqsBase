"use client";

import React from 'react';
import Link from 'next/link';

/**
 * Reusable Breadcrumb Component
 * 
 * @param {Object} props
 * @param {Array} props.items - Array of breadcrumb items with {label, href} structure
 * @param {string} props.currentPage - Current page label (last item, not clickable)
 */
const Breadcrumb = ({ items = [] }) => {
  if (!items || items.length === 0) {
    return null;
  }

  // Filter out null/undefined items
  const validItems = items.filter(item => item && item.label);

  if (validItems.length === 0) {
    return null;
  }

  return (
    <nav className="mb-6 text-sm text-gray-600">
      {/* Mobile: Simplified breadcrumb */}
      <div className="md:hidden flex items-center space-x-1 overflow-hidden">
        {validItems.slice(0, -1).map((item, index) => (
          <React.Fragment key={index}>
            <Link href={item.href || '#'} className="hover:text-blue-600 whitespace-nowrap">
              {item.label}
            </Link>
            <span className="text-gray-400">›</span>
          </React.Fragment>
        ))}
        <span 
          className="text-gray-800 truncate" 
          title={validItems[validItems.length - 1].label}
        >
          {validItems[validItems.length - 1].label}
        </span>
      </div>
      
      {/* Desktop: Full breadcrumb */}
      <div className="hidden md:flex items-center space-x-2">
        {validItems.map((item, index) => (
          <React.Fragment key={index}>
            {index === validItems.length - 1 ? (
              <span className="text-gray-800">{item.label}</span>
            ) : (
              <>
                <Link href={item.href || '#'} className="hover:text-blue-600">
                  {item.label}
                </Link>
                <span className="text-gray-400">/</span>
              </>
            )}
          </React.Fragment>
        ))}
      </div>
    </nav>
  );
};

export default Breadcrumb;


