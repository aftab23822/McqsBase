"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Menu, 
  X, 
  BookOpen, 
  Search, 
  FileText, 
  Users, 
  GraduationCap, 
  Upload, 
  Shield, 
  Mail,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  ChevronDown,
  Home,
  Award
} from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const currentPath = usePathname();

  // Handle scroll event
  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const getLinkClass = (path) => {
    // Exact match or starts with path followed by / or end of string
    const isActive = currentPath === path || 
      (path !== '/' && currentPath.startsWith(path + '/')) ||
      (path === '/' && currentPath === '/');

    return isActive
      ? "text-blue-600 bg-blue-50 px-4 py-2 rounded-lg font-semibold transition-all duration-300"
      : "text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg transition-all duration-300";
  };

  const getMobileLinkClass = (path) => {
    // Exact match or starts with path followed by / or end of string
    const isActive = currentPath === path || 
      (path !== '/' && currentPath.startsWith(path + '/')) ||
      (path === '/' && currentPath === '/');

    return isActive
      ? "text-blue-600 bg-blue-50 px-4 py-3 rounded-lg font-semibold transition-all duration-300"
      : "text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-4 py-3 rounded-lg transition-all duration-300";
  };

  return (
    <>
      {/* Top Bar with Social Links and Contact Info */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-blue-400" />
                <span className="hidden sm:inline">info@mcqsbase.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <Award className="w-4 h-4 text-blue-400" />
                <span className="hidden sm:inline">Practice Makes Perfect</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-blue-400 transition-colors duration-300"
                aria-label="Follow us on Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-blue-400 transition-colors duration-300"
                aria-label="Follow us on Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-blue-400 transition-colors duration-300"
                aria-label="Follow us on Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-blue-400 transition-colors duration-300"
                aria-label="Follow us on LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <nav
        className={`bg-white shadow-sm transition-all duration-500 ease-in-out ${
          isSticky ? "fixed top-0 left-0 right-0 shadow-lg z-50" : "relative"
        }`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            
            {/* Logo */}
             <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-gradient-to-r rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <img 
                  src="/eagle.svg" 
                  alt="McqsBase Logo" 
                  className="w-6 h-6"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                  McqsBase
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">Your Exam Prep Partner</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
               <Link href="/" className={getLinkClass("/")}>
                 <Home className="w-4 h-4 mr-2 inline" />
                 Home
               </Link>
               
               <Link href="/mcqs" className={getLinkClass("/mcqs")}>
                 <BookOpen className="w-4 h-4 mr-2 inline" />
                 MCQs
               </Link>
               
               <Link href="/quiz" className={getLinkClass("/quiz")}>
                 <Search className="w-4 h-4 mr-2 inline" />
                 Quiz
               </Link>
               
              <Link href="/past-papers" className={getLinkClass("/past-papers")}>
                 <FileText className="w-4 h-4 mr-2 inline" />
                 Past Papers
               </Link>
              
               
               <Link href="/past-interviews" className={getLinkClass("/past-interviews")}>
                 <Users className="w-4 h-4 mr-2 inline" />
                 Interviews
               </Link>
               
               {/* <Link href="/courses" className={getLinkClass("/courses")}>
                 <GraduationCap className="w-4 h-4 mr-2 inline" />
                 Courses
               </Link> */}

              <Link href="/mock-tests" className={getLinkClass("/mock-tests")}>
                <FileText className="w-4 h-4 mr-2 inline" />
                Mock Tests
              </Link>

               <Link href="/submit-mcqs" className={getLinkClass("/submit-mcqs")}>
                 <Upload className="w-4 h-4 mr-2 inline" />
                 Submit
               </Link>
               
               <Link href="/contact" className={getLinkClass("/contact")}>
                 <Mail className="w-4 h-4 mr-2 inline" />
                 Contact
               </Link>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-300"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle mobile menu"
              aria-expanded={isOpen}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="lg:hidden bg-white border-t border-gray-200 shadow-lg">
            <div className="px-4 py-6 space-y-2">
               <Link 
                 href="/" 
                 onClick={() => setIsOpen(false)} 
                 className={`flex items-center w-full ${getMobileLinkClass("/")}`}
               >
                 <Home className="w-4 h-4 mr-3" />
                 Home
               </Link>
               
               <Link 
                 href="/mcqs" 
                 onClick={() => setIsOpen(false)} 
                 className={`flex items-center w-full ${getMobileLinkClass("/mcqs")}`}
               >
                 <BookOpen className="w-4 h-4 mr-3" />
                 MCQs
               </Link>
               
               <Link 
                 href="/quiz" 
                 onClick={() => setIsOpen(false)} 
                 className={`flex items-center w-full ${getMobileLinkClass("/quiz")}`}
               >
                 <Search className="w-4 h-4 mr-3" />
                 Quiz
               </Link>
               
              <Link 
                 href="/past-papers" 
                 onClick={() => setIsOpen(false)} 
                 className={`flex items-center w-full ${getMobileLinkClass("/past-papers")}`}
               >
                 <FileText className="w-4 h-4 mr-3" />
                 Past Papers
               </Link>
              
              <Link 
                href="/mock-tests" 
                onClick={() => setIsOpen(false)} 
                className={`flex items-center w-full ${getMobileLinkClass("/mock-tests")}`}
              >
                <FileText className="w-4 h-4 mr-3" />
                Mock Tests
              </Link>
               
               <Link 
                 href="/past-interviews" 
                 onClick={() => setIsOpen(false)} 
                 className={`flex items-center w-full ${getMobileLinkClass("/past-interviews")}`}
               >
                 <Users className="w-4 h-4 mr-3" />
                 Past Interviews
               </Link>
               
               <Link 
                 href="/courses" 
                 onClick={() => setIsOpen(false)} 
                 className={`flex items-center w-full ${getMobileLinkClass("/courses")}`}
               >
                 <GraduationCap className="w-4 h-4 mr-3" />
                 Courses
               </Link>
               
               <Link 
                 href="/submit-mcqs" 
                 onClick={() => setIsOpen(false)} 
                 className={`flex items-center w-full ${getMobileLinkClass("/submit-mcqs")}`}
               >
                 <Upload className="w-4 h-4 mr-3" />
                 Submit MCQs
               </Link>
               
               <Link 
                 href="/contact" 
                 onClick={() => setIsOpen(false)} 
                 className={`flex items-center w-full ${getMobileLinkClass("/contact")}`}
               >
                 <Mail className="w-4 h-4 mr-3" />
                 Contact Us
               </Link>
               
               {/* Legal Links in Mobile */}
               <div className="pt-4 border-t border-gray-200">
                 <Link 
                   href="/privacy-policy" 
                   onClick={() => setIsOpen(false)} 
                   className={`flex items-center w-full ${getMobileLinkClass("/privacy-policy")}`}
                 >
                   <Shield className="w-4 h-4 mr-3" />
                   Privacy Policy
                 </Link>
                 
                 <Link 
                   href="/terms-of-service" 
                   onClick={() => setIsOpen(false)} 
                   className={`flex items-center w-full ${getMobileLinkClass("/terms-of-service")}`}
                 >
                   <FileText className="w-4 h-4 mr-3" />
                   Terms of Service
                 </Link>
               </div>
            </div>
          </div>
        )}
      </nav>

      {/* Spacer for fixed navbar */}
      {isSticky && <div className="h-20"></div>}
    </>
  );
}
