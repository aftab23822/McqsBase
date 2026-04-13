"use client";

import React from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Clock, 
  BookOpen, 
  CheckCircle, 
  Calendar,
  FileText,
  Users
} from 'lucide-react';

const BlogArticleDetail = ({ article }) => {
  if (!article) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Article Not Found</h1>
          <Link href="/blog" className="text-blue-600 hover:text-blue-700">
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  const getCategoryColor = (category) => {
    const colors = {
      'Preparation Tips': 'from-blue-500 to-blue-600',
      'Subject Guide': 'from-green-500 to-green-600',
      'Exam Guide': 'from-purple-500 to-purple-600',
      'Interview Guide': 'from-pink-500 to-pink-600',
      'Study Skills': 'from-orange-500 to-orange-600',
      'Current Affairs': 'from-indigo-500 to-indigo-600',
      'CSS Guide': 'from-teal-500 to-teal-600'
    };
    return colors[article.category] || 'from-blue-500 to-blue-600';
  };

  const getSectionTables = (section) => {
    if (section.tables?.length) return section.tables;
    if (section.table) return [section.table];
    return [];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <section className={`bg-gradient-to-r ${getCategoryColor(article.category)} text-white py-16`}>
        <div className="max-w-4xl mx-auto px-4">
          <Link 
            href="/blog"
            className="inline-flex items-center text-white/90 hover:text-white mb-6 transition-colors duration-300"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Blog
          </Link>
          
          <div className="flex items-center space-x-4 mb-4">
            <span className="px-4 py-1 bg-white/20 backdrop-blur-lg rounded-full text-sm font-semibold">
              {article.category}
            </span>
            <div className="flex items-center space-x-2 text-white/90">
              <Calendar className="w-4 h-4" />
              <span>{article.date}</span>
            </div>
            <div className="flex items-center space-x-2 text-white/90">
              <Clock className="w-4 h-4" />
              <span>{article.readTime} read</span>
            </div>
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            {article.title}
          </h1>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          {article.content.sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-12">
              <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                  <div className={`w-10 h-10 bg-gradient-to-r ${getCategoryColor(article.category)} rounded-lg flex items-center justify-center text-white mr-4`}>
                    {sectionIndex + 1}
                  </div>
                  {section.title}
                </h2>
                
                {section.content && (
                  <p className="text-lg text-gray-700 leading-relaxed mb-6 whitespace-pre-line">
                    {section.content}
                  </p>
                )}

                {getSectionTables(section).map((tbl, tblIndex) => (
                  <div key={tblIndex} className="mb-6 overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                    {tbl.caption && (
                      <p className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-50 border-b border-gray-200">
                        {tbl.caption}
                      </p>
                    )}
                    <table className="min-w-full text-left text-sm text-gray-800 border-collapse">
                      <thead>
                        <tr className="bg-gradient-to-r from-slate-100 to-slate-50">
                          {tbl.headers.map((header, hi) => (
                            <th
                              key={hi}
                              scope="col"
                              className="border-b border-gray-200 px-4 py-3 font-semibold text-gray-900 whitespace-nowrap"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {tbl.rows.map((row, ri) => (
                          <tr
                            key={ri}
                            className={ri % 2 === 0 ? 'bg-white' : 'bg-slate-50/80'}
                          >
                            {row.map((cell, ci) => (
                              <td
                                key={ci}
                                className="border-b border-gray-100 px-4 py-3 align-top whitespace-pre-line"
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}

                {section.subsections && section.subsections.map((subsection, subIndex) => (
                  <div key={subIndex} className="mb-6 pl-6 border-l-4 border-blue-500">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      {subsection.title}
                    </h3>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {subsection.content}
                    </p>
                  </div>
                ))}

                {section.tips && (
                  <div className="mt-6 bg-blue-50 rounded-lg p-6 border border-blue-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      <CheckCircle className="w-6 h-6 text-blue-600 mr-2" />
                      Key Points
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
          <div className={`bg-gradient-to-r ${getCategoryColor(article.category)} rounded-xl shadow-lg p-8 text-white mb-12`}>
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

export default BlogArticleDetail;
