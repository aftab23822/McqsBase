"use client";

import React from 'react';
import Link from 'next/link';
import { 
  BookOpen, 
  Clock, 
  Target, 
  Brain, 
  CheckCircle, 
  ArrowRight,
  Calendar,
  TrendingUp,
  Users,
  Award,
  FileText,
  Zap
} from 'lucide-react';

const StudyGuides = () => {
  const guides = [
    {
      title: "Complete Guide to FPSC CSS Exam Preparation",
      description: "A comprehensive guide covering syllabus, exam pattern, preparation strategy, and tips for the Federal Public Service Commission CSS examination.",
      category: "FPSC",
      readTime: "15 min read",
      icon: <BookOpen className="w-6 h-6" />,
      slug: "fpsc-css-exam-preparation-guide"
    },
    {
      title: "SPSC Lecturer Exam: Step-by-Step Preparation Plan",
      description: "Everything you need to know about the Sindh Public Service Commission Lecturer exam, including subject-wise preparation tips and interview strategies.",
      category: "SPSC",
      readTime: "12 min read",
      icon: <Target className="w-6 h-6" />,
      slug: "spsc-lecturer-exam-preparation"
    },
    {
      title: "PPSC Inspector Exam: Complete Study Guide",
      description: "Detailed preparation guide for Punjab Public Service Commission Inspector examination with tips on written test and interview preparation.",
      category: "PPSC",
      readTime: "14 min read",
      icon: <Brain className="w-6 h-6" />,
      slug: "ppsc-inspector-exam-study-guide"
    },
    {
      title: "NTS Test Preparation: Ultimate Strategy Guide",
      description: "Master the National Testing Service exams with our comprehensive guide covering test format, time management, and subject-wise preparation strategies.",
      category: "NTS",
      readTime: "10 min read",
      icon: <Zap className="w-6 h-6" />,
      slug: "nts-test-preparation-strategy"
    },
    {
      title: "Effective Time Management for Competitive Exams",
      description: "Learn proven techniques to manage your study time effectively, create study schedules, and balance preparation with daily responsibilities.",
      category: "General",
      readTime: "8 min read",
      icon: <Clock className="w-6 h-6" />,
      slug: "time-management-competitive-exams"
    },
    {
      title: "How to Prepare for Competitive Exam Interviews",
      description: "Complete guide to interview preparation including common questions, presentation skills, and tips for success in competitive exam interviews.",
      category: "Interview",
      readTime: "11 min read",
      icon: <Users className="w-6 h-6" />,
      slug: "competitive-exam-interview-preparation"
    },
    {
      title: "Subject-Wise Preparation Tips for General Knowledge",
      description: "Comprehensive strategies for mastering General Knowledge MCQs covering Pakistan Studies, Islamic Studies, World Affairs, and Current Affairs.",
      category: "General Knowledge",
      readTime: "9 min read",
      icon: <FileText className="w-6 h-6" />,
      slug: "general-knowledge-preparation-tips"
    },
    {
      title: "Mastering Everyday Science MCQs",
      description: "Detailed guide to understanding and solving Everyday Science questions with key topics, important concepts, and practice strategies.",
      category: "Everyday Science",
      readTime: "7 min read",
      icon: <Brain className="w-6 h-6" />,
      slug: "everyday-science-mcqs-guide"
    }
  ];

  const tips = [
    {
      title: "Start Early",
      description: "Begin your preparation at least 6-8 months before the exam date to have sufficient time for comprehensive coverage.",
      icon: <Calendar className="w-5 h-5" />
    },
    {
      title: "Practice Regularly",
      description: "Solve MCQs daily and take mock tests weekly to build confidence and identify weak areas.",
      icon: <CheckCircle className="w-5 h-5" />
    },
    {
      title: "Focus on Weak Areas",
      description: "Identify subjects where you struggle and allocate more time to improve them systematically.",
      icon: <Target className="w-5 h-5" />
    },
    {
      title: "Review Past Papers",
      description: "Study previous years' papers to understand exam patterns and frequently asked topics.",
      icon: <FileText className="w-5 h-5" />
    },
    {
      title: "Stay Updated",
      description: "Keep yourself informed about current affairs and latest developments in your field of interest.",
      icon: <TrendingUp className="w-5 h-5" />
    },
    {
      title: "Maintain Health",
      description: "Eat well, exercise regularly, and get adequate sleep to maintain peak mental performance.",
      icon: <Award className="w-5 h-5" />
    }
  ];

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
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-purple-600 to-blue-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex items-center justify-center mb-6">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center">
                <BookOpen className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Study Guides & Preparation Tips
            </h1>
            <p className="text-xl lg:text-2xl text-blue-100 leading-relaxed">
              Comprehensive guides to help you excel in competitive examinations
            </p>
          </div>
        </div>
      </section>

      {/* Quick Tips Section */}
      <section className="py-12 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Quick Preparation Tips
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tips.map((tip, index) => (
              <div 
                key={index}
                className="flex items-start space-x-4 p-6 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-all duration-300"
              >
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white flex-shrink-0">
                  {tip.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">{tip.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{tip.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Study Guides Grid */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Comprehensive Study Guides
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Explore our detailed guides covering various competitive exams and preparation strategies
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {guides.map((guide, index) => (
              <Link 
                key={index}
                href={`/study-guides/${guide.slug}`}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group overflow-hidden"
              >
                <div className="p-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-14 h-14 bg-gradient-to-r ${getCategoryColor(guide.category)} rounded-lg flex items-center justify-center text-white`}>
                      {guide.icon}
                    </div>
                    <span className="text-sm font-medium text-gray-500">{guide.readTime}</span>
                  </div>
                  
                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 bg-gradient-to-r ${getCategoryColor(guide.category)} text-white`}>
                    {guide.category}
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300 leading-tight">
                    {guide.title}
                  </h3>
                  
                  <p className="text-gray-600 leading-relaxed mb-6">
                    {guide.description}
                  </p>
                  
                  <div className="flex items-center text-blue-600 font-semibold group-hover:text-blue-700">
                    <span>Read Guide</span>
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Start Your Preparation?
          </h2>
          <p className="text-xl text-blue-100 mb-8 leading-relaxed">
            Access thousands of MCQs, past papers, and practice tests to complement your study guides
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/mcqs"
              className="bg-white text-blue-600 hover:bg-gray-100 font-semibold px-8 py-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 group"
            >
              <span>Browse MCQs</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
            <Link 
              href="/past-papers"
              className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-600 font-semibold px-8 py-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 group"
            >
              <span>View Past Papers</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default StudyGuides;
