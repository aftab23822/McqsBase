"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { generateQuestionSlug } from '../../lib/utils/slugGenerator.js';
import McqCard from './McqCard';

const IndividualQuestion = ({
  question,
  subject,
  categoryName,
  nextQuestionId,
  prevQuestionId,
  subjectPath,
  introText
}) => {
  const router = useRouter();
  const questionToDisplay = question;
  const subjectLink = subjectPath && subjectPath.length > 0 ? subjectPath : subject;
  
  // Determine base path (mcqs or past-papers)
  const isPastPaper = subject === 'past-papers' || (subjectPath && subjectPath.startsWith('past-papers'));
  const basePath = isPastPaper ? 'past-papers' : 'mcqs';
  const sectionName = isPastPaper ? 'Past Papers' : 'MCQs';
  const backText = isPastPaper ? `Back to ${categoryName}` : `Back to ${categoryName} MCQs`;
  
  // Get stored page number from sessionStorage if available - initialize immediately to avoid flash
  const getInitialBackUrl = () => {
    if (typeof window === 'undefined') {
      return `/${basePath}/${subjectLink}`;
    }
    
    const storageKey = isPastPaper ? 'pastPapersReturnPage' : 'mcqsReturnPage';
    const categoryKey = isPastPaper ? 'pastPapersReturnCategory' : 'mcqsReturnCategory';
    
    const storedPage = sessionStorage.getItem(storageKey);
    const storedCategory = sessionStorage.getItem(categoryKey);
    
    // Only use stored page if it's for the same category
    if (storedPage && storedCategory && storedCategory === subjectLink) {
      const page = parseInt(storedPage, 10);
      if (page > 1) {
        // Remove trailing slash before adding query parameter
        const cleanPath = `/${basePath}/${subjectLink}`.replace(/\/$/, '');
        return `${cleanPath}?page=${page}`;
      }
    }
    
    // Default to page 1 if no stored page or different category - remove trailing slash for consistency
    return `/${basePath}/${subjectLink}`.replace(/\/$/, '');
  };
  
  const [backUrl] = useState(getInitialBackUrl);
  
  // Handle navigation to preserve URL format (no trailing slash before query params)
  const handleBackClick = (e) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      // Use window.location to navigate directly to the exact URL we want
      // This ensures no trailing slash is added by Next.js
      window.location.href = backUrl;
    }
  };

  if (!questionToDisplay) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Question Not Found</h1>
          <p className="text-gray-600 mb-6">The requested question could not be found.</p>
          <Link href={`/${basePath}/${subjectLink}`} className="text-blue-600 hover:underline">
            ← {backText}
          </Link>
        </div>
      </div>
    );
  }

  const currentSlug = generateQuestionSlug(questionToDisplay.question, questionToDisplay._id.toString());
  // For next/prev, use the ID directly - the API route can handle ID resolution
  const nextSlug = nextQuestionId || null;
  const prevSlug = prevQuestionId || null;

  return (
    <section className="min-h-screen px-4 py-8 bg-gray-100">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb Navigation */}
        <nav className="mb-6 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <Link href="/" className="hover:text-blue-600">Home</Link>
            <span>/</span>
            <Link href={`/${basePath}`} className="hover:text-blue-600">{sectionName}</Link>
            <span>/</span>
            <Link href={`/${basePath}/${subjectLink}`} className="hover:text-blue-600">{categoryName}</Link>
            <span>/</span>
            <span className="text-gray-800">Question</span>
          </div>
        </nav>

        {/* Back to Category Link */}
        <a
          href={backUrl}
          onClick={handleBackClick}
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {backText}
        </a>

        {introText ? (
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6 text-blue-900">
            <p className="text-base leading-relaxed">{introText}</p>
          </div>
        ) : null}

        {/* Question Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <McqCard
            question={questionToDisplay.question}
            options={questionToDisplay.options}
            correctAnswer={questionToDisplay.answer}
            explanation={questionToDisplay.explanation}
            submittedBy={questionToDisplay.submittedBy || 'Anonymous'}
            questionNumber={1}
            subject={categoryName}
          />
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            How to Study This {categoryName} Question
          </h2>
          <div className="space-y-3 text-gray-700 leading-relaxed">
            <p>
              This question belongs to the {categoryName} preparation set on McqsBase. Read the question carefully,
              compare every option, and focus on why the correct answer is better than the distractors. This method
              improves recall and helps you handle similar MCQs in FPSC, SPSC, PPSC, NTS, CSS, PMS, and university
              entry tests.
            </p>
            <p>
              For stronger preparation, revise the related topic after solving the MCQ, then attempt more questions
              from the same category. Repeated practice builds speed, accuracy, and confidence for one-paper exams
              where small wording differences can change the answer.
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Link
              href={`/${basePath}/${subjectLink}`}
              className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-100"
            >
              More {categoryName} Questions
            </Link>
            <Link
              href="/blog"
              className="rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
            >
              Exam Preparation Guides
            </Link>
            <Link
              href="/past-papers"
              className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
            >
              Practice Past Papers
            </Link>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center bg-white rounded-lg shadow-md p-4">
          <div className="flex-1">
            {prevQuestionId ? (
              <Link
                href={`/${basePath}/${subjectLink}/question/${prevSlug}`}
                className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 mr-2" />
                Previous Question
              </Link>
            ) : (
              <span className="inline-flex items-center px-4 py-2 text-gray-400 cursor-not-allowed">
                <ChevronLeft className="w-5 h-5 mr-2" />
                Previous Question
              </span>
            )}
          </div>

          <div className="flex-1 text-center">
            <a
              href={backUrl}
              onClick={handleBackClick}
              className="text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
            >
              View All {categoryName} {sectionName}
            </a>
          </div>

          <div className="flex-1 text-right">
            {nextQuestionId ? (
              <Link
                href={`/${basePath}/${subjectLink}/question/${nextSlug}`}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors ml-auto"
              >
                Next Question
                <ChevronRight className="w-5 h-5 ml-2" />
              </Link>
            ) : (
              <span className="inline-flex items-center px-4 py-2 text-gray-400 cursor-not-allowed ml-auto">
                Next Question
                <ChevronRight className="w-5 h-5 ml-2" />
              </span>
            )}
          </div>
        </div>

        {/* Share Section */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Share this Question</h3>
          <div className="flex items-center space-x-4">
            <input
              type="text"
              readOnly
              value={`${typeof window !== 'undefined' ? window.location.origin : ''}/${basePath}/${subjectLink}/question/${currentSlug}`}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => {
                const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/${basePath}/${subjectLink}/question/${currentSlug}`;
                navigator.clipboard.writeText(url);
                alert('Link copied to clipboard!');
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Copy Link
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default IndividualQuestion;
