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

const Blog = ({ dynamicArticles = [] }) => {
  const legacyArticles = [
    {
      title: "PPSC MCQs Preparation: The 6-Week Score-Building Plan for One-Paper Tests",
      excerpt:
        "Follow a practical 6-week PPSC MCQs preparation plan covering syllabus checks, daily practice, past papers, negative marking, mock tests, and exam-day strategy.",
      category: "Exam Guide",
      date: "2026",
      readTime: "13 min",
      image: "success",
      slug: "ppsc-mcqs-preparation-6-week-study-plan-2026"
    },
    {
      title: "How to Prepare for Any MCQ Test in 30 Days",
      excerpt:
        "Use this practical 30-day MCQ test preparation plan to improve recall, speed, accuracy, past-paper performance, and exam confidence.",
      category: "Exam Guide",
      date: "2026",
      readTime: "14 min",
      image: "success",
      slug: "how-to-prepare-mcq-test-30-day-plan-pakistan"
    },
    {
      title:
        "⚔️ PakMcqs vs McqsBase — Why McqsBase is the Better Choice for Serious Exam Preparation (2026 Guide)",
      excerpt:
        "Honest comparison: ads vs ad-free, structure, UX, quality vs volume, and a side-by-side table—plus when to use PakMcqs as optional extra and McqsBase as your main PPSC/FPSC/SPSC/NTS hub.",
      category: "Exam Guide",
      date: "2026",
      readTime: "12 min",
      image: "success",
      slug: "pakmcqs-vs-mcqsbase-serious-exam-prep-2026"
    },
    {
      title: "📚 Ultimate Guide to Past Papers for Pakistan's Competitive Exams (2026 Strategy)",
      excerpt:
        "Past papers show the real pattern—learn what they reveal, where to get authentic FPSC/PPSC papers, a 5-step active method, pairing with McqsBase MCQs, timing, mistakes to skip, and FAQs.",
      category: "Exam Guide",
      date: "2026",
      readTime: "15 min",
      image: "pak-studies",
      slug: "ultimate-guide-past-papers-pakistan-competitive-exams-2026"
    },
    {
      title: "🚀 The Future of Digital Exam Preparation in Pakistan (2026 & Beyond)",
      excerpt:
        "AI, gamification, data, mobile learning, EdTech, and hybrid study—how digital prep is reshaping competitive exams in Pakistan, the challenges ahead, and why early adopters win.",
      category: "Exam Guide",
      date: "2026",
      readTime: "14 min",
      image: "current-affairs",
      slug: "future-digital-exam-preparation-pakistan-2026"
    },
    {
      title: "📘 A Complete Guide to NTS Exam Preparation Tips (2026 Success Strategy)",
      excerpt:
        "NTS prep without the overwhelm: syllabus focus, daily MCQs, timers, English & quant, reasoning, GK, one main platform, mistakes to skip, and FAQs—plus a simple daily/weekly plan.",
      category: "Exam Guide",
      date: "2026",
      readTime: "16 min",
      image: "english",
      slug: "nts-exam-preparation-complete-guide-2026"
    },
    {
      title: "🏆 Why McqsBase is the Leading Platform for Pakistan's Exam Prep (2026 Guide)",
      excerpt:
        "PPSC, FPSC, SPSC, CSS—why McqsBase leads on Pakistan-focused patterns, all-in-one prep, structure, and daily usability, with a quick comparison table vs typical MCQ sites and FAQs.",
      category: "Exam Guide",
      date: "2026",
      readTime: "15 min",
      image: "success",
      slug: "why-mcqsbase-leading-platform-pakistan-2026"
    },
    {
      title: "💰 2026's Best-Priced and Most Comprehensive MCQ Practice Resources (Pakistan Guide)",
      excerpt:
        "Free MCQs aren't all equal—compare McqsBase, TestMarkaz, PakMcqs, MyMcqs, and PakistanBix with a price vs value table, how to pick a primary hub, and FAQs for PPSC, FPSC, SPSC, and CSS.",
      category: "Exam Guide",
      date: "2026",
      readTime: "14 min",
      image: "current-affairs",
      slug: "best-priced-mcq-resources-pakistan-2026"
    },
    {
      title: "🚀 How McqsBase's Practice Tests Help Boost Your Exam Success Rates (2026 Guide)",
      excerpt:
        "Simulate real exams—not just read. Why McqsBase-style practice builds speed and confidence for PPSC, FPSC, and SPSC, with a simple weekly plan and FAQs.",
      category: "Study Skills",
      date: "2026",
      readTime: "13 min",
      image: "success",
      slug: "mcqsbase-practice-tests-exam-success-2026"
    },
    {
      title: "🔍 Comparing Top MCQ Platforms for Pakistan Exam Preparation (2026 Guide)",
      excerpt:
        "Which MCQ site should you trust for PPSC, FPSC, SPSC, or CSS? Compare major platforms with a clear table, FAQs, and how to pick one primary hub plus light revision elsewhere.",
      category: "Exam Guide",
      date: "2026",
      readTime: "14 min",
      image: "fpsc",
      slug: "compare-mcq-platforms-pakistan-2026"
    },
    {
      title: "🚀 Why Online MCQs Practice Is Essential in 2026",
      excerpt:
        "One-paper MCQs are time-bound and speed-driven. Why focused online practice beats random sites, how to combine past papers with McqsBase, and 10 sample MCQs with answers.",
      category: "Study Skills",
      date: "2026",
      readTime: "15 min",
      image: "success",
      slug: "why-online-mcqs-practice-essential-2026"
    },
    {
      title:
        "🎯 Best Resources for Interview Preparation in Pakistan's Public Sector Exams (PPSC, FPSC, SPSC)",
      excerpt:
        "Written test is only half the battle. Free resources and proven methods for PPSC, FPSC, and SPSC interviews—current affairs, mocks, body language, and a winning routine.",
      category: "Interview Guide",
      date: "2026",
      readTime: "14 min",
      image: "interview",
      slug: "interview-preparation-public-sector-pakistan-ppsc-fpsc-spsc"
    },
    {
      title: "📚 List of Best Free Resources for PPSC, FPSC, and SPSC Exams (2026 Guide)",
      excerpt:
        "A practical 2026 guide to free MCQ practice, past papers, books, and YouTube resources for PPSC, FPSC, and SPSC—with a daily routine that works.",
      category: "Exam Guide",
      date: "2026",
      readTime: "12 min",
      image: "fpsc",
      slug: "best-free-resources-ppsc-fpsc-spsc-2026"
    },
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

  const articles = [
    ...dynamicArticles.map((article) => ({
      title: article.title,
      excerpt: article.excerpt || article.metaDescription,
      category: article.category || 'Exam Guide',
      date: article.publishedAt ? new Date(article.publishedAt).getFullYear().toString() : 'New',
      readTime: article.readTime || '5 min',
      image: 'success',
      slug: article.seoUri
    })),
    ...legacyArticles
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
