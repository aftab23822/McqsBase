"use client";

import React from 'react';
import Link from 'next/link';
import { 
  BookOpen, 
  Calendar, 
  TrendingUp, 
  Users, 
  Target,
  ArrowRight,
  Clock,
  Award,
  Brain,
  FileText,
  CheckCircle
} from 'lucide-react';

const Blog = () => {
  const articles = [
    {
      title: "10 Essential Tips for Competitive Exam Success in Pakistan",
      excerpt: "Discover proven strategies and techniques that successful candidates use to ace competitive exams like FPSC, SPSC, PPSC, and NTS. Learn how to optimize your preparation and maximize your chances of success.",
      category: "Preparation Tips",
      date: "2024",
      readTime: "12 min",
      image: "success",
      slug: "10-essential-tips-competitive-exam-success"
    },
    {
      title: "How to Effectively Prepare for Pakistan Studies MCQs",
      excerpt: "A comprehensive guide covering key topics, important dates, and memorization techniques for Pakistan Studies. Perfect for CSS, PMS, and other competitive exams.",
      category: "Subject Guide",
      date: "2024",
      readTime: "10 min",
      image: "pak-studies",
      slug: "pakistan-studies-mcqs-preparation"
    },
    {
      title: "Time Management Strategies for Competitive Exams",
      excerpt: "Learn how to allocate your study time effectively, create realistic schedules, and maintain consistency throughout your preparation journey.",
      category: "Study Skills",
      date: "2024",
      readTime: "8 min",
      image: "time-management",
      slug: "time-management-strategies-competitive-exams"
    },
    {
      title: "Understanding FPSC CSS Exam Pattern and Syllabus",
      excerpt: "Complete breakdown of the FPSC CSS examination structure, compulsory and optional subjects, marking scheme, and selection process.",
      category: "Exam Guide",
      date: "2024",
      readTime: "15 min",
      image: "fpsc",
      slug: "fpsc-css-exam-pattern-syllabus"
    },
    {
      title: "Mastering English MCQs for Competitive Exams",
      excerpt: "Essential grammar rules, vocabulary building techniques, and practice strategies to excel in English MCQs for various competitive examinations.",
      category: "Subject Guide",
      date: "2024",
      readTime: "11 min",
      image: "english",
      slug: "mastering-english-mcqs-competitive-exams"
    },
    {
      title: "Current Affairs Preparation: Staying Updated in 2024",
      excerpt: "Effective methods to stay informed about national and international current affairs, important resources, and note-taking strategies for exam preparation.",
      category: "Current Affairs",
      date: "2024",
      readTime: "9 min",
      image: "current-affairs",
      slug: "current-affairs-preparation-2024"
    },
    {
      title: "Interview Preparation: Common Questions and Answers",
      excerpt: "Learn about frequently asked interview questions, how to structure your answers, body language tips, and strategies to make a lasting impression.",
      category: "Interview Guide",
      date: "2024",
      readTime: "13 min",
      image: "interview",
      slug: "interview-preparation-common-questions"
    },
    {
      title: "Everyday Science MCQs: Important Topics and Concepts",
      excerpt: "Key scientific concepts, important discoveries, and practice tips for Everyday Science questions commonly asked in competitive exams.",
      category: "Subject Guide",
      date: "2024",
      readTime: "7 min",
      image: "science",
      slug: "everyday-science-mcqs-topics"
    },
    {
      title: "How to Choose the Right Optional Subjects for CSS",
      excerpt: "Guidance on selecting optional subjects based on your academic background, scoring trends, and career goals for CSS examination.",
      category: "CSS Guide",
      date: "2024",
      readTime: "10 min",
      image: "css",
      slug: "choosing-optional-subjects-css"
    }
  ];

  const categories = [
    "All Articles",
    "Preparation Tips",
    "Subject Guide",
    "Exam Guide",
    "Interview Guide",
    "Study Skills",
    "Current Affairs"
  ];

  const featuredArticles = articles.slice(0, 3);

  const getCategoryColor = (category) => {
    const colors = {
      'Preparation Tips': 'bg-blue-100 text-blue-800',
      'Subject Guide': 'bg-green-100 text-green-800',
      'Exam Guide': 'bg-purple-100 text-purple-800',
      'Interview Guide': 'bg-pink-100 text-pink-800',
      'Study Skills': 'bg-orange-100 text-orange-800',
      'Current Affairs': 'bg-indigo-100 text-indigo-800',
      'CSS Guide': 'bg-teal-100 text-teal-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-purple-600 to-blue-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex items-center justify-center mb-6">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center">
                <FileText className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Exam Preparation Articles
            </h1>
            <p className="text-xl lg:text-2xl text-blue-100 leading-relaxed">
              Expert advice, strategies, and insights to help you succeed in competitive exams
            </p>
          </div>
        </div>
      </section>

      {/* Featured Articles */}
      <section className="py-12 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Featured Articles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredArticles.map((article, index) => (
              <Link 
                key={index}
                href={`/blog/${article.slug}`}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group overflow-hidden"
              >
                <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-500 relative">
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-300"></div>
                  <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(article.category)}`}>
                      {article.category}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center text-sm text-gray-500 mb-3">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>{article.date}</span>
                    <span className="mx-2">•</span>
                    <Clock className="w-4 h-4 mr-2" />
                    <span>{article.readTime}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300 leading-tight">
                    {article.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    {article.excerpt}
                  </p>
                  <div className="flex items-center text-blue-600 font-semibold">
                    <span>Read More</span>
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* All Articles */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              All Articles
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Browse our comprehensive collection of exam preparation articles
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {categories.map((category, index) => (
              <button
                key={index}
                className={`px-4 py-2 rounded-full font-semibold transition-all duration-300 ${
                  index === 0
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article, index) => (
              <Link 
                key={index}
                href={`/blog/${article.slug}`}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group overflow-hidden"
              >
                <div className="h-40 bg-gradient-to-br from-blue-400 to-purple-500 relative">
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-300"></div>
                  <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(article.category)}`}>
                      {article.category}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center text-sm text-gray-500 mb-3">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>{article.date}</span>
                    <span className="mx-2">•</span>
                    <Clock className="w-4 h-4 mr-2" />
                    <span>{article.readTime}</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300 leading-tight">
                    {article.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
                    {article.excerpt}
                  </p>
                  <div className="flex items-center text-blue-600 font-semibold text-sm">
                    <span>Read Article</span>
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
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
            Ready to Put Knowledge into Practice?
          </h2>
          <p className="text-xl text-blue-100 mb-8 leading-relaxed">
            Complement your reading with hands-on practice using our extensive MCQ database and past papers
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/mcqs"
              className="bg-white text-blue-600 hover:bg-gray-100 font-semibold px-8 py-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 group"
            >
              <BookOpen className="w-5 h-5" />
              <span>Practice MCQs</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
            <Link 
              href="/past-papers"
              className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-600 font-semibold px-8 py-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 group"
            >
              <FileText className="w-5 h-5" />
              <span>Study Past Papers</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Blog;
