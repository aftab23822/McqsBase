"use client";

import React from 'react';
import Link from 'next/link';
import { 
  Award, 
  Target, 
  Users, 
  BookOpen, 
  CheckCircle, 
  TrendingUp, 
  Heart,
  Globe,
  Zap,
  Shield,
  ArrowRight,
  Star,
  GraduationCap
} from 'lucide-react';

const About = () => {
  const values = [
    {
      icon: <Target className="w-8 h-8" />,
      title: "Mission-Driven",
      description: "Empowering students across Pakistan with free, high-quality educational resources to achieve their career goals."
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: "Excellence",
      description: "We maintain the highest standards in content quality, accuracy, and user experience."
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Accessibility",
      description: "Education should be free and accessible to everyone, regardless of their financial situation."
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Community",
      description: "Building a supportive community of learners who help each other succeed."
    }
  ];

  const features = [
    {
      title: "10,000+ MCQs",
      description: "Comprehensive database covering all major subjects and exam categories",
      icon: <BookOpen className="w-6 h-6" />
    },
    {
      title: "Past Papers Archive",
      description: "Access to historical exam papers from FPSC, SPSC, PPSC, and NTS",
      icon: <GraduationCap className="w-6 h-6" />
    },
    {
      title: "Interview Experiences",
      description: "Real interview questions and experiences from successful candidates",
      icon: <Users className="w-6 h-6" />
    },
    {
      title: "Interactive Quizzes",
      description: "Practice with timed quizzes and instant feedback to improve performance",
      icon: <Zap className="w-6 h-6" />
    },
    {
      title: "Mock Tests",
      description: "Simulate real exam conditions with our comprehensive mock tests",
      icon: <Target className="w-6 h-6" />
    },
    {
      title: "Free Access",
      description: "All content is completely free, with no hidden costs or subscriptions",
      icon: <Shield className="w-6 h-6" />
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-purple-600 to-blue-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex items-center justify-center mb-6">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center">
                <Award className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              About McqsBase
            </h1>
            <p className="text-xl lg:text-2xl text-blue-100 leading-relaxed mb-8">
              Empowering Pakistan's Future Leaders Through Quality Education
            </p>
            <p className="text-lg text-blue-50 max-w-3xl mx-auto leading-relaxed">
              McqsBase is Pakistan's premier online platform dedicated to providing comprehensive, 
              free, and high-quality preparation materials for competitive examinations. Our mission 
              is to democratize access to education and help aspiring students achieve their career goals.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900">Our Mission</h2>
              </div>
              <p className="text-lg text-gray-700 leading-relaxed">
                To provide every student in Pakistan with free, comprehensive, and high-quality 
                preparation materials for competitive examinations. We believe that access to 
                quality education should not be limited by financial constraints, geographical 
                location, or social background.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                Through our extensive database of MCQs, past papers, interview experiences, 
                and study guides, we aim to level the playing field and give every student 
                an equal opportunity to succeed in their chosen career path.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900">Our Vision</h2>
              </div>
              <p className="text-lg text-gray-700 leading-relaxed">
                To become the most trusted and comprehensive educational resource platform in 
                Pakistan, recognized for excellence, innovation, and commitment to student success. 
                We envision a future where every Pakistani student has access to world-class 
                preparation materials right at their fingertips.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                We strive to continuously expand our content library, improve user experience, 
                and develop new tools and features that help students prepare more effectively 
                for competitive examinations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What We Offer Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              What We Offer
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive resources designed to help you excel in competitive examinations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Values Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Our Core Values
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values.map((value, index) => (
              <div 
                key={index}
                className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white flex-shrink-0">
                    {value.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      {value.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {value.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Why Choose McqsBase?
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Discover what makes us the preferred choice for thousands of students
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white/10 backdrop-blur-lg p-8 rounded-xl border border-white/20">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-6">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4">100% Free</h3>
              <p className="text-blue-100 leading-relaxed">
                All our content is completely free. No hidden charges, no premium subscriptions, 
                no paywalls. Access everything you need without spending a single rupee.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg p-8 rounded-xl border border-white/20">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4">Regularly Updated</h3>
              <p className="text-blue-100 leading-relaxed">
                Our content is continuously updated with new MCQs, past papers, and study materials 
                to ensure you have access to the latest and most relevant preparation resources.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg p-8 rounded-xl border border-white/20">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-6">
                <Star className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4">Quality Assured</h3>
              <p className="text-blue-100 leading-relaxed">
                Every question and answer is carefully reviewed and verified by our team of experts 
                to ensure accuracy and relevance to actual competitive examinations.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg p-8 rounded-xl border border-white/20">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4">User-Friendly Interface</h3>
              <p className="text-blue-100 leading-relaxed">
                Our intuitive and responsive design ensures a seamless learning experience across 
                all devices - desktop, tablet, or mobile.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg p-8 rounded-xl border border-white/20">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4">Community Driven</h3>
              <p className="text-blue-100 leading-relaxed">
                Built by students, for students. Our community contributes questions, shares 
                experiences, and supports each other in their exam preparation journey.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg p-8 rounded-xl border border-white/20">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4">No Registration Required</h3>
              <p className="text-blue-100 leading-relaxed">
                Start practicing immediately without creating an account. We respect your privacy 
                and believe learning should be barrier-free.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-2">
                50,000+
              </div>
              <div className="text-gray-600 text-lg">Active Students</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-2">
                10,000+
              </div>
              <div className="text-gray-600 text-lg">MCQs Available</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-2">
                500+
              </div>
              <div className="text-gray-600 text-lg">Past Papers</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-2">
                95%
              </div>
              <div className="text-gray-600 text-lg">Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-gray-900 to-slate-800 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Start Your Success Journey?
          </h2>
          <p className="text-xl text-gray-300 mb-8 leading-relaxed">
            Join thousands of students who are already preparing for their competitive exams with McqsBase. 
            Start practicing today and take the first step towards achieving your career goals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/mcqs"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 group"
            >
              <span>Start Practicing</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
            <Link 
              href="/contact"
              className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-gray-900 font-semibold px-8 py-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 group"
            >
              <span>Contact Us</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
