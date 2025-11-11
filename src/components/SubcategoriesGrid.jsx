'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

function humanizeSlug(slug) {
  if (!slug || typeof slug !== 'string') return '';
  const cleaned = slug.replace(/-+/g, '-').replace(/^-+|-+$/g, '');
  return cleaned
    .split('-')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function Card({ index, title, href, description, count, disableInteractions = false }) {
  const cardContent = (
    <div className="group block rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded-full bg-indigo-600 text-white flex-shrink-0">
            {index}
          </span>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 truncate">
            {title}
          </h3>
        </div>
        {typeof count === 'number' && count > 0 ? (
          <span className="inline-flex items-center rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 text-xs font-medium border border-indigo-100 dark:border-indigo-900">
            {count} {count === 1 ? 'Topic' : 'Topics'}
          </span>
        ) : null}
      </div>
      {description ? (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{description}</p>
      ) : null}
    </div>
  );

  if (disableInteractions) {
    return (
      <div className="opacity-60 blur-[0.3px] pointer-events-none select-none">
        {cardContent}
      </div>
    );
  }

  return (
    <Link href={href}>
      {cardContent}
    </Link>
  );
}

function useNumCols() {
  const [cols, setCols] = useState(1);
  useEffect(() => {
    const update = () => {
      if (typeof window === 'undefined') return;
      // Tailwind breakpoints: sm: 640px, lg: 1024px
      const isLg = window.matchMedia('(min-width: 1024px)').matches;
      const isSm = window.matchMedia('(min-width: 640px)').matches;
      setCols(isLg ? 3 : isSm ? 2 : 1);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return cols;
}

export default function SubcategoriesGrid({ subject, tree, initialLimit = 3, basePath = 'mcqs' }) {
  if (!Array.isArray(tree) || tree.length === 0) return null;
  const [expanded, setExpanded] = useState(false);
  const numCols = useNumCols();
  
  // Responsive visible items:
  // - Desktop (3 cols): show 3 (first row)
  // - Tablet (2 cols): show 2 (first row)
  // - Mobile (1 col): show 3 items
  const collapsedLimit = numCols === 3 ? 3 : numCols === 2 ? 2 : Math.max(1, Number(initialLimit) || 3);
  const limit = expanded ? tree.length : collapsedLimit;

  // Responsive preview items:
  // - Desktop (3 cols): preview 3 (next row)
  // - Tablet (2 cols): preview 2
  // - Mobile (1 col): preview 1
  const previewCount = expanded ? 0 : (numCols === 3 ? 3 : numCols === 2 ? 2 : 1);

  const items = useMemo(() => {
    if (expanded) return tree;
    return tree.slice(0, limit);
  }, [expanded, tree, limit]);

  const remaining = Math.max(0, tree.length - items.length);
  const previews = !expanded ? tree.slice(limit, limit + previewCount) : [];

  // Render top-level subcategories as cards; if a node has children, show count
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 my-8">
      <div className="mb-4">
        <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
          Explore {humanizeSlug(subject)} topics
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Pick a topic to continue.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((node, idx) => {
          const slugPath = node.fullSlug || node.slug;
          const fullPath = slugPath ? `${subject}/${slugPath}` : subject;
          const href = `/${basePath}/${fullPath}`;
          const childrenCount = Array.isArray(node.children) ? node.children.length : 0;
          const title = humanizeSlug(node.name || node.slug);
          const description = childrenCount > 0 ? 'Includes nested sub-topics' : '';
          return (
            <Card
              key={node._id}
              index={idx + 1}
              title={title}
              href={href}
              description={description}
              count={childrenCount}
            />
          );
        })}
      </div>
      {!expanded && previews.length > 0 ? (
        <div className="relative mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {previews.map((node, idx) => {
              const slugPath = node.fullSlug || node.slug;
              const fullPath = slugPath ? `${subject}/${slugPath}` : subject;
              const href = `/${basePath}/${fullPath}`;
              const childrenCount = Array.isArray(node.children) ? node.children.length : 0;
              const title = humanizeSlug(node.name || node.slug);
              return (
                <Card
                  key={node._id}
                  index={limit + idx + 1}
                  title={title}
                  href={href}
                  description={childrenCount > 0 ? 'Includes nested sub-topics' : ''}
                  count={childrenCount}
                  disableInteractions
                />
              );
            })}
          </div>
          <div className="absolute inset-0 flex items-end justify-center pb-2 bg-gradient-to-b from-transparent via-white/30 to-white dark:via-gray-900/30 dark:to-gray-900 rounded-xl pointer-events-none" />
          <div className="flex justify-center -mt-10 relative z-10">
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 dark:text-indigo-200 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:border-indigo-900 shadow-sm"
            >
              Show {remaining} more
            </button>
          </div>
        </div>
      ) : null}
      {expanded && tree.length > collapsedLimit ? (
        <div className="flex justify-center mt-6">
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 dark:text-indigo-200 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:border-indigo-900"
          >
            Show less
          </button>
        </div>
      ) : null}
    </section>
  );
}


