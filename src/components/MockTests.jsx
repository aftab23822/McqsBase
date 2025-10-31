"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import MockTestsRightSideBar from './MockTestsRightSideBar';
import { getUniversities } from '../utils/mockTestCategories';

const MockTests = () => {
  const [latestTests, setLatestTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchLatestTests() {
      try {
        setLoading(true);
        setError('');

        // Single fast API call for latest tests
        const res = await fetch(`/api/mock-tests?limit=6`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const { success, data } = await res.json();
        if (!success) throw new Error('API returned error');

        // Attach friendly university labels
        const uniBySlug = Object.fromEntries(getUniversities().map(u => [u.slug, u.label]));
        const enriched = (data || []).map(t => ({
          ...t,
          universityName: uniBySlug[t.universitySlug] || t.universitySlug,
          universitySlug: t.universitySlug
        }));

        setLatestTests(enriched);
      } catch (err) {
        console.error('Error fetching latest tests:', err);
        setError('Failed to load latest mock tests');
      } finally {
        setLoading(false);
      }
    }

    fetchLatestTests();
  }, []);

  return (
    <section className="full-screen px-4 py-8 bg-gray-100">
      <div className="max-w-screen-xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h1 className="text-3xl font-bold mb-4 text-center text-gray-800">
              Mock Tests
            </h1>
            <p className="text-gray-700 text-center mb-8">
              Practice with timed mock tests for various universities and competitive exams.
            </p>
            
            {/* Latest Mock Tests Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center">
                <span className="bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full text-sm font-semibold mr-3">
                  NEW
                </span>
                Latest Mock Tests
              </h2>
              
              {loading && (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  <p className="mt-2 text-gray-600">Loading latest tests...</p>
                </div>
              )}
              
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-red-800">{error}</p>
                </div>
              )}
              
              {!loading && !error && latestTests.length === 0 && (
                <p className="text-gray-600 text-center py-8">No mock tests available yet.</p>
              )}
              
              {!loading && !error && latestTests.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {latestTests.map((test, index) => (
                    <div key={`${test.universitySlug}-${test.slug}`} className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 mb-1">{test.name}</h3>
                          <p className="text-sm text-indigo-600 font-medium">{test.universityName}</p>
                        </div>
                        {index < 3 && (
                          <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                            HOT
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                        <span>⏱️ {test.durationMinutes} min</span>
                        <span>📝 {test.questionCount || test.questions?.length || 0} questions</span>
                      </div>
                      <div className="text-xs text-gray-500 mb-3">
                        Updated: {new Date(test.lastUpdatedAt || test.updatedAt).toLocaleDateString()}
                      </div>
                      <Link 
                        href={`/mock-tests/universities/${test.universitySlug}/${test.slug}`}
                        className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                        prefetch
                      >
                        Start Test →
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Instructions */}
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
              <h3 className="font-semibold text-blue-800 mb-2">How to Take Mock Tests</h3>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• Choose a university or category from the sidebar</li>
                <li>• Click on any mock test to start</li>
                <li>• Read instructions carefully before starting</li>
                <li>• Timer starts when you click "Start Test"</li>
                <li>• View your score and explanations after completion</li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Right Sidebar */}
        <div className="h-fit top-20">
          <MockTestsRightSideBar />
        </div>
      </div>
    </section>
  );
};

export default MockTests;


