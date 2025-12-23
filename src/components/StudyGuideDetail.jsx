"use client";

import React from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Clock, 
  BookOpen, 
  CheckCircle, 
  FileText
} from 'lucide-react';

const StudyGuideDetail = ({ guide }) => {
  if (!guide) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Guide Not Found</h1>
          <Link href="/study-guides" className="text-blue-600 hover:text-blue-700">
            Back to Study Guides
          </Link>
        </div>
      </div>
    );
  }

  const getCategoryColor = (category) => {
    const colors = {
      'FPSC': 'from-blue-500 to-blue-600',
      'SPSC': 'from-green-500 to-green-600',
      'PPSC': 'from-purple-500 to-purple-600',
      'NTS': 'from-orange-500 to-orange-600',
      'General': 'from-gray-500 to-gray-600',
      'Interview': 'from-pink-500 to-pink-600',
      'General Knowledge': 'from-indigo-500 to-indigo-600',
      'Everyday Science': 'from-teal-500 to-teal-600'
    };
    return colors[category] || 'from-blue-500 to-blue-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <section className={`bg-gradient-to-r ${getCategoryColor(guide.category)} text-white py-16`}>
        <div className="max-w-4xl mx-auto px-4">
          <Link 
            href="/study-guides"
            className="inline-flex items-center text-white/90 hover:text-white mb-6 transition-colors duration-300"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Study Guides
          </Link>
          
          <div className="flex items-center space-x-4 mb-4">
            <span className="px-4 py-1 bg-white/20 backdrop-blur-lg rounded-full text-sm font-semibold">
              {guide.category}
            </span>
            <div className="flex items-center space-x-2 text-white/90">
              <Clock className="w-4 h-4" />
              <span>{guide.readTime}</span>
            </div>
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            {guide.title}
          </h1>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          {guide.content.sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-12">
              <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                  <div className={`w-10 h-10 bg-gradient-to-r ${getCategoryColor(guide.category)} rounded-lg flex items-center justify-center text-white mr-4`}>
                    {sectionIndex + 1}
                  </div>
                  {section.title}
                </h2>
                
                {section.content && (
                  <p className="text-lg text-gray-700 leading-relaxed mb-6">
                    {section.content}
                  </p>
                )}

                {section.subsections && section.subsections.map((subsection, subIndex) => (
                  <div key={subIndex} className="mb-6 pl-6 border-l-4 border-blue-500">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      {subsection.title}
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      {subsection.content}
                    </p>
                  </div>
                ))}

                {section.tips && (
                  <div className="mt-6 bg-blue-50 rounded-lg p-6 border border-blue-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      <CheckCircle className="w-6 h-6 text-blue-600 mr-2" />
                      Important Tips
                    </h3>
                    <ul className="space-y-3">
                      {section.tips.map((tip, tipIndex) => (
                        <li key={tipIndex} className="flex items-start space-x-3">
                          <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700 leading-relaxed">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Additional Resources */}
          <div className={`bg-gradient-to-r ${getCategoryColor(guide.category)} rounded-xl shadow-lg p-8 text-white mb-12`}>
            <h2 className="text-2xl font-bold mb-4">Ready to Start Practicing?</h2>
            <p className="text-white/90 mb-6 leading-relaxed">
              Put your knowledge into practice with our comprehensive collection of MCQs and past papers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="/mcqs"
                className="bg-white text-gray-900 hover:bg-gray-100 font-semibold px-6 py-3 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <BookOpen className="w-5 h-5" />
                <span>Practice MCQs</span>
              </Link>
              <Link 
                href="/past-papers"
                className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-gray-900 font-semibold px-6 py-3 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <FileText className="w-5 h-5" />
                <span>View Past Papers</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default StudyGuideDetail;
