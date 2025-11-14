"use client";

import React from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { generateQuestionSlug } from '../../lib/utils/slugGenerator.js';
import McqCard from './McqCard';

const IndividualQuestion = ({
  question,
  subject,
  categoryName,
  nextQuestionId,
  prevQuestionId,
  subjectPath
}) => {
  const questionToDisplay = question;
  const subjectLink = subjectPath && subjectPath.length > 0 ? subjectPath : subject;
  
  // Determine base path (mcqs or past-papers)
  const isPastPaper = subject === 'past-papers' || (subjectPath && subjectPath.startsWith('past-papers'));
  const basePath = isPastPaper ? 'past-papers' : 'mcqs';
  const sectionName = isPastPaper ? 'Past Papers' : 'MCQs';
  const backText = isPastPaper ? `Back to ${categoryName}` : `Back to ${categoryName} MCQs`;

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
        <Link
          href={`/${basePath}/${subjectLink}`}
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {backText}
        </Link>

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
            <Link
              href={`/${basePath}/${subjectLink}`}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              View All {categoryName} {sectionName}
            </Link>
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

