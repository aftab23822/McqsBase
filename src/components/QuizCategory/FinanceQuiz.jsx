"use client";

import React, { useEffect, useState } from 'react';
import BaseQuiz from './BaseQuiz';
import LoadingSpinner from '../LoadingSpinner';
import { apiFetch } from '../../utils/api';
import { usePageFromUrl } from '../../hooks/usePageFromUrl';

const quizPerPage = 10;


const FinanceQuiz = () => {
  const [quizData, setQuizData] = useState([]);
  const [displayData, setDisplayData] = useState([]); // Data actually displayed
  const [loading, setLoading] = useState(true);
  const [isPageChanging, setIsPageChanging] = useState(false);
  const [error, setError] = useState(null);
    // Initialize currentPage from URL or default to 1
  const initialPage = usePageFromUrl();
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
    let isCancelled = false;
    
    // Only show full loader on initial load, not page changes
    if (quizData.length === 0) {
      setLoading(true);
      setDisplayData([]);
    } else {
      // Keep old data displayed, show overlay
      setIsPageChanging(true);
    }
    
    const fetchData = async () => {
      try {
        // Wait for overlay to be fully visible (prevents flicker)
        if (quizData.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        if (isCancelled) return;
        
        const res = await apiFetch(`/api/quiz/finance?page=${currentPage}&limit=${quizPerPage}`);
        if (!res.ok) throw new Error('Network response was not ok');
        const data = await res.json();
        
        if (isCancelled) return;
        
        // Update internal state
        setQuizData(data.results);
        setTotalPages(data.totalPages);
        setLoading(false);
        
        // Wait for overlay to fully cover, then update displayed data and scroll
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            // Update display data (this triggers re-render with new content)
            setDisplayData(data.results);
            
            // Scroll happens in BaseQuiz when displayData updates
            // Wait a bit for scroll, then remove overlay
            setTimeout(() => {
              if (!isCancelled) {
                setIsPageChanging(false);
              }
            }, 150);
          });
        });
      } catch (err) {
        if (!isCancelled) {
          setError(err.message);
          setLoading(false);
          setIsPageChanging(false);
          setDisplayData([]);
        }
      }
    };
    
    fetchData();
    
    return () => {
      isCancelled = true;
    };
  }, [currentPage]);
  
  // Sync displayData with quizData on initial load
  useEffect(() => {
    if (quizData.length > 0 && displayData.length === 0 && !loading) {
      setDisplayData(quizData);
    }
  }, [quizData, displayData.length, loading]);

  if (loading && displayData.length === 0) return <LoadingSpinner />;
  if (error) return <div>Error: {error}</div>;
  return (
    <div className="relative">
      <div className={isPageChanging ? 'opacity-60 pointer-events-none transition-opacity duration-300' : 'transition-opacity duration-300'}>
        <BaseQuiz quizData={displayData} title="Finance Quiz"
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalPages={totalPages}
          quizPerPage={quizPerPage}
        />
      </div>
      {isPageChanging && (
        <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-70 z-50 transition-opacity duration-300">
          <LoadingSpinner />
        </div>
      )}
    </div>
  );
};

export default FinanceQuiz; 