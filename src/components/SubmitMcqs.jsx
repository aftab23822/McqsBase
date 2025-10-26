"use client";

import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
// SEO deprecated in App Router\n
const SubmitMcqs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    mcqFile: null
  });
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleChange = (e) => {
    if (e.target.type === 'file') {
      setFormData({ ...formData, mcqFile: e.target.files[0] });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission
    setSubmitStatus('success');
  };

  return (
    <>
      {/* SEO handled by metadata API */}
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <Upload className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Submit MCQs
              </h1>
              <p className="text-lg text-gray-600">
                Help other students by contributing your MCQs to our platform
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-lg">
              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject/Category
                  </label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Subject</option>
                    <option value="general-knowledge">General Knowledge</option>
                    <option value="pakistan-studies">Pakistan Studies</option>
                    <option value="english">English</option>
                    <option value="mathematics">Mathematics</option>
                    <option value="computer-science">Computer Science</option>
                    <option value="everyday-science">Everyday Science</option>
                  </select>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    MCQ File (PDF/DOC/DOCX)
                  </label>
                  <input
                    type="file"
                    name="mcqFile"
                    onChange={handleChange}
                    accept=".pdf,.doc,.docx"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Submit MCQs
                </button>
              </form>

              {submitStatus === 'success' && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <p className="text-green-800">MCQs submitted successfully! We'll review and add them soon.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SubmitMcqs;