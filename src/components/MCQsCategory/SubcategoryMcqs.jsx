"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import BaseMcqs from './BaseMcqs';
import LoadingSpinner from '../LoadingSpinner';
import { apiFetch } from '../../utils/api';
import { usePageFromUrl } from '../../hooks/usePageFromUrl';

const mcqsPerPage = 10;

function humanize(slug) {
  if (!slug || typeof slug !== 'string') return '';
  return slug
    .split('-')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function NavigationCard({ child, index, activeSlug }) {
  const label = humanize(child.name);
  const href = `/mcqs/${child.fullSlug}`;
  const isCurrent = Boolean(child.isCurrent);
  const isActive = Boolean(child.isActive) || child.fullSlug === activeSlug;

  const baseClasses =
    'group block rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-indigo-500';

  let stateClasses = '';
  if (isCurrent) {
    stateClasses = 'border-indigo-600 ring-1 ring-indigo-200 bg-indigo-50';
  } else if (isActive) {
    stateClasses = 'border-indigo-200 bg-indigo-50';
  }

  const badgeClasses = isCurrent
    ? 'bg-indigo-700 text-white'
    : 'bg-indigo-600 text-white group-hover:bg-indigo-700';

  const description = isCurrent
    ? 'You are viewing this topic.'
    : isActive
      ? 'Currently exploring this branch.'
      : '';

  return (
    <Link href={href} className={`${baseClasses} ${stateClasses}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className={`inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded-full ${badgeClasses}`}>
            {index}
          </span>
          <h3 className="text-base font-semibold text-gray-900 group-hover:text-indigo-600 truncate">
            {label}
          </h3>
        </div>
      </div>
      {description ? (
        <p className="mt-2 text-sm text-gray-600">{description}</p>
      ) : null}
    </Link>
  );
}

function CollapsiblePillSection({ level, title, defaultVisible = 3, activeSlug }) {
  const [expanded, setExpanded] = useState(false);
  const items = Array.isArray(level.children) ? level.children : [];
  if (items.length === 0) return null;

  const effectiveVisible = Math.max(1, defaultVisible);
  const visibleCount = expanded ? items.length : Math.min(items.length, effectiveVisible);
  const visibleItems = items.slice(0, visibleCount);
  const remaining = items.length - visibleItems.length;
  const previewItems = !expanded ? items.slice(visibleCount, visibleCount + Math.min(3, remaining)) : [];
  const levelHref = level.path ? `/mcqs/${level.path}` : null;
  const headerTitle = `Explore ${title} topics`;

  return (
    <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 sm:p-6">
      <div className="space-y-1 mb-5">
        <h2 className="text-xl font-bold text-gray-900">{headerTitle}</h2>
        <p className="text-sm text-gray-600">Pick a topic to continue.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleItems.map((child, idx) => (
          <NavigationCard
            key={child._id}
            child={child}
            index={idx + 1}
            activeSlug={activeSlug}
          />
        ))}
      </div>

      {!expanded && previewItems.length > 0 ? (
        <div className="relative mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pointer-events-none select-none">
            {previewItems.map((child, idx) => (
              <div key={child._id} className="opacity-60 blur-[0.3px]">
                <NavigationCard
                  child={child}
                  index={visibleCount + idx + 1}
                  activeSlug={activeSlug}
                />
              </div>
            ))}
          </div>
          <div className="absolute inset-0 flex items-end justify-center pb-2 bg-gradient-to-b from-transparent via-white/30 to-white rounded-xl pointer-events-none" />
          <div className="flex justify-center -mt-10 relative z-10">
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 shadow-sm transition-colors"
            >
              Show {remaining} more
            </button>
          </div>
        </div>
      ) : null}

      {expanded && items.length > defaultVisible ? (
        <div className="flex justify-center mt-4">
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors"
          >
            Show less
          </button>
        </div>
      ) : null}
    </section>
  );
}

function NavigationLevels({ levels = [], activeSlug }) {
  if (!Array.isArray(levels) || levels.length === 0) return null;

  const filteredLevels = levels.filter((_, index) => index !== 0);

  return (
    <div className="space-y-6 mb-6">
      {filteredLevels.map((level) => {
        const title = humanize(level.label);
        const childCount = Array.isArray(level.children) ? level.children.length : 0;
        const defaultVisible = Math.min(childCount || 1, 3);

        return (
          <CollapsiblePillSection
            key={level.id}
            level={level}
            title={title || 'Topics'}
            defaultVisible={defaultVisible}
            activeSlug={activeSlug}
          />
        );
      })}
    </div>
  );
}

export default function SubcategoryMcqs({ subject, subcategory, subcategorySegments, initialPage }) {
  const [mcqsData, setMcqsData] = useState([]);
  const [displayData, setDisplayData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPageChanging, setIsPageChanging] = useState(false);
  const [error, setError] = useState(null);
  const [navigationLevels, setNavigationLevels] = useState([]);

  const pageFromUrl = usePageFromUrl();
  const startingPage = Number.isFinite(initialPage) && initialPage > 0 ? initialPage : pageFromUrl;
  const [currentPage, setCurrentPage] = useState(startingPage);
  const [totalPages, setTotalPages] = useState(1);

  const segments = useMemo(() => {
    if (Array.isArray(subcategorySegments) && subcategorySegments.length > 0) {
      return subcategorySegments;
    }
    if (typeof subcategory === 'string' && subcategory.length > 0) {
      return subcategory.split('/').filter(Boolean);
    }
    return [];
  }, [subcategory, subcategorySegments]);

  const subPath = segments.join('/');

  const readablePath = segments.length > 0
    ? segments.map(humanize).join(' / ')
    : humanize(subcategory);
  const activeSlug = segments.length > 0 ? `${subject}/${segments.join('/')}` : subject;

  useEffect(() => {
    const nextPage = Number.isFinite(startingPage) && startingPage > 0 ? startingPage : 1;
    setCurrentPage(nextPage);
    setMcqsData([]);
    setDisplayData([]);
    setNavigationLevels([]);
  }, [startingPage, subPath]);

  useEffect(() => {
    let isCancelled = false;

    if (!subPath) {
      setError('Invalid subcategory');
      setLoading(false);
      setDisplayData([]);
      setNavigationLevels([]);
      return () => {};
    }

    if (mcqsData.length === 0) {
      setLoading(true);
      setDisplayData([]);
    } else {
      setIsPageChanging(true);
    }

    const fetchData = async () => {
      try {
        if (mcqsData.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        if (isCancelled) return;

        const res = await apiFetch(`/api/mcqs/${subject}/${subPath}?page=${currentPage}&limit=${mcqsPerPage}`);
        if (!res.ok) throw new Error('Network response was not ok');
        const data = await res.json();
        if (isCancelled) return;

        setMcqsData(data.results);
        setTotalPages(data.totalPages);
        setNavigationLevels(Array.isArray(data.navigation?.levels) ? data.navigation.levels : []);
        setLoading(false);

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setDisplayData(data.results);
            setTimeout(() => {
              if (!isCancelled) setIsPageChanging(false);
            }, 150);
          });
        });
      } catch (err) {
        if (!isCancelled) {
          setError(err.message);
          setLoading(false);
          setIsPageChanging(false);
          setDisplayData([]);
          setNavigationLevels([]);
        }
      }
    };

    fetchData();
    return () => { isCancelled = true; };
  }, [subject, subPath, currentPage]);

  useEffect(() => {
    if (mcqsData.length > 0 && displayData.length === 0 && !loading) {
      setDisplayData(mcqsData);
    }
  }, [mcqsData, displayData.length, loading]);

  if (loading && displayData.length === 0) return <LoadingSpinner />;
  if (error) return <div>Error: {error}</div>;

  const title = `${humanize(subject)} — ${readablePath}`;

  return (
    <div className="relative">
      <div className={isPageChanging ? 'opacity-60 pointer-events-none transition-opacity duration-300' : 'transition-opacity duration-300'}>
        <NavigationLevels levels={navigationLevels} activeSlug={activeSlug} />
        <BaseMcqs
          mcqsData={displayData}
          title={title}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalPages={totalPages}
          mcqsPerPage={mcqsPerPage}
          subjectSlug={segments.length > 0 ? [subject, ...segments].join('/') : subject}
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


