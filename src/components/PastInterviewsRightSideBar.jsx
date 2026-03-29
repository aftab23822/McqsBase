'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useCategoryStructure } from '../hooks/useCategoryStructure';
import { getLucideIconByName } from '../../lib/utils/lucideIconByName';

const PastInterviewsRightSideBar = () => {
  const { data, loading, error } = useCategoryStructure('past-interviews');

  const pastInterviewCategories = useMemo(() => {
    const commissions = data?.commissions;
    if (!commissions?.length) return [];
    return commissions.map((c) => ({
      ...c,
      icon: getLucideIconByName(c.icon),
    }));
  }, [data]);

  if (loading) {
    return (
      <div className="col-span-1 p-5 border-l bg-white rounded-xl shadow-xl space-y-4">
        <h3 className="text-2xl font-bold text-gray-800 border-b pb-2">Past Interviews</h3>
        <p className="text-gray-500 text-sm">Loading categories…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="col-span-1 p-5 border-l bg-white rounded-xl shadow-xl space-y-4">
        <h3 className="text-2xl font-bold text-gray-800 border-b pb-2">Past Interviews</h3>
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="col-span-1 p-5 border-l bg-white rounded-xl shadow-xl space-y-4">
      <h3 className="text-2xl font-bold text-gray-800 border-b pb-2">Past Interviews</h3>

      {pastInterviewCategories.map((cat, idx) => (
        <div key={idx} className="space-y-2">
          <div className="flex items-center gap-2 text-lg font-semibold text-indigo-600 mt-4">
            <cat.icon size={20} />
            {cat.title}
          </div>

          {cat.departments.map((dept, i) => (
            <div
              key={i}
              className="bg-gray-50 p-3 rounded-lg shadow-sm hover:shadow-md transition-all"
            >
              <div className="font-medium text-gray-700 mb-1">
                {dept.link ? (
                  <Link href={dept.link} className="hover:text-indigo-500 transition-colors">
                    {dept.label}
                  </Link>
                ) : (
                  dept.label
                )}
              </div>
              {dept.roles && dept.roles.length > 0 && (
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  {dept.roles.map((role, j) => (
                    <li key={j}>
                      <Link href={role.link} className="hover:text-indigo-500 transition-colors">
                        {role.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default PastInterviewsRightSideBar;
