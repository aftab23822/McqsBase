import React from 'react';
import Link from 'next/link';
import { Shield, Lock, Eye, Database, Users, Mail, FileText, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

const PrivacyPolicy = () => {
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
              <h1 className="text-4xl font-bold text-gray-900">Privacy Policy</h1>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Your privacy is important to us. This Privacy Policy explains how we collect, 
              use, and protect your personal information 
              when you use McqsBase.
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
              McqsBase ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, 
              use, disclose, and safeguard your information when you visit our website mcqsbase.com and use our services.
            </p>
            <p className="text-gray-700 leading-relaxed">
              By using our Service, you consent to the data practices described in this Privacy Policy. If you do not agree with 
              the practices described in this policy, please do not use our Service.
            </p>
          </div>

          {/* Information We Collect */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">2.1 Personal Information</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              We may collect personal information that you voluntarily provide to us when you:
            </p>
            <div className="space-y-3 mb-6">
              <div className="flex items-start">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                <p className="text-gray-700">Create an account or register for our services</p>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                <p className="text-gray-700">Contact us through our contact forms</p>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                <p className="text-gray-700">Subscribe to our newsletters or updates</p>
            </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                <p className="text-gray-700">Participate in surveys or feedback forms</p>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">2.2 Types of Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Contact Information</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Name</li>
                  <li>• Email address</li>
                  <li>• Phone number</li>
                </ul>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">Account Information</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Username</li>
                  <li>• Password (encrypted)</li>
                  <li>• Profile preferences</li>
                </ul>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">2.3 Automatically Collected Information</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              When you visit our website, we automatically collect certain information about your device and usage:
            </p>
            <div className="space-y-3">
              <div className="flex items-start">
                <Database className="w-5 h-5 text-purple-600 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-700 font-medium">Device Information</p>
                  <p className="text-gray-600 text-sm">IP address, browser type, operating system, device identifiers</p>
                </div>
              </div>
              <div className="flex items-start">
                <Eye className="w-5 h-5 text-purple-600 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-700 font-medium">Usage Information</p>
                  <p className="text-gray-600 text-sm">Pages visited, time spent, links clicked, search queries</p>
                </div>
              </div>
              <div className="flex items-start">
                <Lock className="w-5 h-5 text-purple-600 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-700 font-medium">Cookies and Tracking</p>
                  <p className="text-gray-600 text-sm">Session cookies, analytics cookies, preference cookies</p>
                </div>
              </div>
            </div>
          </div>

          {/* How We Use Information */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use the information we collect for various purposes, including:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-700 font-medium">Provide and Maintain Services</p>
                    <p className="text-gray-600 text-sm">Deliver our educational content and features</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-700 font-medium">Personalize Experience</p>
                    <p className="text-gray-600 text-sm">Customize content and recommendations</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-700 font-medium">Communicate with You</p>
                    <p className="text-gray-600 text-sm">Send updates, newsletters, and support</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-700 font-medium">Improve Services</p>
                    <p className="text-gray-600 text-sm">Analyze usage patterns and optimize performance</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-700 font-medium">Ensure Security</p>
                    <p className="text-gray-600 text-sm">Protect against fraud and unauthorized access</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-700 font-medium">Comply with Legal Obligations</p>
                    <p className="text-gray-600 text-sm">Meet regulatory requirements and legal requests</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Information Sharing */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Information Sharing and Disclosure</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, 
              except in the following circumstances:
            </p>
            <div className="space-y-4">
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-yellow-800 font-medium">Service Providers</p>
                    <p className="text-yellow-700 text-sm mt-1">
                      We may share information with trusted third-party service providers who assist us in operating our website, 
                      conducting business, or servicing you.
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-red-800 font-medium">Legal Requirements</p>
                    <p className="text-red-700 text-sm mt-1">
                      We may disclose your information if required by law or in response to valid legal requests.
              </p>
            </div>
                </div>
              </div>
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                <div className="flex items-start">
                  <Shield className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-blue-800 font-medium">Business Transfers</p>
                    <p className="text-blue-700 text-sm mt-1">
                      In the event of a merger, acquisition, or sale of assets, your information may be transferred.
              </p>
            </div>
                </div>
              </div>
            </div>
          </div>

          {/* Data Security */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Security</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We implement appropriate technical and organizational security measures to protect your personal information:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start">
                  <Lock className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-700 font-medium">Encryption</p>
                    <p className="text-gray-600 text-sm">SSL/TLS encryption for data transmission</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Shield className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-700 font-medium">Access Controls</p>
                    <p className="text-gray-600 text-sm">Restricted access to personal information</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Database className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-700 font-medium">Secure Storage</p>
                    <p className="text-gray-600 text-sm">Protected databases and secure servers</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start">
                  <Eye className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-700 font-medium">Regular Monitoring</p>
                    <p className="text-gray-600 text-sm">Continuous security monitoring and updates</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Users className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-700 font-medium">Employee Training</p>
                    <p className="text-gray-600 text-sm">Staff training on data protection</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <FileText className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-700 font-medium">Incident Response</p>
                    <p className="text-gray-600 text-sm">Procedures for security incidents</p>
                  </div>
            </div>
              </div>
            </div>
          </div>

          {/* Your Rights */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Your Rights and Choices</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You have certain rights regarding your personal information:
            </p>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                <p className="text-gray-700">
                  <strong>Access:</strong> Request access to your personal information
              </p>
            </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                <p className="text-gray-700">
                  <strong>Correction:</strong> Request correction of inaccurate information
                </p>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                <p className="text-gray-700">
                  <strong>Deletion:</strong> Request deletion of your personal information
              </p>
            </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                <p className="text-gray-700">
                  <strong>Portability:</strong> Request transfer of your data to another service
                </p>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                <p className="text-gray-700">
                  <strong>Objection:</strong> Object to processing of your personal information
                </p>
              </div>
            </div>
          </div>

          {/* Cookies */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Cookies and Tracking Technologies</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use cookies and similar tracking technologies to enhance your experience on our website:
            </p>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Essential Cookies</h4>
                <p className="text-blue-800 text-sm">Required for basic website functionality and security</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">Analytics Cookies</h4>
                <p className="text-green-800 text-sm">Help us understand how visitors use our website</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-semibold text-purple-900 mb-2">Preference Cookies</h4>
                <p className="text-purple-800 text-sm">Remember your settings and preferences</p>
              </div>
            </div>
            <p className="text-gray-700 leading-relaxed mt-4">
              You can control cookie settings through your browser preferences. However, disabling certain cookies may affect 
              the functionality of our website.
            </p>
          </div>

          {/* Children's Privacy */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Children's Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              Our Service is not intended for children under the age of 13. We do not knowingly collect personal information 
              from children under 13. If you are a parent or guardian and believe your child has provided us with personal 
              information, please contact us immediately.
            </p>
          </div>

          {/* International Transfers */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. International Data Transfers</h2>
            <p className="text-gray-700 leading-relaxed">
              Your information may be transferred to and processed in countries other than your own. We ensure that such 
              transfers comply with applicable data protection laws and implement appropriate safeguards to protect your information.
            </p>
          </div>

          {/* Changes to Policy */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Changes to This Privacy Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new 
              Privacy Policy on this page and updating the "Last updated" date. We encourage you to review this Privacy Policy 
              periodically.
            </p>
          </div>

          {/* Contact Information */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you have any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center mb-3">
                <Mail className="w-5 h-5 text-blue-600 mr-3" />
                <span className="text-gray-700 font-medium">Email:</span>
                <span className="text-blue-600 ml-2">info@mcqsbase.com</span>
              </div>
              <div className="flex items-center mb-3">
                <FileText className="w-5 h-5 text-blue-600 mr-3" />
                <span className="text-gray-700 font-medium">Address:</span>
                <span className="text-gray-600 ml-2">Pakistan</span>
              </div>
              <div className="flex items-center">
                <Shield className="w-5 h-5 text-blue-600 mr-3" />
                <span className="text-gray-700 font-medium">Data Protection Officer:</span>
                <span className="text-blue-600 ml-2">dpo@mcqsbase.com</span>
              </div>
            </div>
          </div>

          {/* Acknowledgment */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start">
              <CheckCircle className="w-6 h-6 text-blue-600 mr-3 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Your Privacy Matters</h3>
                <p className="text-blue-800">
                  We are committed to protecting your privacy and ensuring the security of your personal information. 
                  If you have any concerns about our privacy practices, please don't hesitate to contact us.
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

export default PrivacyPolicy; 