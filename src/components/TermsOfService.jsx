import React from 'react';
import Link from 'next/link';
import { Shield, Users, FileText, AlertTriangle, CheckCircle, Clock, Mail } from 'lucide-react';

const TermsOfService = () => {
  const currentYear = new Date().getFullYear();
  const lastUpdated = "December 2024";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-4xl font-bold text-gray-900">Terms of Service</h1>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Please read these terms and conditions carefully before using McqsBase. 
              By accessing and using our services, you agree to be bound by these terms.
            </p>
            <div className="mt-4 flex items-center justify-center text-sm text-gray-500">
              <Clock className="w-4 h-4 mr-2" />
              Last updated: {lastUpdated}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-lg p-8">
          
          {/* Introduction */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Welcome to McqsBase ("we," "our," or "us"). These Terms of Service ("Terms") govern your use of our website 
              and services located at mcqsbase.com (the "Service"). By accessing or using our Service, you agree to be bound 
              by these Terms and our Privacy Policy.
            </p>
            <p className="text-gray-700 leading-relaxed">
              McqsBase provides educational content, practice questions, past papers, and interview materials for competitive 
              exam preparation. Our platform is designed to help students and professionals prepare for various competitive 
              examinations in Pakistan.
            </p>
          </div>

          {/* Acceptance of Terms */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Acceptance of Terms</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              By accessing or using our Service, you confirm that you have read, understood, and agree to be bound by these Terms. 
              If you do not agree to these Terms, you must not use our Service.
            </p>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-blue-800 font-medium">Important Notice</p>
                  <p className="text-blue-700 text-sm mt-1">
                    These terms constitute a legally binding agreement between you and McqsBase. 
                    Continued use of our services indicates your acceptance of these terms.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* User Accounts */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Accounts and Registration</h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                <p className="text-gray-700">
                  <strong>Account Creation:</strong> You may be required to create an account to access certain features of our Service. 
                  You are responsible for maintaining the confidentiality of your account credentials.
                </p>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                <p className="text-gray-700">
                  <strong>Account Security:</strong> You are responsible for all activities that occur under your account. 
                  Notify us immediately of any unauthorized use of your account.
                </p>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                <p className="text-gray-700">
                  <strong>Account Termination:</strong> We reserve the right to terminate or suspend your account at any time 
                  for violations of these Terms or for any other reason at our sole discretion.
                </p>
              </div>
            </div>
          </div>

          {/* Acceptable Use */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Acceptable Use Policy</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You agree to use our Service only for lawful purposes and in accordance with these Terms. You agree not to:
            </p>
            <div className="space-y-3">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                <p className="text-gray-700">Use the Service for any illegal or unauthorized purpose</p>
              </div>
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                <p className="text-gray-700">Attempt to gain unauthorized access to our systems or networks</p>
              </div>
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                <p className="text-gray-700">Share, distribute, or reproduce our content without permission</p>
              </div>
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                <p className="text-gray-700">Use automated systems to access our Service</p>
              </div>
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                <p className="text-gray-700">Interfere with or disrupt the Service or servers</p>
              </div>
            </div>
          </div>

          {/* Intellectual Property */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Intellectual Property Rights</h2>
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                <strong>Our Content:</strong> All content on McqsBase, including but not limited to text, graphics, images, 
                questions, answers, and software, is owned by McqsBase or its licensors and is protected by copyright, 
                trademark, and other intellectual property laws.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>License:</strong> We grant you a limited, non-exclusive, non-transferable license to access and use 
                our Service for personal, non-commercial educational purposes only.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>Restrictions:</strong> You may not copy, modify, distribute, sell, or lease any part of our Service 
                without our prior written consent.
              </p>
            </div>
          </div>

          {/* Privacy and Data */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Privacy and Data Protection</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Your privacy is important to us. Our collection and use of personal information is governed by our 
              <Link href="/privacy-policy" className="text-blue-600 hover:text-blue-800 underline ml-1">
                Privacy Policy
              </Link>, which is incorporated into these Terms by reference.
            </p>
            <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
              <div className="flex items-start">
                <Shield className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-green-800 font-medium">Data Protection</p>
                  <p className="text-green-700 text-sm mt-1">
                    We implement appropriate security measures to protect your personal information and ensure compliance 
                    with applicable data protection laws.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Disclaimers */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Disclaimers and Limitations</h2>
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                <strong>Service Availability:</strong> We strive to provide continuous access to our Service, but we do not 
                guarantee that the Service will be available at all times or that it will be error-free.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>Content Accuracy:</strong> While we strive to provide accurate and up-to-date information, we do not 
                warrant that all content is accurate, complete, or current.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>No Guarantee of Results:</strong> Our Service is designed to assist with exam preparation, but we do 
                not guarantee specific exam results or outcomes.
              </p>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-yellow-800 font-medium">Important Disclaimer</p>
                    <p className="text-yellow-700 text-sm mt-1">
                      The information provided on McqsBase is for educational purposes only and should not be considered 
                      as professional advice or a guarantee of exam success.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Limitation of Liability */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed">
              To the maximum extent permitted by law, McqsBase shall not be liable for any indirect, incidental, special, 
              consequential, or punitive damages, including but not limited to loss of profits, data, or use, arising out 
              of or relating to your use of our Service.
            </p>
          </div>

          {/* Indemnification */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Indemnification</h2>
            <p className="text-gray-700 leading-relaxed">
              You agree to indemnify and hold harmless McqsBase, its officers, directors, employees, and agents from and 
              against any claims, damages, obligations, losses, liabilities, costs, or debt arising from your use of the Service 
              or violation of these Terms.
            </p>
          </div>

          {/* Modifications */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Modifications to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to modify these Terms at any time. We will notify users of any material changes by posting 
              the new Terms on this page and updating the "Last updated" date. Your continued use of the Service after such 
              modifications constitutes acceptance of the updated Terms.
            </p>
          </div>

          {/* Governing Law */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Governing Law</h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of Pakistan. Any disputes arising 
              from these Terms or your use of our Service shall be subject to the exclusive jurisdiction of the courts of Pakistan.
            </p>
          </div>

          {/* Contact Information */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you have any questions about these Terms of Service, please contact us:
            </p>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center mb-3">
                <Mail className="w-5 h-5 text-blue-600 mr-3" />
                <span className="text-gray-700 font-medium">Email:</span>
                <span className="text-blue-600 ml-2">info@mcqsbase.com</span>
              </div>
              <div className="flex items-center">
                <FileText className="w-5 h-5 text-blue-600 mr-3" />
                <span className="text-gray-700 font-medium">Address:</span>
                <span className="text-gray-600 ml-2">Pakistan</span>
              </div>
            </div>
          </div>

          {/* Severability */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Severability</h2>
            <p className="text-gray-700 leading-relaxed">
              If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or 
              eliminated to the minimum extent necessary so that these Terms will otherwise remain in full force and effect.
            </p>
          </div>

          {/* Entire Agreement */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Entire Agreement</h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms, together with our Privacy Policy, constitute the entire agreement between you and McqsBase 
              regarding your use of our Service and supersede all prior agreements and understandings.
            </p>
          </div>

          {/* Acknowledgment */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start">
              <CheckCircle className="w-6 h-6 text-blue-600 mr-3 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Acknowledgment</h3>
                <p className="text-blue-800">
                  By using McqsBase, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. 
                  If you do not agree to these terms, please do not use our Service.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border-t">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <p className="text-gray-600">
            Last updated: {lastUpdated}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            &copy; {currentYear} McqsBase. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService; 