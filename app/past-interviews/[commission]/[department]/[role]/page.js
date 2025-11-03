"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BasePastInterview from '@/components/PastInterviews/BasePastInterview';
import PastInterviewsRightSideBar from '@/components/PastInterviewsRightSideBar';
import LoadingSpinner from '@/components/LoadingSpinner';
import { apiFetch } from '@/utils/api';
import { getPastInterviewCategories } from '@/data/categories/pastInterviewsCategories';

const interviewsPerPage = 10;

export default function PastInterviewCategoryPage() {
  const params = useParams();
  const { commission, department, role } = params;
  
  const [pastInterviewData, setPastInterviewData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [breadcrumbData, setBreadcrumbData] = useState({
    commissionLabel: '',
    departmentLabel: '',
    roleLabel: ''
  });

  useEffect(() => {
    // Reset when params change
    setCurrentPage(1);
    setPastInterviewData([]);
    setError(null);
  }, [commission, department, role]);

  useEffect(() => {
    const fetchInterviews = async () => {
      if (!commission || !department || !role) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await apiFetch(
          `/api/interviews/${commission}/${department}/${role}?page=${currentPage}&limit=${interviewsPerPage}`
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        setPastInterviewData(data.results || []);
        setTotalPages(data.totalPages || 1);

        // Generate breadcrumb labels from category structure
        const categories = getPastInterviewCategories();
        const foundCategory = categories.find(cat => {
          const catSlug = cat.title.toLowerCase().replace(/\s+/g, '-');
          return catSlug === commission || cat.title.toLowerCase().replace(/[^a-z0-9]/g, '-') === commission;
        });

        if (foundCategory) {
          const foundDepartment = foundCategory.departments?.find(dept => {
            const deptSlug = dept.label.replace(/^[^\w\s]+/, '').toLowerCase().replace(/\s+/g, '-');
            return deptSlug.includes(department) || department.includes(deptSlug.split('-')[0]);
          });

          if (foundDepartment) {
            const foundRole = foundDepartment.roles?.find(r => {
              const roleSlug = r.label.toLowerCase().replace(/\s+/g, '-').replace(/bps-(\d+)/gi, 'bps-$1');
              const normalizedUrlRole = role.replace(/bps(\d+)/gi, 'bps-$1');
              return roleSlug === normalizedUrlRole || roleSlug.includes(role) || role.includes(roleSlug);
            });

            setBreadcrumbData({
              commissionLabel: foundCategory.title,
              departmentLabel: foundDepartment.label.replace(/^[^\w\s]+/, ''), // Remove emoji
              roleLabel: foundRole?.label || role.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
            });
          } else {
            setBreadcrumbData({
              commissionLabel: foundCategory.title,
              departmentLabel: department.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              roleLabel: role.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
            });
          }
        } else {
          // Fallback: generate labels from URL params
          setBreadcrumbData({
            commissionLabel: commission.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            departmentLabel: department.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            roleLabel: role.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
          });
        }

        setError(null);
      } catch (err) {
        console.error('Error fetching past interviews:', err);
        setError(err.message || 'Failed to load past interviews');
        setPastInterviewData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInterviews();
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

  if (error || !pastInterviewData || pastInterviewData.length === 0) {
    return (
      <>
        <Navbar />
        <section className="full-screen px-4 py-8 bg-gray-100">
          <div className="max-w-screen-xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="col-span-2 p-6 rounded-lg">
              {/* Breadcrumb Navigation */}
              <nav className="mb-6 text-sm text-gray-600">
                {/* Mobile: Simplified breadcrumb */}
                <div className="md:hidden flex items-center space-x-1 overflow-hidden">
                  <Link href="/" className="hover:text-blue-600 whitespace-nowrap">Home</Link>
                  <span className="text-gray-400">›</span>
                  <Link href="/past-interviews" className="hover:text-blue-600 whitespace-nowrap">Interviews</Link>
                  <span className="text-gray-400">›</span>
                  <span className="text-gray-800 truncate" title={breadcrumbData.roleLabel || breadcrumbData.departmentLabel || breadcrumbData.commissionLabel}>
                    {breadcrumbData.roleLabel || breadcrumbData.departmentLabel || breadcrumbData.commissionLabel || role}
                  </span>
                </div>
                {/* Desktop: Full breadcrumb */}
                <div className="hidden md:flex items-center space-x-2">
                  <Link href="/" className="hover:text-blue-600">Home</Link>
                  <span className="text-gray-400">/</span>
                  <Link href="/past-interviews" className="hover:text-blue-600">Past Interviews</Link>
                  <span className="text-gray-400">/</span>
                  <Link href={`/past-interviews`} className="hover:text-blue-600">{breadcrumbData.commissionLabel || commission}</Link>
                  {breadcrumbData.departmentLabel && (
                    <>
                      <span className="text-gray-400">/</span>
                      <span className="text-gray-800">{breadcrumbData.departmentLabel}</span>
                    </>
                  )}
                  {breadcrumbData.roleLabel && (
                    <>
                      <span className="text-gray-400">/</span>
                      <span className="text-gray-800">{breadcrumbData.roleLabel}</span>
                    </>
                  )}
                </div>
              </nav>
              <h1 className="text-2xl font-bold mb-4 text-gray-800">
                Past Interview Questions
              </h1>
              {error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700">Error: {error}</p>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-gray-700">No past interview questions found for this category.</p>
                </div>
              )}
            </div>
            <div className="col-span-1">
              <PastInterviewsRightSideBar />
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
            {/* Breadcrumb Navigation */}
            <nav className="mb-6 text-sm text-gray-600">
              {/* Mobile: Simplified breadcrumb */}
              <div className="md:hidden flex items-center space-x-1 overflow-hidden">
                <Link href="/" className="hover:text-blue-600 whitespace-nowrap">Home</Link>
                <span className="text-gray-400">›</span>
                <Link href="/past-interviews" className="hover:text-blue-600 whitespace-nowrap">Interviews</Link>
                <span className="text-gray-400">›</span>
                <span className="text-gray-800 truncate" title={breadcrumbData.roleLabel || breadcrumbData.departmentLabel || breadcrumbData.commissionLabel}>
                  {breadcrumbData.roleLabel || breadcrumbData.departmentLabel || breadcrumbData.commissionLabel || role}
                </span>
              </div>
              {/* Desktop: Full breadcrumb */}
              <div className="hidden md:flex items-center space-x-2">
                <Link href="/" className="hover:text-blue-600">Home</Link>
                <span className="text-gray-400">/</span>
                <Link href="/past-interviews" className="hover:text-blue-600">Past Interviews</Link>
                <span className="text-gray-400">/</span>
                <Link href={`/past-interviews`} className="hover:text-blue-600">{breadcrumbData.commissionLabel || commission}</Link>
                {breadcrumbData.departmentLabel && (
                  <>
                    <span className="text-gray-400">/</span>
                    <span className="text-gray-800">{breadcrumbData.departmentLabel}</span>
                  </>
                )}
                {breadcrumbData.roleLabel && (
                  <>
                    <span className="text-gray-400">/</span>
                    <span className="text-gray-800">{breadcrumbData.roleLabel}</span>
                  </>
                )}
              </div>
            </nav>
            <BasePastInterview
              pastInterviewData={pastInterviewData}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              totalPages={totalPages}
              interviewsPerPage={interviewsPerPage}
            />
          </div>
          <div className="col-span-1">
            <PastInterviewsRightSideBar />
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}

