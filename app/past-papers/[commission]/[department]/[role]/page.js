"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BasePastPaper from '@/components/PastPapers/BasePastPaper';
import PastPapersRightSideBar from '@/components/PastPapersRightSideBar';
import LoadingSpinner from '@/components/LoadingSpinner';
import { apiFetch } from '@/utils/api';

const papersPerPage = 10;

export default function PastPaperCategoryPage() {
  const params = useParams();
  const { commission, department, role } = params;
  
  const [pastPaperData, setPastPaperData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageTitle, setPageTitle] = useState('');

  useEffect(() => {
    // Reset when params change
    setCurrentPage(1);
    setPastPaperData([]);
    setError(null);
  }, [commission, department, role]);

  useEffect(() => {
    const fetchPapers = async () => {
      if (!commission || !department || !role) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await apiFetch(
          `/api/pastpapers/by-category/${commission}/${department}/${role}?page=${currentPage}&limit=${papersPerPage}`
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        setPastPaperData(data.results || []);
        setTotalPages(data.totalPages || 1);

        // Generate page title from URL params
        const titleParts = [
          commission.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          department.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          role.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        ];
        setPageTitle(`${titleParts[0]} > ${titleParts[1]} > ${titleParts[2]}`);

        setError(null);
      } catch (err) {
        console.error('Error fetching past papers:', err);
        setError(err.message || 'Failed to load past papers');
        setPastPaperData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPapers();
  }, [commission, department, role, currentPage]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner />
        </div>
        <Footer />
      </>
    );
  }

  if (error || !pastPaperData || pastPaperData.length === 0) {
    return (
      <>
        <Navbar />
        <section className="full-screen px-4 py-8 bg-gray-100">
          <div className="max-w-screen-xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="col-span-2 p-6 rounded-lg">
              <h1 className="text-2xl font-bold mb-4 text-gray-800">
                {pageTitle || 'Past Papers'}
              </h1>
              {error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700">Error: {error}</p>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-gray-700">No past papers found for this category.</p>
                </div>
              )}
            </div>
            <div className="col-span-1">
              <PastPapersRightSideBar />
            </div>
          </div>
        </section>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <section className="full-screen px-4 py-8 bg-gray-100">
        <div className="max-w-screen-xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="col-span-2">
            <BasePastPaper
              pastpaperData={pastPaperData}
              title={pageTitle || 'Past Papers'}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              totalPages={totalPages}
              mcqsPerPage={papersPerPage}
            />
          </div>
          <div className="col-span-1">
            <PastPapersRightSideBar />
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}

