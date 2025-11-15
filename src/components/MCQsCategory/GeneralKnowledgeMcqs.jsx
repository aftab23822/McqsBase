"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import BaseMcqs from './BaseMcqs';
import LoadingSpinner from '../LoadingSpinner';
import { apiFetch } from '../../utils/api';

const mcqsPerPage = 10;

function GeneralKnowledgeMcqsContent() {
  const searchParams = useSearchParams();
  const [mcqsData, setMcqsData] = useState([]);
  const [displayData, setDisplayData] = useState([]); // Data actually displayed
  const [loading, setLoading] = useState(true);
  const [isPageChanging, setIsPageChanging] = useState(false);
  const [error, setError] = useState(null);
  // Initialize currentPage from URL or default to 1 - read directly from searchParams
  const pageFromUrl = parseInt(searchParams?.get('page') || '1', 10);
  const initialPage = Number.isFinite(pageFromUrl) && pageFromUrl > 0 ? pageFromUrl : 1;
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);

  // Sync currentPage with URL parameter when it changes
  useEffect(() => {
    const pageNum = Number.isFinite(pageFromUrl) && pageFromUrl > 0 ? pageFromUrl : 1;
    if (pageNum !== currentPage) {
      setCurrentPage(pageNum);
    }
  }, [pageFromUrl]);

    useEffect(() => {
    let isCancelled = false;
    
    // Only show full loader on initial load, not page changes
    if (mcqsData.length === 0) {
      setLoading(true);
      setDisplayData([]);
    } else {
      // Keep old data displayed, show overlay
      setIsPageChanging(true);
    }
    
    const fetchData = async () => {
      try {
        // Wait for overlay to be fully visible (prevents flicker)
        if (mcqsData.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        if (isCancelled) return;
        
        const res = await apiFetch(`/api/mcqs/general-knowledge?page=${currentPage}&limit=${mcqsPerPage}`);
        if (!res.ok) throw new Error('Network response was not ok');
        const data = await res.json();
        
        if (isCancelled) return;
        
        // Update internal state
        setMcqsData(data.results);
        setTotalPages(data.totalPages);
        setLoading(false);
        
        // Wait for overlay to fully cover, then update displayed data and scroll
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            // Update display data (this triggers re-render with new content)
            setDisplayData(data.results);
            
            // Scroll happens in BaseMcqs when displayData updates
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
  
  // Sync displayData with mcqsData on initial load
  useEffect(() => {
    if (mcqsData.length > 0 && displayData.length === 0 && !loading) {
      setDisplayData(mcqsData);
    }
  }, [mcqsData, displayData.length, loading]);

  if (loading && displayData.length === 0) return <LoadingSpinner />;
  if (error) return <div>Error: {error}</div>;
  return (
    <div className="relative">
      <div className={isPageChanging ? 'opacity-60 pointer-events-none transition-opacity duration-300' : 'transition-opacity duration-300'}>
        <BaseMcqs mcqsData={displayData} title="General Knowledge MCQs"
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalPages={totalPages}
          mcqsPerPage={mcqsPerPage}
          subjectSlug="general-knowledge"
        />
      </div>
      {isPageChanging && (
        <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-70 z-50 transition-opacity duration-300">
          <LoadingSpinner />
        </div>
      )}
    </div>
  );
}

const GeneralKnowledgeMcqs = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <GeneralKnowledgeMcqsContent />
    </Suspense>
  );
};

export default GeneralKnowledgeMcqs; 