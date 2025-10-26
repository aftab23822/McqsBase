import React from 'react';
import Link from 'next/link';
import { Home, BookOpen, FileText, Users, Mail, Shield } from 'lucide-react';

const Sitemap = () => {
  const sitemapData = [
    {
      category: 'Main Pages',
      icon: Home,
      links: [
        { name: 'Home', href: '/' },
        { name: 'MCQs', href: '/mcqs' },
        { name: 'Quiz', href: '/quiz' },
        { name: 'Past Papers', href: '/past-papers' },
        { name: 'Past Interviews', href: '/past-interviews' },
        { name: 'Contact', href: '/contact' }
      ]
    },
    {
      category: 'MCQ Categories',
      icon: BookOpen,
      links: [
        { name: 'General Knowledge MCQs', href: '/mcqs/general-knowledge' },
        { name: 'Pakistan Studies MCQs', href: '/mcqs/pakistan-studies' },
        { name: 'English MCQs', href: '/mcqs/english' },
        { name: 'Mathematics MCQs', href: '/mcqs/mathematics' },
        { name: 'Computer Science MCQs', href: '/mcqs/computer-science' },
        { name: 'Everyday Science MCQs', href: '/mcqs/everyday-science' }
      ]
    },
    {
      category: 'Past Papers',
      icon: FileText,
      links: [
        { name: 'FPSC Past Papers', href: '/past-papers/fpsc' },
        { name: 'SPSC Past Papers', href: '/past-papers/spsc' },
        { name: 'PPSC Past Papers', href: '/past-papers/ppsc' },
        { name: 'NTS Past Papers', href: '/past-papers/nts' }
      ]
    },
    {
      category: 'Interview Questions',
      icon: Users,
      links: [
        { name: 'FPSC Interview Questions', href: '/past-interviews/fpsc' },
        { name: 'SPSC Interview Questions', href: '/past-interviews/spsc' },
        { name: 'PPSC Interview Questions', href: '/past-interviews/ppsc' },
        { name: 'NTS Interview Questions', href: '/past-interviews/nts' }
      ]
    },
    {
      category: 'Other Pages',
      icon: Shield,
      links: [
        { name: 'Submit MCQs', href: '/submit-mcqs' },
        { name: 'Privacy Policy', href: '/privacy-policy' },
        { name: 'Terms of Service', href: '/terms-of-service' }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Site Map
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Navigate through all pages and resources available on McqsBase.com
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sitemapData.map((section, index) => {
            const IconComponent = section.icon;
            return (
              <div key={index} className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center mb-4">
                  <IconComponent className="w-6 h-6 text-blue-600 mr-3" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    {section.category}
                  </h2>
                </div>
                <ul className="space-y-2">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <Link
                        href={link.href}
                        className="text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Can't find what you're looking for?
            </h3>
            <p className="text-blue-700 mb-4">
              Contact us for assistance or to suggest new content
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Mail className="w-4 h-4 mr-2" />
              Get in Touch
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sitemap;