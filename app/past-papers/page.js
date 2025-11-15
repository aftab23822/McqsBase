"use client";

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '../../src/components/Navbar';
import Footer from '../../src/components/Footer';
import BasePastPaper from '../../src/components/PastPapers/BasePastPaper';
import PastPapersRightSideBar from '../../src/components/PastPapersRightSideBar';
import LoadingSpinner from '../../src/components/LoadingSpinner';
import Breadcrumb from '../../src/components/Breadcrumb';
import SubcategoriesSection from '../../src/components/SubcategoriesSection';
import { apiFetch } from '@/utils/api';
import { getPastPaperCategories } from '@/data/categories/pastPapersCategories';

const papersPerPage = 10;

// Helper function to convert subcategories to tree format
function convertSubcategoriesToTree(subcategories, roleLink, basePath = '') {
  if (!subcategories || subcategories.length === 0) return [];
  
  return subcategories.map((subcat, index) => {
    // Generate slug from label if link is empty or invalid
    let slug = '';
    let fullSlug = '';
    
    if (subcat.link && subcat.link.trim()) {
      // Extract slug from link
      const link = subcat.link.trim();
      if (link.startsWith(roleLink)) {
        // Link starts with role link, extract the part after it
        slug = link.replace(roleLink, '').replace(/^\//, '').replace(/\/$/, '');
      } else if (link.startsWith('/past-papers/')) {
        // Full path, extract everything after /past-papers/
        const pathParts = link.replace(/^\/past-papers\//, '').split('/');
        // Find where role ends and subcategory begins
        const roleParts = roleLink.replace(/^\/past-papers\//, '').split('/');
        const roleEndIndex = pathParts.findIndex((part, idx) => 
          idx >= roleParts.length - 1 && part !== roleParts[roleParts.length - 1]
        );
        if (roleEndIndex > 0) {
          slug = pathParts.slice(roleEndIndex).join('/');
        } else {
          slug = pathParts.slice(roleParts.length).join('/');
        }
      } else {
        // Just use the link as-is (relative path)
        slug = link.replace(/^\//, '').replace(/\/$/, '');
      }
    }
    
    // If no slug extracted, generate from label
    if (!slug) {
      slug = subcat.label.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
    }
    
    fullSlug = basePath ? `${basePath}/${slug}` : slug;
    
    const node = {
      _id: `subcat-${index}-${slug}`,
      name: subcat.label,
      slug: slug,
      fullSlug: fullSlug,
      children: convertSubcategoriesToTree(subcat.subcategories || [], roleLink, fullSlug)
    };
    
    return node;
  });
}

// Default category to show on main past papers page
const DEFAULT_CATEGORY = {
  commission: 'sts-siba-testing-services',
  department: 'bps-05-to-15-',
  role: 'intermediate-category'
};

function PastPapersPageContent() {
  const searchParams = useSearchParams();
  const [pastPaperData, setPastPaperData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const pageFromUrl = parseInt(searchParams?.get('page') || '1', 10);
  const [currentPage, setCurrentPage] = useState(pageFromUrl);
  const [totalPages, setTotalPages] = useState(1);
  const [pageTitle, setPageTitle] = useState('Past Papers');
  const [foundRole, setFoundRole] = useState(null);

  // Sync currentPage with URL parameter
  useEffect(() => {
    const pageNum = Number.isFinite(pageFromUrl) && pageFromUrl > 0 ? pageFromUrl : 1;
    setCurrentPage(pageNum);
  }, [pageFromUrl]);

  useEffect(() => {
    const fetchPapers = async () => {
      setLoading(true);
      try {
        const categoryPath = `${DEFAULT_CATEGORY.commission}/${DEFAULT_CATEGORY.department}/${DEFAULT_CATEGORY.role}`;
        const apiUrl = `/api/pastpapers/by-category/${categoryPath}?page=${currentPage}&limit=${papersPerPage}&exact=true`;
        
        const response = await apiFetch(apiUrl);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        setPastPaperData(data.results || []);
        setTotalPages(data.totalPages || 1);
        setPageTitle('STS - SIBA Testing Services — BPS 05 to 15 / Intermediate Category');
        setError(null);

        // Find the role in category structure to get subcategories
        const categories = getPastPaperCategories();
        const foundCategory = categories.find(cat => {
          const catSlug = cat.title.toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-+|-+$/g, '');
          return catSlug === DEFAULT_CATEGORY.commission;
        });

        if (foundCategory) {
          const foundDepartment = foundCategory.departments?.find(dept => {
            const deptSlug = dept.label.replace(/^[^\w\s]+/, '').toLowerCase().replace(/\s+/g, '-');
            return deptSlug.includes(DEFAULT_CATEGORY.department) || DEFAULT_CATEGORY.department.includes(deptSlug.split('-')[0]);
          });

          if (foundDepartment) {
            const foundRoleObj = foundDepartment.roles?.find(r => {
              if (r.link) {
                const linkParts = r.link.split('/').filter(Boolean);
                const lastPart = linkParts[linkParts.length - 1];
                if (lastPart === DEFAULT_CATEGORY.role) {
                  return true;
                }
              }
              
              const roleSlug = r.label.toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/bps-(\d+)/gi, 'bps-$1')
                .replace(/[^a-z0-9-]/g, '')
                .replace(/-+/g, '-')
                .replace(/^-+|-+$/g, '');
              
              const normalizedUrlRole = DEFAULT_CATEGORY.role
                .replace(/bps(\d+)/gi, 'bps-$1')
                .toLowerCase()
                .replace(/[^a-z0-9-]/g, '')
                .replace(/-+/g, '-')
                .replace(/^-+|-+$/g, '');
              
              return roleSlug === normalizedUrlRole || 
                     roleSlug.includes(normalizedUrlRole) || 
                     normalizedUrlRole.includes(roleSlug);
            });

            if (foundRoleObj) {
              setFoundRole(foundRoleObj);
            }
          }
        }
      } catch (err) {
        setError(err.message || 'Failed to load past papers');
        setPastPaperData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPapers();
  }, [currentPage]);

  // Convert subcategories to tree format for SubcategoriesSection
  // Must be called before any conditional returns (Rules of Hooks)
  const subcategoriesTree = useMemo(() => {
    if (!foundRole) {
      return [];
    }
    if (!foundRole.subcategories || foundRole.subcategories.length === 0) {
      return [];
    }
    const tree = convertSubcategoriesToTree(foundRole.subcategories, foundRole.link || '');
    return tree;
  }, [foundRole]);

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Past Papers', href: '/past-papers' },
    { 
      label: 'Intermediate Category', 
      href: `/past-papers/${DEFAULT_CATEGORY.commission}/${DEFAULT_CATEGORY.department}/${DEFAULT_CATEGORY.role}` 
    }
  ];

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
              <Breadcrumb items={breadcrumbItems} />
              {error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                  <p className="text-red-700">Error: {error}</p>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
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
      {/* Display subcategories on page 1 */}
      {currentPage === 1 && subcategoriesTree && subcategoriesTree.length > 0 && (
        <div className="bg-gray-100">
          <div className="max-w-screen-xl mx-auto px-4 py-8">
            <SubcategoriesSection 
              subject={`${DEFAULT_CATEGORY.commission}/${DEFAULT_CATEGORY.department}/${DEFAULT_CATEGORY.role}`}
              initialTree={subcategoriesTree} 
              basePath="past-papers"
            />
          </div>
        </div>
      )}
      <BasePastPaper
        pastpaperData={pastPaperData}
        title={pageTitle}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
        mcqsPerPage={papersPerPage}
        categoryPath={`${DEFAULT_CATEGORY.commission}/${DEFAULT_CATEGORY.department}/${DEFAULT_CATEGORY.role}`}
        breadcrumbItems={breadcrumbItems}
      />
      <Footer />
    </>
  );
}

export default function PastPapersPage() {
  return (
    <Suspense fallback={
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner />
        </div>
        <Footer />
      </>
    }>
      <PastPapersPageContent />
    </Suspense>
  );
}
