import Link from "next/link";
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin, Clock, ArrowRight } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-gray-300" role="contentinfo">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Company Info Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <h2 className="text-2xl font-bold text-white">McqsBase</h2>
            </div>
            <p className="text-gray-400 leading-relaxed">
              Your premier destination for comprehensive MCQ preparation. Access thousands of practice questions, 
              past papers, interview materials, and mock tests to excel in your competitive exams.
            </p>
            
            {/* Social Media Links */}
            <div className="flex space-x-4">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110"
                aria-label="Follow us on Facebook"
              >
                <Facebook className="w-5 h-5 text-white" />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-sky-500 hover:bg-sky-600 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110"
                aria-label="Follow us on Twitter"
              >
                <Twitter className="w-5 h-5 text-white" />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110"
                aria-label="Follow us on Instagram"
              >
                <Instagram className="w-5 h-5 text-white" />
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-blue-700 hover:bg-blue-800 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110"
                aria-label="Follow us on LinkedIn"
              >
                <Linkedin className="w-5 h-5 text-white" />
              </a>
            </div>
          </div>

          {/* Quick Links Section */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white flex items-center">
              <ArrowRight className="w-5 h-5 mr-2 text-blue-400" />
              Quick Links
            </h3>
            <nav aria-label="Footer navigation">
              <ul className="space-y-3">
                <li>
                  <Link 
                    href="/" 
                    className="text-gray-400 hover:text-white transition-colors duration-300 flex items-center group"
                  >
                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-3 group-hover:scale-150 transition-transform"></span>
                    Home
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/mcqs" 
                    className="text-gray-400 hover:text-white transition-colors duration-300 flex items-center group"
                  >
                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-3 group-hover:scale-150 transition-transform"></span>
                    MCQs Categories
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/quiz" 
                    className="text-gray-400 hover:text-white transition-colors duration-300 flex items-center group"
                  >
                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-3 group-hover:scale-150 transition-transform"></span>
                    Practice Quiz
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/past-papers" 
                    className="text-gray-400 hover:text-white transition-colors duration-300 flex items-center group"
                  >
                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-3 group-hover:scale-150 transition-transform"></span>
                    Past Papers
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/past-interviews" 
                    className="text-gray-400 hover:text-white transition-colors duration-300 flex items-center group"
                  >
                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-3 group-hover:scale-150 transition-transform"></span>
                    Past Interviews
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/mock-tests" 
                    className="text-gray-400 hover:text-white transition-colors duration-300 flex items-center group"
                  >
                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-3 group-hover:scale-150 transition-transform"></span>
                    Mock Tests
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/contact" 
                    className="text-gray-400 hover:text-white transition-colors duration-300 flex items-center group"
                  >
                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-3 group-hover:scale-150 transition-transform"></span>
                    Contact Us
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          {/* Categories Section */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white flex items-center">
              <ArrowRight className="w-5 h-5 mr-2 text-blue-400" />
              Popular Categories
            </h3>
            <nav aria-label="MCQ categories">
              <ul className="space-y-3">
                <li>
                  <Link 
                    href="/mcqs/accounting" 
                    className="text-gray-400 hover:text-white transition-colors duration-300 flex items-center group"
                  >
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-3 group-hover:scale-150 transition-transform"></span>
                    Accounting
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/mcqs/biology" 
                    className="text-gray-400 hover:text-white transition-colors duration-300 flex items-center group"
                  >
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-3 group-hover:scale-150 transition-transform"></span>
                    Biology
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/mcqs/chemistry" 
                    className="text-gray-400 hover:text-white transition-colors duration-300 flex items-center group"
                  >
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-3 group-hover:scale-150 transition-transform"></span>
                    Chemistry
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/mcqs/computer-science" 
                    className="text-gray-400 hover:text-white transition-colors duration-300 flex items-center group"
                  >
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-3 group-hover:scale-150 transition-transform"></span>
                    Computer Science
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/mcqs/economics" 
                    className="text-gray-400 hover:text-white transition-colors duration-300 flex items-center group"
                  >
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-3 group-hover:scale-150 transition-transform"></span>
                    Economics
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/mcqs/english" 
                    className="text-gray-400 hover:text-white transition-colors duration-300 flex items-center group"
                  >
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-3 group-hover:scale-150 transition-transform"></span>
                    English
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          {/* Contact Info Section */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white flex items-center">
              <ArrowRight className="w-5 h-5 mr-2 text-blue-400" />
              Contact Information
            </h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Mail className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-gray-400 text-sm">Email</p>
                  <p className="text-white">info@mcqsbase.com</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Phone className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-gray-400 text-sm">Phone</p>
                  <p className="text-white">Coming Soon</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-gray-400 text-sm">Location</p>
                  <p className="text-white">Pakistan</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-gray-400 text-sm">Available</p>
                  <p className="text-white">24/7 Online</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-700 bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-center md:text-left">
              <p className="text-sm text-gray-400">
                &copy; {currentYear} <span className="text-white font-semibold">McqsBase</span>. All rights reserved.
              </p>
            </div>
            
            <div className="flex space-x-6 text-sm">
              <Link href="/privacy-policy" className="text-gray-400 hover:text-white transition-colors duration-300">
                Privacy Policy
              </Link>
              <Link href="/terms-of-service" className="text-gray-400 hover:text-white transition-colors duration-300">
                Terms of Service
              </Link>
              <Link href="/sitemap" className="text-gray-400 hover:text-white transition-colors duration-300">
                Sitemap
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Structured Data for SEO */}
      <script 
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "McqsBase",
            "url": "https://mcqsbase.com",
            "logo": "https://mcqsbase.com/logo.png",
            "description": "Your premier destination for comprehensive MCQ preparation. Access thousands of practice questions, past papers, interview materials, and mock tests to excel in your competitive exams.",
            "contactPoint": {
              "@type": "ContactPoint",
              "contactType": "customer service",
              "email": "info@mcqsbase.com"
            },
            "sameAs": [
              "https://facebook.com/mcqsbase",
              "https://twitter.com/mcqsbase",
              "https://instagram.com/mcqsbase",
              "https://linkedin.com/company/mcqsbase"
            ],
            "address": {
              "@type": "PostalAddress",
              "addressCountry": "Pakistan"
            }
          })
        }}
      />
    </footer>
  );
};

export default Footer;