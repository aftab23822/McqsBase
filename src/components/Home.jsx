"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  BookOpen, 
  Search, 
  FileText, 
  Users, 
  Award, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  ArrowRight,
  Star,
  Play,
  Target,
  Zap,
  Shield,
  GraduationCap,
  BarChart3,
  Calendar,
  Building,
  Globe,
  Lightbulb,
  CheckCircle2,
  XCircle,
  Brain,
  Timer,
  Flag
} from "lucide-react";
// SEO deprecated in App Router
import PakistanFlag from "./PakistanFlag";

const Home = () => {
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState(null);
  const [showQuizResult, setShowQuizResult] = useState(false);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "McqsBase.com",
    "url": "https://mcqsbase.com",
    "description": "Pakistan's premier platform for competitive exam preparation",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://mcqsbase.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  // Sample MCQs for Quick Practice
  const quickMcqs = [
    {
      question: "Which is the national flower of Pakistan?",
      options: ["Rose", "Jasmine", "Tulip", "Sunflower"],
      correct: "Jasmine",
      category: "Pakistan Studies"
    },
    {
      question: "What is synonyms of word Nightmare?",
      options: ["Story", "Journey", "Incubus", "Owl"],
      correct: "Incubus",
      category: "English"
    },
    {
      question: "Which planet is known as the Red Planet?",
      options: ["Venus", "Mars", "Jupiter", "Saturn"],
      correct: "Mars",
      category: "Everyday Science"
    }
  ];

  // Featured Quiz Question
  const featuredQuiz = {
    question: "What does the word Pakistan means?",
    options: ["Deserts", "Holy Land", "Natural Beauty", "Meadows"],
    correct: "Holy Land",
    category: "Pakistan Studies"
  };

  const handleQuizAnswer = (answer) => {
    setSelectedQuizAnswer(answer);
    setShowQuizResult(true);
  };

  const resetQuiz = () => {
    setSelectedQuizAnswer(null);
    setShowQuizResult(false);
  };

  const features = [
    {
      icon: <BookOpen className="w-8 h-8" />,
      title: "10,000+ MCQs",
      description: "Comprehensive database covering all major subjects and competitive exams"
    },
    {
      icon: <Search className="w-8 h-8" />,
      title: "Smart Search",
      description: "Find exactly what you need with our advanced search and filter system"
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: "Past Papers",
      description: "Access years of past papers from FPSC, SPSC, PPSC, and NTS"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Interview Prep",
      description: "Real interview experiences and questions from successful candidates"
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: "Free Access",
      description: "All content available completely free for everyone"
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Performance Tracking",
      description: "Monitor your progress with detailed analytics and reports"
    }
  ];

  const categories = [
    { name: "General Knowledge", count: "2,500+", color: "blue", icon: <Globe className="w-6 h-6" /> },
    { name: "Everyday Science", count: "1,800+", color: "emerald", icon: <Lightbulb className="w-6 h-6" /> },
    { name: "Current Affairs", count: "1,200+", color: "purple", icon: <Calendar className="w-6 h-6" /> },
    { name: "Pakistan Studies", count: "1,500+", color: "green", icon: <Flag className="w-6 h-6" /> },
    { name: "Islamic Studies", count: "1,000+", color: "indigo", icon: <Shield className="w-6 h-6" /> },
    { name: "English", count: "1,300+", color: "amber", icon: <BookOpen className="w-6 h-6" /> }
  ];

  const stats = [
    { number: "50,000+", label: "Active Students", icon: <Users className="w-6 h-6" /> },
    { number: "10,000+", label: "MCQs Available", icon: <BookOpen className="w-6 h-6" /> },
    { number: "95%", label: "Success Rate", icon: <Award className="w-6 h-6" /> },
    { number: "24/7", label: "Available", icon: <Clock className="w-6 h-6" /> }
  ];

  const testimonials = [
    {
      name: "Ahmed Khan",
      position: "FPSC CSS Officer",
      content: "McqsBase helped me prepare for my CSS exam. The past papers and MCQs were exactly what I needed.",
      rating: 5
    },
    {
      name: "Fatima Ali",
      position: "SPSC Lecturer",
      content: "The interview experiences shared here gave me confidence. I got selected as a lecturer!",
      rating: 5
    },
    {
      name: "Usman Hassan",
      position: "PPSC Inspector",
      content: "Best platform for competitive exam preparation. Free access to quality content is amazing.",
      rating: 5
    }
  ];

  return (
    <>
      {/* SEO handled by metadata API */}
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-blue-600 font-semibold">
                  <Award className="w-5 h-5" />
                  <span>Pakistan's #1 MCQ Platform</span>
                </div>
                <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Master Your
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"> Competitive Exams</span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Access Pakistan's largest database of MCQs, past papers, and interview experiences. 
                  Prepare for FPSC, SPSC, PPSC, and NTS exams with confidence.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/mcqs"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 group shadow-lg hover:shadow-xl"
                >
                  <span>Start Practicing</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
                <Link 
                  href="/quiz"
                  className="bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold px-8 py-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 group"
                >
                  <Play className="w-5 h-5" />
                  <span>Take Quiz</span>
                </Link>
              </div>

              <div className="flex items-center space-x-8 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Free Access</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>No Registration</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Updated Daily</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900">Quick Stats</h3>
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {stats.map((stat, index) => (
                      <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-center mb-2">
                          {stat.icon}
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{stat.number}</div>
                        <div className="text-sm text-gray-600">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Practice Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Quick Practice
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Try these sample MCQs and experience the quality of our content
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {quickMcqs.map((mcq, index) => (
              <div key={index} className="bg-white p-6 rounded-xl border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    {mcq.category}
                  </span>
                  <span className="text-sm text-gray-500">Question {index + 1}</span>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-4 leading-relaxed">
                  {mcq.question}
                </h3>
                
                <div className="space-y-3 mb-6">
                  {mcq.options.map((option, optionIndex) => {
                    const isCorrect = option === mcq.correct;
                    return (
                      <div key={optionIndex} className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors duration-200 ${
                        isCorrect 
                          ? 'border-green-300 bg-green-50' 
                          : 'border-gray-200 hover:border-blue-300'
                      }`}>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isCorrect 
                            ? 'border-green-500 bg-green-500' 
                            : 'border-gray-300'
                        }`}>
                          {isCorrect ? (
                            <CheckCircle2 className="w-3 h-3 text-white" />
                          ) : (
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          )}
                        </div>
                        <span className={`${isCorrect ? 'text-green-800 font-medium' : 'text-gray-700'}`}>
                          {option}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-600 font-medium">✓ Correct Answer Highlighted</span>
                  <Link 
                    href={`/mcqs/${mcq.category.toLowerCase().replace(/\s+/g, '-')}`}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center space-x-1 group"
                  >
                    <span>Practice More</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link 
              href="/mcqs"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-4 rounded-lg transition-all duration-300 inline-flex items-center space-x-2 group"
            >
              <Brain className="w-5 h-5" />
              <span>Practice All MCQs</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Quiz Section */}
      <section className="py-20 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Featured Quiz
            </h2>
            <p className="text-xl text-gray-600">
              Test your knowledge with this interactive quiz question
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                         <div className="flex items-center justify-between mb-6">
               <div className="flex items-center space-x-3">
                 <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                   <PakistanFlag className="w-6 h-6" />
                 </div>
                 <div>
                   <h3 className="text-lg font-bold text-gray-900">Pakistan Studies</h3>
                   <p className="text-sm text-gray-600">Test your knowledge</p>
                 </div>
               </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Timer className="w-4 h-4" />
                <span>1 Question</span>
              </div>
            </div>

            <div className="mb-8">
              <h4 className="text-xl font-semibold text-gray-900 mb-6 leading-relaxed">
                {featuredQuiz.question}
              </h4>

              <div className="space-y-3">
                {featuredQuiz.options.map((option, index) => {
                  const isSelected = selectedQuizAnswer === option;
                  const isCorrect = option === featuredQuiz.correct;
                  const showResult = showQuizResult;
                  
                  let optionClass = "flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-all duration-200";
                  
                  if (showResult) {
                    if (isCorrect) {
                      optionClass += " bg-green-50 border-green-200 text-green-800";
                    } else if (isSelected && !isCorrect) {
                      optionClass += " bg-red-50 border-red-200 text-red-800";
                    } else {
                      optionClass += " bg-gray-50 border-gray-200 text-gray-500 opacity-70";
                    }
                  } else {
                    optionClass += " bg-gray-50 border-gray-200 text-gray-700 hover:border-purple-300 hover:bg-purple-50";
                  }

                  return (
                    <div
                      key={index}
                      className={optionClass}
                      onClick={() => !showQuizResult && handleQuizAnswer(option)}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                        showResult
                          ? isCorrect
                            ? "bg-green-500 text-white"
                            : isSelected
                            ? "bg-red-500 text-white"
                            : "bg-gray-300 text-gray-600"
                          : "bg-gray-300 text-gray-600"
                      }`}>
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span className="flex-1">{option}</span>
                      {showResult && isCorrect && (
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                      )}
                      {showResult && isSelected && !isCorrect && (
                        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {showQuizResult ? (
              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${
                  selectedQuizAnswer === featuredQuiz.correct 
                    ? "bg-green-50 border border-green-200" 
                    : "bg-red-50 border border-red-200"
                }`}>
                  <div className="flex items-center space-x-2">
                    {selectedQuizAnswer === featuredQuiz.correct ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    <span className={`font-semibold ${
                      selectedQuizAnswer === featuredQuiz.correct ? "text-green-800" : "text-red-800"
                    }`}>
                      {selectedQuizAnswer === featuredQuiz.correct 
                        ? "Correct! Well done!" 
                        : "Incorrect. The correct answer is highlighted above."
                      }
                    </span>
                  </div>
                </div>
                
                <div className="flex space-x-4">
                  <button
                    onClick={resetQuiz}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300"
                  >
                    Try Again
                  </button>
                  <Link 
                    href="/quiz"
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300 flex items-center space-x-2 group"
                  >
                    <span>Take Full Quiz</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-gray-600 mb-4">Select your answer to see the result</p>
                <Link 
                  href="/quiz"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition-all duration-300 inline-flex items-center space-x-2 group"
                >
                  <Play className="w-5 h-5" />
                  <span>Take Full Quiz</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose McqsBase?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to excel in competitive exams, all in one place
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-8 rounded-xl border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 group">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Popular Categories
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Explore our comprehensive collection of MCQs organized by subject
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, index) => {
                             const getColorClasses = (color) => {
                 switch (color) {
                   case 'blue':
                     return 'from-blue-500 to-blue-600';
                   case 'emerald':
                     return 'from-emerald-500 to-emerald-600';
                   case 'purple':
                     return 'from-purple-500 to-purple-600';
                   case 'rose':
                     return 'from-rose-500 to-rose-600';
                   case 'green':
                     return 'from-green-500 to-green-600';
                   case 'indigo':
                     return 'from-indigo-500 to-indigo-600';
                   case 'amber':
                     return 'from-amber-500 to-amber-600';
                   default:
                     return 'from-blue-500 to-blue-600';
                 }
               };

              return (
                <Link 
                  key={index}
                  href={`/mcqs/${category.name.toLowerCase().replace(/\s+/g, '-')}`}
                  className="bg-white p-6 rounded-xl border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 bg-gradient-to-r ${getColorClasses(category.color)} rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300`}>
                      {category.icon}
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors duration-300" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{category.name}</h3>
                  <p className="text-gray-600">{category.count} MCQs</p>
                </Link>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <Link 
              href="/mcqs"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-4 rounded-lg transition-all duration-300 inline-flex items-center space-x-2 group"
            >
              <span>View All Categories</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Success Stories
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Hear from students who achieved their goals with McqsBase
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-8 rounded-xl border border-gray-100 shadow-lg">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 leading-relaxed">"{testimonial.content}"</p>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.position}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Start Your Success Journey?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of students who are already preparing for their competitive exams with McqsBase
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/mcqs"
              className="bg-white text-blue-600 hover:bg-gray-100 font-semibold px-8 py-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 group"
            >
              <span>Start Practicing</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
            <Link 
              href="/submit-mcqs"
              className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-600 font-semibold px-8 py-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 group"
            >
              <span>Contribute MCQs</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;
