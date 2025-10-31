"use client";

import { useEffect, useState } from 'react';
import Navbar from '../../../../src/components/Navbar'
import Footer from '../../../../src/components/Footer'
import Link from 'next/link'
import MockTestsRightSideBar from '../../../../src/components/MockTestsRightSideBar'

export default function UniversityMockTestsPage({ params }) {
  const { university } = params;
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function getTests() {
      try {
        setLoading(true);
        setError('');
        const url = `/api/mock-tests/${university}/`;
        const res = await fetch(url, { 
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        const json = await res.json();
        setTests(json.data || []);
      } catch (err) {
        console.error('Error fetching mock tests:', err);
        setError(err.message);
        setTests([]);
      } finally {
        setLoading(false);
      }
    }
    
    getTests();
  }, [university]);

  return (
    <>
      <Navbar />
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-2">
            <h1 className="text-2xl font-bold mb-6">Mock Tests for {university.toUpperCase()}</h1>
            
            {loading && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p className="mt-2 text-gray-600">Loading mock tests...</p>
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800">Error: {error}</p>
              </div>
            )}
            
            {!loading && !error && tests.length === 0 && (
              <p className="text-gray-600">No mock tests available yet.</p>
            )}
            
            {!loading && !error && tests.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                {tests.map((t, idx) => (
                  <div key={t.slug} className="relative overflow-hidden bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 break-words whitespace-normal leading-relaxed" title={t.name}>{t.name}</h3>
                        <p className="text-sm text-indigo-600 mt-1 leading-relaxed">
                          SBBU SBA
                          {idx < 2 && (
                            <span className="ml-2 align-middle bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">NEW</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600 mt-3 leading-relaxed">
                      <span>⏱️ {t.durationMinutes} min</span>
                      <span>📝 {t.questionCount || t.questions?.length || 0} questions</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-3 leading-relaxed">Updated: {new Date(t.lastUpdatedAt || t.updatedAt).toLocaleDateString()}</div>
                    <div className="mt-auto pt-5">
                      <Link
                        href={`/mock-tests/universities/${university}/${t.slug}`}
                        prefetch
                        className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        Start Test →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Right Sidebar */}
          <div className="h-fit top-20">
            <MockTestsRightSideBar />
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}


