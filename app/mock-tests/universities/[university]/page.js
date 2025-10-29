"use client";

import { useEffect, useState } from 'react';
import Navbar from '../../../../src/components/Navbar'
import Footer from '../../../../src/components/Footer'
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
              <ul className="space-y-3">
                {tests.map((t) => (
                  <li key={t.slug} className="bg-white p-4 rounded-lg shadow flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{t.name}</div>
                      <div className="text-sm text-gray-500">Last updated: {new Date(t.updatedAt || t.lastUpdatedAt).toLocaleString()}</div>
                    </div>
                    <a href={`/mock-tests/universities/${university}/${t.slug}`} className="text-indigo-600 hover:text-indigo-800 font-medium">View</a>
                  </li>
                ))}
              </ul>
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


