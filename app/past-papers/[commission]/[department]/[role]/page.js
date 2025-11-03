"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BasePastPaper from '@/components/PastPapers/BasePastPaper';
import PastPapersRightSideBar from '@/components/PastPapersRightSideBar';
import LoadingSpinner from '@/components/LoadingSpinner';
import Breadcrumb from '@/components/Breadcrumb';
import { apiFetch } from '@/utils/api';
import { getPastPaperCategories } from '@/data/categories/pastPapersCategories';

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
  const [breadcrumbData, setBreadcrumbData] = useState({
    commissionLabel: '',
    departmentLabel: '',
    roleLabel: ''
  });

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

        // Generate breadcrumb labels from category structure
        const categories = getPastPaperCategories();
        let newBreadcrumbData = {
          commissionLabel: commission.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          departmentLabel: department.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          roleLabel: role.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        };

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

            newBreadcrumbData = {
              commissionLabel: foundCategory.title,
              departmentLabel: foundDepartment.label.replace(/^[^\w\s]+/, ''), // Remove emoji
              roleLabel: foundRole?.label || role.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
            };
          } else {
            newBreadcrumbData = {
              commissionLabel: foundCategory.title,
              departmentLabel: department.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              roleLabel: role.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
            };
          }
        }

        setBreadcrumbData(newBreadcrumbData);

        // Generate page title from breadcrumb data
        const titleParts = [
          newBreadcrumbData.commissionLabel,
          newBreadcrumbData.departmentLabel,
          newBreadcrumbData.roleLabel
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
              {/* Breadcrumb Navigation */}
              <Breadcrumb items={[
                { label: 'Home', href: '/' },
                { label: 'Past Papers', href: '/past-papers' },
                { label: breadcrumbData.commissionLabel || commission, href: `/past-papers` },
                breadcrumbData.departmentLabel && { label: breadcrumbData.departmentLabel, href: '#' },
                breadcrumbData.roleLabel && { label: breadcrumbData.roleLabel, href: '#' }
              ].filter(Boolean)} />
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
            {/* Breadcrumb Navigation */}
            <Breadcrumb items={[
              { label: 'Home', href: '/' },
              { label: 'Past Papers', href: '/past-papers' },
              { label: breadcrumbData.commissionLabel || commission, href: `/past-papers` },
              breadcrumbData.departmentLabel && { label: breadcrumbData.departmentLabel, href: '#' },
              breadcrumbData.roleLabel && { label: breadcrumbData.roleLabel, href: '#' }
            ].filter(Boolean)} />
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

