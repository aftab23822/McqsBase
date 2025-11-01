"use client";

import React from 'react';
import Link from 'next/link';
import { Home, BookOpen, FileText, Users, Award, Search } from 'lucide-react';

const Sitemap = () => {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Sitemap</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Navigate through our comprehensive collection of MCQs, past papers, interview materials, and mock tests. 
              Find everything you need for your competitive exam preparation.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          
          {/* Main Pages */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-6">
              <Home className="w-6 h-6 text-blue-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">Main Pages</h2>
            </div>
            <ul className="space-y-3">
              <li>
                <Link 
                  href="/" 
                  className="text-gray-700 hover:text-blue-600 transition-colors duration-300 flex items-center group"
                >
                  <span className="w-2 h-2 bg-blue-400 rounded-full mr-3 group-hover:scale-150 transition-transform"></span>
                  Home
                </Link>
              </li>
              <li>
                <Link 
                  href="/submit-mcqs" 
                  className="text-gray-700 hover:text-blue-600 transition-colors duration-300 flex items-center group"
                >
                  <span className="w-2 h-2 bg-blue-400 rounded-full mr-3 group-hover:scale-150 transition-transform"></span>
                  Submit MCQs
                </Link>
              </li>
              <li>
                <Link 
                  href="/contact" 
                  className="text-gray-700 hover:text-blue-600 transition-colors duration-300 flex items-center group"
                >
                  <span className="w-2 h-2 bg-blue-400 rounded-full mr-3 group-hover:scale-150 transition-transform"></span>
                  Contact Us
                </Link>
              </li>
              <li>
                <Link 
                  href="/privacy-policy" 
                  className="text-gray-700 hover:text-blue-600 transition-colors duration-300 flex items-center group"
                >
                  <span className="w-2 h-2 bg-blue-400 rounded-full mr-3 group-hover:scale-150 transition-transform"></span>
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link 
                  href="/terms-of-service" 
                  className="text-gray-700 hover:text-blue-600 transition-colors duration-300 flex items-center group"
                >
                  <span className="w-2 h-2 bg-blue-400 rounded-full mr-3 group-hover:scale-150 transition-transform"></span>
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* MCQ Categories */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-6">
              <BookOpen className="w-6 h-6 text-green-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">MCQ Categories</h2>
            </div>
            <ul className="space-y-3">
              <li>
                <Link 
                  href="/mcqs/accounting" 
                  className="text-gray-700 hover:text-green-600 transition-colors duration-300 flex items-center group"
                >
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-3 group-hover:scale-150 transition-transform"></span>
                  Accounting
                </Link>
              </li>
              <li>
                <Link 
                  href="/mcqs/biology" 
                  className="text-gray-700 hover:text-green-600 transition-colors duration-300 flex items-center group"
                >
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-3 group-hover:scale-150 transition-transform"></span>
                  Biology
                </Link>
              </li>
              <li>
                <Link 
                  href="/mcqs/chemistry" 
                  className="text-gray-700 hover:text-green-600 transition-colors duration-300 flex items-center group"
                >
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-3 group-hover:scale-150 transition-transform"></span>
                  Chemistry
                </Link>
              </li>
              <li>
                <Link 
                  href="/mcqs/computer-science" 
                  className="text-gray-700 hover:text-green-600 transition-colors duration-300 flex items-center group"
                >
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-3 group-hover:scale-150 transition-transform"></span>
                  Computer Science
                </Link>
              </li>
              <li>
                <Link 
                  href="/mcqs/economics" 
                  className="text-gray-700 hover:text-green-600 transition-colors duration-300 flex items-center group"
                >
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-3 group-hover:scale-150 transition-transform"></span>
                  Economics
                </Link>
              </li>
              <li>
                <Link 
                  href="/mcqs/english" 
                  className="text-gray-700 hover:text-green-600 transition-colors duration-300 flex items-center group"
                >
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-3 group-hover:scale-150 transition-transform"></span>
                  English
                </Link>
              </li>
              <li>
                <Link 
                  href="/mcqs/mathematics" 
                  className="text-gray-700 hover:text-green-600 transition-colors duration-300 flex items-center group"
                >
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-3 group-hover:scale-150 transition-transform"></span>
                  Mathematics
                </Link>
              </li>
              <li>
                <Link 
                  href="/mcqs/physics" 
                  className="text-gray-700 hover:text-green-600 transition-colors duration-300 flex items-center group"
                >
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-3 group-hover:scale-150 transition-transform"></span>
                  Physics
                </Link>
              </li>
            </ul>
          </div>

          {/* Practice & Quiz */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-6">
              <Search className="w-6 h-6 text-purple-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">Practice & Quiz</h2>
            </div>
            <ul className="space-y-3">
              <li>
                <Link 
                  href="/quiz" 
                  className="text-gray-700 hover:text-purple-600 transition-colors duration-300 flex items-center group"
                >
                  <span className="w-2 h-2 bg-purple-400 rounded-full mr-3 group-hover:scale-150 transition-transform"></span>
                  Practice Quiz
                </Link>
              </li>
              <li>
                <Link 
                  href="/quiz/accounting" 
                  className="text-gray-700 hover:text-purple-600 transition-colors duration-300 flex items-center group"
                >
                  <span className="w-2 h-2 bg-purple-400 rounded-full mr-3 group-hover:scale-150 transition-transform"></span>
                  Accounting Quiz
                </Link>
              </li>
              <li>
                <Link 
                  href="/quiz/biology" 
                  className="text-gray-700 hover:text-purple-600 transition-colors duration-300 flex items-center group"
                >
                  <span className="w-2 h-2 bg-purple-400 rounded-full mr-3 group-hover:scale-150 transition-transform"></span>
                  Biology Quiz
                </Link>
              </li>
              <li>
                <Link 
                  href="/quiz/chemistry" 
                  className="text-gray-700 hover:text-purple-600 transition-colors duration-300 flex items-center group"
                >
                  <span className="w-2 h-2 bg-purple-400 rounded-full mr-3 group-hover:scale-150 transition-transform"></span>
                  Chemistry Quiz
                </Link>
              </li>
              <li>
                <Link 
                  href="/quiz/computer-science" 
                  className="text-gray-700 hover:text-purple-600 transition-colors duration-300 flex items-center group"
                >
                  <span className="w-2 h-2 bg-purple-400 rounded-full mr-3 group-hover:scale-150 transition-transform"></span>
                  Computer Science Quiz
                </Link>
              </li>
            </ul>
          </div>

          {/* Past Papers */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-6">
              <FileText className="w-6 h-6 text-orange-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">Past Papers</h2>
            </div>
            <ul className="space-y-3">
              <li>
                <Link 
                  href="/past-papers" 
                  className="text-gray-700 hover:text-orange-600 transition-colors duration-300 flex items-center group"
                >
                  <span className="w-2 h-2 bg-orange-400 rounded-full mr-3 group-hover:scale-150 transition-transform"></span>
                  All Past Papers
                </Link>
              </li>
              <li>
                <Link 
                  href="/past-papers/fpsc" 
                  className="text-gray-700 hover:text-orange-600 transition-colors duration-300 flex items-center group"
                >
                  <span className="w-2 h-2 bg-orange-400 rounded-full mr-3 group-hover:scale-150 transition-transform"></span>
                  FPSC Past Papers
                </Link>
              </li>
              <li>
                <Link 
                  href="/past-papers/spsc" 
                  className="text-gray-700 hover:text-orange-600 transition-colors duration-300 flex items-center group"
                >
                  <span className="w-2 h-2 bg-orange-400 rounded-full mr-3 group-hover:scale-150 transition-transform"></span>
                  SPSC Past Papers
                </Link>
              </li>
              <li>
                <Link 
                  href="/past-papers/nts" 
                  className="text-gray-700 hover:text-orange-600 transition-colors duration-300 flex items-center group"
                >
                  <span className="w-2 h-2 bg-orange-400 rounded-full mr-3 group-hover:scale-150 transition-transform"></span>
                  NTS Past Papers
                </Link>
              </li>
              <li>
                <Link 
                  href="/past-papers/ppsc" 
                  className="text-gray-700 hover:text-orange-600 transition-colors duration-300 flex items-center group"
                >
                  <span className="w-2 h-2 bg-orange-400 rounded-full mr-3 group-hover:scale-150 transition-transform"></span>
                  PPSC Past Papers
                </Link>
              </li>
            </ul>
          </div>

          {/* Past Interviews */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-6">
              <Users className="w-6 h-6 text-indigo-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">Past Interviews</h2>
            </div>
            <ul className="space-y-3">
              <li>
                <Link 
                  href="/past-interviews" 
                  className="text-gray-700 hover:text-indigo-600 transition-colors duration-300 flex items-center group"
                >
                  <span className="w-2 h-2 bg-indigo-400 rounded-full mr-3 group-hover:scale-150 transition-transform"></span>
                  All Past Interviews
                </Link>
              </li>
              <li>
                <Link 
                  href="/past-interviews/fpsc" 
                  className="text-gray-700 hover:text-indigo-600 transition-colors duration-300 flex items-center group"
                >
                  <span className="w-2 h-2 bg-indigo-400 rounded-full mr-3 group-hover:scale-150 transition-transform"></span>
                  FPSC Interviews
                </Link>
              </li>
              <li>
                <Link 
                  href="/past-interviews/spsc" 
                  className="text-gray-700 hover:text-indigo-600 transition-colors duration-300 flex items-center group"
                >
                  <span className="w-2 h-2 bg-indigo-400 rounded-full mr-3 group-hover:scale-150 transition-transform"></span>
                  SPSC Interviews
                </Link>
              </li>
              <li>
                <Link 
                  href="/past-interviews/nts" 
                  className="text-gray-700 hover:text-indigo-600 transition-colors duration-300 flex items-center group"
                >
                  <span className="w-2 h-2 bg-indigo-400 rounded-full mr-3 group-hover:scale-150 transition-transform"></span>
                  NTS Interviews
                </Link>
              </li>
              <li>
                <Link 
                  href="/past-interviews/ppsc" 
                  className="text-gray-700 hover:text-indigo-600 transition-colors duration-300 flex items-center group"
                >
                  <span className="w-2 h-2 bg-indigo-400 rounded-full mr-3 group-hover:scale-150 transition-transform"></span>
                  PPSC Interviews
                </Link>
              </li>
            </ul>
          </div>

          {/* Mock Tests */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-6">
              <FileText className="w-6 h-6 text-purple-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">Mock Tests</h2>
            </div>
            <ul className="space-y-3">
              <li>
                <Link 
                  href="/mock-tests" 
                  className="text-gray-700 hover:text-purple-600 transition-colors duration-300 flex items-center group"
                >
                  <span className="w-2 h-2 bg-purple-400 rounded-full mr-3 group-hover:scale-150 transition-transform"></span>
                  All Mock Tests
                </Link>
              </li>
              <li>
                <Link 
                  href="/mock-tests/universities" 
                  className="text-gray-700 hover:text-purple-600 transition-colors duration-300 flex items-center group"
                >
                  <span className="w-2 h-2 bg-purple-400 rounded-full mr-3 group-hover:scale-150 transition-transform"></span>
                  University Mock Tests
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-6">
              <Award className="w-6 h-6 text-red-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">Resources</h2>
            </div>
            <ul className="space-y-3">
              <li>
                <Link 
                  href="/coming-soon" 
                  className="text-gray-700 hover:text-red-600 transition-colors duration-300 flex items-center group"
                >
                  <span className="w-2 h-2 bg-red-400 rounded-full mr-3 group-hover:scale-150 transition-transform"></span>
                  Study Materials
                </Link>
              </li>
              <li>
                <Link 
                  href="/coming-soon" 
                  className="text-gray-700 hover:text-red-600 transition-colors duration-300 flex items-center group"
                >
                  <span className="w-2 h-2 bg-red-400 rounded-full mr-3 group-hover:scale-150 transition-transform"></span>
                  Exam Schedule
                </Link>
              </li>
              <li>
                <Link 
                  href="/coming-soon" 
                  className="text-gray-700 hover:text-red-600 transition-colors duration-300 flex items-center group"
                >
                  <span className="w-2 h-2 bg-red-400 rounded-full mr-3 group-hover:scale-150 transition-transform"></span>
                  Career Guidance
                </Link>
              </li>
              <li>
                <Link 
                  href="/coming-soon" 
                  className="text-gray-700 hover:text-red-600 transition-colors duration-300 flex items-center group"
                >
                  <span className="w-2 h-2 bg-red-400 rounded-full mr-3 group-hover:scale-150 transition-transform"></span>
                  Success Stories
                </Link>
              </li>
              <li>
                <Link 
                  href="/coming-soon" 
                  className="text-gray-700 hover:text-red-600 transition-colors duration-300 flex items-center group"
                >
                  <span className="w-2 h-2 bg-red-400 rounded-full mr-3 group-hover:scale-150 transition-transform"></span>
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-12 bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Site Information</h2>
            <p className="text-gray-600 max-w-3xl mx-auto">
              McqsBase is your comprehensive platform for competitive exam preparation. 
              We provide thousands of MCQs, past papers, interview materials, and mock tests to help you succeed.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">MCQ Categories</h3>
              <p className="text-gray-600">Comprehensive collection of MCQs across various subjects</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Past Papers</h3>
              <p className="text-gray-600">Historical exam papers from various competitive bodies</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Interview Prep</h3>
              <p className="text-gray-600">Past interview questions and preparation materials</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="bg-gray-50 border-t">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <p className="text-gray-600">
            Last updated: {new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            &copy; {currentYear} McqsBase. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Sitemap;