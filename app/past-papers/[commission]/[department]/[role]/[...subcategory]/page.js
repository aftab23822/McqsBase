"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BasePastPaper from '@/components/PastPapers/BasePastPaper';
import PastPapersRightSideBar from '@/components/PastPapersRightSideBar';
import LoadingSpinner from '@/components/LoadingSpinner';
import Breadcrumb from '@/components/Breadcrumb';
import SubcategoriesSection from '@/components/SubcategoriesSection';
import { apiFetch } from '@/utils/api';
import { getPastPaperCategories } from '@/data/categories/pastPapersCategories';
import IndividualQuestion from '@/components/IndividualQuestion';

const papersPerPage = 10;
const QUESTION_SEGMENT = 'question';

function isQuestionRoute(rawSegments) {
  return Array.isArray(rawSegments) && rawSegments.length >= 2 && rawSegments[rawSegments.length - 2] === QUESTION_SEGMENT;
}

// Helper function to convert subcategories to tree format
function convertSubcategoriesToTree(subcategories, roleLink, basePath = '') {
  if (!subcategories || subcategories.length === 0) return [];
  
  return subcategories.map((subcat, index) => {
    let slug = '';
    let fullSlug = '';
    
    if (subcat.link && subcat.link.trim()) {
      const link = subcat.link.trim();
      if (link.startsWith(roleLink)) {
        slug = link.replace(roleLink, '').replace(/^\//, '').replace(/\/$/, '');
      } else if (link.startsWith('/past-papers/')) {
        const pathParts = link.replace(/^\/past-papers\//, '').split('/');
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
        slug = link.replace(/^\//, '').replace(/\/$/, '');
      }
    }
    
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

// Helper to find subcategory by path
function findSubcategoryByPath(role, subcategoryPath) {
  if (!role || !role.subcategories || subcategoryPath.length === 0) {
    return null;
  }
  
  let current = role.subcategories;
  let found = null;
  
  for (let i = 0; i < subcategoryPath.length; i++) {
    const segment = subcategoryPath[i];
    found = current.find(subcat => {
      // Try to match by slug extracted from link
      if (subcat.link) {
        const linkParts = subcat.link.split('/').filter(Boolean);
        const lastPart = linkParts[linkParts.length - 1];
        if (lastPart === segment) return true;
      }
      
      // Try to match by slugified label
      const slug = subcat.label.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      return slug === segment;
    });
    
    if (!found || i === subcategoryPath.length - 1) {
      break;
    }
    
    current = found.subcategories || [];
  }
  
  return found;
}

export default function PastPaperSubcategoryPage() {
  const params = useParams();
  const { commission, department, role, subcategory } = params;
  
  // subcategory is an array from catch-all route
  const rawSubcategoryPath = Array.isArray(subcategory) ? subcategory : (subcategory ? [subcategory] : []);
  const isQuestion = isQuestionRoute(rawSubcategoryPath);
  const subcategoryPath = isQuestion ? rawSubcategoryPath.slice(0, -2) : rawSubcategoryPath;
  
  const [pastPaperData, setPastPaperData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageTitle, setPageTitle] = useState('');
  const [foundSubcategory, setFoundSubcategory] = useState(null);
  const [foundRole, setFoundRole] = useState(null);
  const [questionData, setQuestionData] = useState(null);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [breadcrumbData, setBreadcrumbData] = useState({
    commissionLabel: '',
    departmentLabel: '',
    roleLabel: '',
    subcategoryLabel: ''
  });

  useEffect(() => {
    setCurrentPage(1);
    setPastPaperData([]);
    setError(null);
    setQuestionData(null);
  }, [commission, department, role, rawSubcategoryPath.join('/')]);

  // Fetch question data if it's a question route
  useEffect(() => {
    if (!isQuestion || !commission || !department || !role) return;
    
    const questionSlug = rawSubcategoryPath[rawSubcategoryPath.length - 1];
    const categoryPath = subcategoryPath.length > 0
      ? `${commission}/${department}/${role}/${subcategoryPath.join('/')}`
      : `${commission}/${department}/${role}`;
    
    const fetchQuestion = async () => {
      setQuestionLoading(true);
      setError(null);
      try {
        const response = await apiFetch(`/api/pastpapers/question/${categoryPath}/question/${questionSlug}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Question not found' }));
          setError(errorData.error || 'Question not found');
          return;
        }
        const data = await response.json();
        if (data && !data.error && data.question) {
          setQuestionData(data);
        } else {
          setError(data?.error || 'Question not found');
        }
      } catch (err) {
        setError('Failed to load question');
      } finally {
        setQuestionLoading(false);
      }
    };
    
    fetchQuestion();
  }, [isQuestion, commission, department, role, rawSubcategoryPath.join('/')]);

  useEffect(() => {
    const fetchPapers = async () => {
      // Skip fetching papers if it's a question route
      if (isQuestion) {
        setLoading(false);
        return;
      }
      
      if (!commission || !department || !role) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Build the category path including subcategory
        const categoryPath = subcategoryPath.length > 0
          ? `${commission}/${department}/${role}/${subcategoryPath.join('/')}`
          : `${commission}/${department}/${role}`;
        
        const response = await apiFetch(
          `/api/pastpapers/by-category/${categoryPath}?page=${currentPage}&limit=${papersPerPage}`
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        setPastPaperData(data.results || []);
        setTotalPages(data.totalPages || 1);

        // Find the role and subcategory in category structure
        const categories = getPastPaperCategories();
        let newBreadcrumbData = {
          commissionLabel: commission.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          departmentLabel: department.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          roleLabel: role.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          subcategoryLabel: subcategoryPath.map(s => s.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())).join(' / ')
        };

        const foundCategory = categories.find(cat => {
          const catSlug = cat.title.toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-+|-+$/g, '');
          
          const catSlugAlt = cat.title.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-+|-+$/g, '');
          
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
            return deptSlug.includes(department) || department.includes(deptSlug.split('-')[0]);
          });

          if (foundDepartment) {
            const foundRoleObj = foundDepartment.roles?.find(r => {
              if (r.link) {
                const linkParts = r.link.split('/').filter(Boolean);
                const lastPart = linkParts[linkParts.length - 1];
                if (lastPart === role) return true;
              }
              
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
              
              return roleSlug === normalizedUrlRole || roleSlug.includes(role) || role.includes(roleSlug);
            });

            if (foundRoleObj) {
              setFoundRole(foundRoleObj);
              
              // Find subcategory if path provided
              if (subcategoryPath.length > 0) {
                const foundSubcat = findSubcategoryByPath(foundRoleObj, subcategoryPath);
                if (foundSubcat) {
                  setFoundSubcategory(foundSubcat);
                  newBreadcrumbData.subcategoryLabel = foundSubcat.label;
                }
              }

              newBreadcrumbData = {
                commissionLabel: foundCategory.title,
                departmentLabel: foundDepartment.label.replace(/^[^\w\s]+/, ''),
                roleLabel: foundRoleObj.label,
                subcategoryLabel: newBreadcrumbData.subcategoryLabel
              };
            }
          }
        }

        setBreadcrumbData(newBreadcrumbData);

        // Generate page title
        const parts = [
          newBreadcrumbData.commissionLabel,
          newBreadcrumbData.departmentLabel,
          newBreadcrumbData.roleLabel
        ];
        if (newBreadcrumbData.subcategoryLabel) {
          parts.push(newBreadcrumbData.subcategoryLabel);
        }
        setPageTitle(parts.join(' — '));

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
  }, [commission, department, role, subcategoryPath.join('/'), currentPage]);

  // Convert subcategories to tree format for SubcategoriesSection
  const subcategoriesTree = useMemo(() => {
    const targetSubcategory = foundSubcategory || foundRole;
    if (!targetSubcategory || !targetSubcategory.subcategories || targetSubcategory.subcategories.length === 0) {
      return [];
    }
    return convertSubcategoriesToTree(targetSubcategory.subcategories, targetSubcategory.link || foundRole?.link || '');
  }, [foundSubcategory, foundRole]);

  // Render question page if it's a question route
  if (isQuestion) {
    if (questionLoading) {
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

    if (error || !questionData) {
      return (
        <>
          <Navbar />
          <section className="min-h-screen px-4 py-8 bg-gray-100">
            <div className="max-w-4xl mx-auto">
              <Breadcrumb items={[
                { label: 'Home', href: '/' },
                { label: 'Past Papers', href: '/past-papers' },
                breadcrumbData.roleLabel && { 
                  label: breadcrumbData.roleLabel, 
                  href: `/past-papers/${commission}/${department}/${role}` 
                },
                breadcrumbData.subcategoryLabel && { label: breadcrumbData.subcategoryLabel, href: '#' }
              ].filter(Boolean)} />
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                <p className="text-red-700">{error || 'Question not found'}</p>
              </div>
            </div>
          </section>
          <Footer />
        </>
      );
    }

    // Build category path for IndividualQuestion component
    const categoryPath = subcategoryPath.length > 0
      ? `${commission}/${department}/${role}/${subcategoryPath.join('/')}`
      : `${commission}/${department}/${role}`;
    
    const categoryName = breadcrumbData.subcategoryLabel || breadcrumbData.roleLabel || 'Past Papers';

    return (
      <>
        <Navbar />
        <IndividualQuestion
          question={questionData.question}
          subject="past-papers"
          subjectPath={categoryPath}
          categoryName={categoryName}
          nextQuestionId={questionData.nextQuestionSlug || questionData.nextQuestionId}
          prevQuestionId={questionData.prevQuestionSlug || questionData.prevQuestionId}
        />
        <Footer />
      </>
    );
  }

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
              <Breadcrumb items={[
                { label: 'Home', href: '/' },
                { label: 'Past Papers', href: '/past-papers' },
                breadcrumbData.roleLabel && { 
                  label: breadcrumbData.roleLabel, 
                  href: `/past-papers/${commission}/${department}/${role}` 
                },
                breadcrumbData.subcategoryLabel && { label: breadcrumbData.subcategoryLabel, href: '#' }
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

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Past Papers', href: '/past-papers' },
    breadcrumbData.roleLabel && { 
      label: breadcrumbData.roleLabel, 
      href: `/past-papers/${commission}/${department}/${role}` 
    },
    breadcrumbData.subcategoryLabel && { label: breadcrumbData.subcategoryLabel, href: '#' }
  ].filter(Boolean);

  return (
    <>
      <Navbar />
      {/* Display subcategories on page 1 */}
      {currentPage === 1 && subcategoriesTree && subcategoriesTree.length > 0 && (
        <div className="bg-gray-100">
          <div className="max-w-screen-xl mx-auto px-4 py-8">
            <SubcategoriesSection 
              subject={`${commission}/${department}/${role}${subcategoryPath.length > 0 ? '/' + subcategoryPath.join('/') : ''}`}
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
        categoryPath={subcategoryPath.length > 0 
          ? `${commission}/${department}/${role}/${subcategoryPath.join('/')}`
          : `${commission}/${department}/${role}`}
        breadcrumbItems={breadcrumbItems}
      />
      <Footer />
    </>
  );
}

