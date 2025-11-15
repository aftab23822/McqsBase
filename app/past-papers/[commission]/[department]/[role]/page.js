"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BasePastPaper from '@/components/PastPapers/BasePastPaper';
import PastPapersRightSideBar from '@/components/PastPapersRightSideBar';
import LoadingSpinner from '@/components/LoadingSpinner';
import Breadcrumb from '@/components/Breadcrumb';
import SubcategoriesSection from '@/components/SubcategoriesSection';
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

export default function PastPaperCategoryPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { commission, department, role } = params;
  
  const [pastPaperData, setPastPaperData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const pageFromUrl = parseInt(searchParams?.get('page') || '1', 10);
  const [currentPage, setCurrentPage] = useState(pageFromUrl);
  const [totalPages, setTotalPages] = useState(1);
  const [pageTitle, setPageTitle] = useState('');
  const [foundRole, setFoundRole] = useState(null);
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

  // Sync currentPage with URL parameter
  useEffect(() => {
    const pageNum = Number.isFinite(pageFromUrl) && pageFromUrl > 0 ? pageFromUrl : 1;
    setCurrentPage(pageNum);
  }, [pageFromUrl]);

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
          // Strategy 1: Match by slugified title (normalize multiple dashes)
          const catSlug = cat.title.toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')  // Replace multiple dashes with single dash
            .replace(/^-+|-+$/g, ''); // Remove leading/trailing dashes
          
          // Strategy 2: Match by removing all non-alphanumeric and normalizing
          const catSlugAlt = cat.title.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')  // Remove special chars first
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-+|-+$/g, '');
          
          // Strategy 3: Match by link if available
          let linkMatch = false;
          if (cat.departments) {
            for (const dept of cat.departments) {
              if (dept.roles) {
                for (const r of dept.roles) {
                  if (r.link) {
                    const linkParts = r.link.split('/').filter(Boolean);
                    if (linkParts.length >= 2 && linkParts[1] === commission) {
                      linkMatch = true;
                      break;
                    }
                  }
                }
                if (linkMatch) break;
              }
            }
          }
          
          return catSlug === commission || catSlugAlt === commission || linkMatch;
        });

        if (foundCategory) {
          const foundDepartment = foundCategory.departments?.find(dept => {
            const deptSlug = dept.label.replace(/^[^\w\s]+/, '').toLowerCase().replace(/\s+/g, '-');
            const match = deptSlug.includes(department) || department.includes(deptSlug.split('-')[0]);
            return match;
          });

          if (foundDepartment) {
            // Try multiple matching strategies
            const foundRole = foundDepartment.roles?.find(r => {
              // Strategy 1: Match by link
              if (r.link) {
                const linkParts = r.link.split('/').filter(Boolean);
                const lastPart = linkParts[linkParts.length - 1];
                if (lastPart === role) {
                  return true;
                }
              }
              
              // Strategy 2: Match by slugified label
              const roleSlug = r.label.toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/bps-(\d+)/gi, 'bps-$1')
                .replace(/[^a-z0-9-]/g, '')
                .replace(/-+/g, '-')
                .replace(/^-+|-+$/g, '');
              
              const normalizedUrlRole = role
                .replace(/bps(\d+)/gi, 'bps-$1')
                .toLowerCase()
                .replace(/[^a-z0-9-]/g, '')
                .replace(/-+/g, '-')
                .replace(/^-+|-+$/g, '');
              
              // Exact match
              if (roleSlug === normalizedUrlRole) {
                return true;
              }
              
              // Partial match (contains)
              if (roleSlug.includes(normalizedUrlRole) || normalizedUrlRole.includes(roleSlug)) {
                return true;
              }
              
              return false;
            });

            if (foundRole) {
              setFoundRole(foundRole);
            }

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
        // Format: "Commission — Department / Role"
        const commissionPart = newBreadcrumbData.commissionLabel;
        const departmentPart = newBreadcrumbData.departmentLabel;
        const rolePart = newBreadcrumbData.roleLabel;
        setPageTitle(`${commissionPart} — ${departmentPart} / ${rolePart}`);

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

  // Convert subcategories to tree format for SubcategoriesSection
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
                breadcrumbData.roleLabel && { 
                  label: breadcrumbData.roleLabel, 
                  href: `/past-papers/${commission}/${department}/${role}` 
                }
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
      {/* Display subcategories on page 1 */}
      {currentPage === 1 && subcategoriesTree && subcategoriesTree.length > 0 && (
        <div className="bg-gray-100">
          <div className="max-w-screen-xl mx-auto px-4 py-8">
            <SubcategoriesSection 
              subject={`${commission}/${department}/${role}`}
              initialTree={subcategoriesTree} 
              basePath="past-papers"
            />
          </div>
        </div>
      )}
            <BasePastPaper
              pastpaperData={pastPaperData}
              title={pageTitle || 'Past Papers'}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              totalPages={totalPages}
              mcqsPerPage={papersPerPage}
              categoryPath={`${commission}/${department}/${role}`}
              breadcrumbItems={[
                { label: 'Home', href: '/' },
                { label: 'Past Papers', href: '/past-papers' },
                breadcrumbData.roleLabel && { 
                  label: breadcrumbData.roleLabel, 
                  href: `/past-papers/${commission}/${department}/${role}` 
                }
              ].filter(Boolean)}
      />
      <Footer />
    </>
  );
}

