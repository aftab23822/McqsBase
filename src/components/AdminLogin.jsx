"use client";

import React, { useState } from 'react';
import { apiFetch } from '../utils/api';
import LoadingSpinner from './LoadingSpinner';
import { getAllCategories } from '../utils/categoryUtils';
import { getMockTestCategories, getUniversities } from '../utils/mockTestCategories';
import { Shield, Upload, LogOut, User, Lock, FileText, AlertCircle, CheckCircle, ListChecks, Mail } from 'lucide-react';
import AdminUserSubmissions from './AdminUserSubmissions';
import AdminContactSubmissions from './AdminContactSubmissions';
import { ReCaptchaButton } from './recaptcha';

const AdminLogin = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSubmissions, setShowSubmissions] = useState(false);
  const [showContactMessages, setShowContactMessages] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  
  // Login state
  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  });
  
  // Upload state
  const [uploadData, setUploadData] = useState({
    file: null,
    category: '',
    subcategory: '',
    type: '',
    mockTestName: '',
    durationMinutes: 30
  });

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData(prev => ({ ...prev, [name]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateLoginForm = () => {
    const errors = {};
    
    if (!loginData.username.trim()) {
      errors.username = 'Username is required';
    }
    
    if (!loginData.password.trim()) {
      errors.password = 'Password is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async (recaptchaToken) => {
    // Validate form before proceeding
    if (!validateLoginForm()) {
      setError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const response = await apiFetch('/api/admin/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Recaptcha-Token': recaptchaToken,
        },
        body: JSON.stringify(loginData),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('adminToken', data.token);
        setIsLoggedIn(true);
        setSuccess('Login successful!');
        setValidationErrors({});
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    if (!uploadData.type) {
      setError('Please select a Type');
      setIsLoading(false);
      return;
    }

    if (!uploadData.file || !uploadData.category) {
      setError('Please fill in all required fields');
      setIsLoading(false);
      return;
    }

    if (uploadData.type === 'mock-tests') {
      if (!uploadData.subcategory) {
        setError('Please provide Subcategory (e.g., university slug) for Mock Test');
        setIsLoading(false);
        return;
      }
      if (!uploadData.mockTestName.trim()) {
        setError('Please provide a Mock Test Name');
        setIsLoading(false);
        return;
      }
    }

    try {
      // Read and validate JSON file
      const fileContent = await uploadData.file.text();
      let jsonData;
      
      try {
        jsonData = JSON.parse(fileContent);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        setError('Invalid JSON file format');
        setIsLoading(false);
        return;
      }

      if (!Array.isArray(jsonData)) {
        setError('JSON file must contain an array of MCQs');
        setIsLoading(false);
        return;
      }

      console.log('JSON data loaded:', jsonData.length, 'items');

      // Validate JSON structure based on type
      const isValidStructure = jsonData.every(item => {
        if (uploadData.type === 'simple-mcqs') {
          return item.question && item.options && item.correct_option;
        } else if (uploadData.type === 'past-papers') {
          return item.question && item.options && item.correct_option && item.year;
        } else if (uploadData.type === 'past-interviews') {
          return item.question && item.answer && item.year;
        } else if (uploadData.type === 'mock-tests') {
          return item.question && item.options && item.correct_option;
        }
        return false;
      });

      if (!isValidStructure) {
        setError(`Invalid JSON structure for ${uploadData.type}. Please check the template.`);
        setIsLoading(false);
        return;
      }

      // Use the new admin-specific batch upload endpoint
      const token = localStorage.getItem('adminToken');
      console.log('Uploading to category:', uploadData.category);
      console.log('MCQs data:', jsonData);
      
      let response;
      if (uploadData.type === 'mock-tests') {
        response = await apiFetch(`/api/mock-tests/batch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            universitySlug: uploadData.subcategory,
            mockTestName: uploadData.mockTestName,
            durationMinutes: Number(uploadData.durationMinutes) || 30,
            questions: jsonData.map(q => ({
              question: q.question,
              options: q.options,
              answer: q.correct_option,
              explanation: q.explanation || ''
            }))
          }),
        });
      } else {
        response = await apiFetch(`/api/mcqs/batch?category=${uploadData.category}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            mcqs: jsonData,
            category: uploadData.category
          }),
        });
      }

      if (response.ok) {
        const data = await response.json();
        console.log('Upload response:', data);
        setSuccess(`Successfully uploaded ${data.inserted} items. ${data.skipped} items were skipped (duplicates).`);
        setUploadData({
          file: null,
          category: '',
          subcategory: '',
          type: '',
          mockTestName: '',
          durationMinutes: 30
        });
        // Reset file input
        const fileInput = document.getElementById('file-input');
        if (fileInput) fileInput.value = '';
      } else {
        const errorData = await response.json();
        console.error('Upload error:', errorData);
        setError(errorData.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload exception:', err);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsLoggedIn(false);
    setSuccess('');
    setError('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/json') {
      setUploadData(prev => ({ ...prev, file }));
      setError(''); // Clear any previous errors
    } else {
      setError('Please select a valid JSON file');
    }
  };

  const categories = getAllCategories();
  const mockCategories = getMockTestCategories();
  const universities = getUniversities();

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 py-8">
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-6">
              <Shield className="w-8 h-8 text-indigo-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Admin Access</h1>
            <p className="text-lg text-gray-600">
              Enter your credentials to access the admin panel
            </p>
          </div>

          {/* Login Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="text-red-800 font-medium">Login Failed</p>
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-green-800 font-medium">Success!</p>
                    <p className="text-green-700 text-sm">{success}</p>
                  </div>
                </div>
              </div>
            )}
            
            <form 
              className="space-y-6" 
              onSubmit={(e) => {
                e.preventDefault();
                const btn = document.getElementById('admin-recaptcha-submit');
                if (btn) {
                  btn.click();
                }
              }}
            >
              <div>
                <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
                  Username <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={loginData.username}
                    onChange={handleLoginChange}
                    required
                    placeholder="Enter username"
                    className={`w-full pl-10 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${validationErrors.username ? 'border-red-500' : 'border-gray-300'}`}
                  />
                </div>
                {validationErrors.username && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.username}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={loginData.password}
                    onChange={handleLoginChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !isLoading && loginData.username && loginData.password) {
                        e.preventDefault();
                        const btn = document.getElementById('admin-recaptcha-submit');
                        if (btn && !btn.disabled) {
                          btn.click();
                        }
                      }
                    }}
                    required
                    placeholder="Enter password"
                    className={`w-full pl-10 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${validationErrors.password ? 'border-red-500' : 'border-gray-300'}`}
                  />
                </div>
                {validationErrors.password && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.password}</p>
                )}
              </div>
              
              <ReCaptchaButton
                id="admin-recaptcha-submit"
                onSubmit={handleLogin}
                disabled={isLoading}
                className={`w-full inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg font-semibold text-white transition-all duration-200 ${
                  isLoading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-xl'
                }`}
                loadingText="Logging in..."
                action="admin_login"
              >
                <Shield className="w-5 h-5" />
                Login
              </ReCaptchaButton>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-6">
            <Shield className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Admin Dashboard</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Manage and upload MCQs data to the database. Upload JSON files containing MCQs, Past Papers, or Past Interviews. View user submissions and contact messages.
          </p>
        </div>

        {/* Admin Menu */}
        <div className="flex gap-4 mb-8 justify-end">
          <button
            onClick={() => {
              setShowSubmissions(false);
              setShowContactMessages(false);
            }}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors duration-200 shadow hover:shadow-lg ${!showSubmissions && !showContactMessages ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-white text-indigo-700 border border-indigo-200'}`}
          >
            <Upload className="w-5 h-5" />
            Upload Data
          </button>
          <button
            onClick={() => {
              setShowSubmissions(true);
              setShowContactMessages(false);
            }}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors duration-200 shadow hover:shadow-lg ${showSubmissions ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-white text-indigo-700 border border-indigo-200'}`}
          >
            <ListChecks className="w-5 h-5" />
            User Submissions
          </button>
          <button
            onClick={() => {
              setShowSubmissions(false);
              setShowContactMessages(true);
            }}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors duration-200 shadow hover:shadow-lg ${showContactMessages ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-white text-indigo-700 border border-indigo-200'}`}
          >
            <Mail className="w-5 h-5" />
            Contact Messages
          </button>
          <button 
            onClick={handleLogout}
            className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>

        {/* Main Content */}
        {!showSubmissions && !showContactMessages ? (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="text-red-800 font-medium">Upload Failed</p>
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-green-800 font-medium">Upload Successful!</p>
                    <p className="text-green-700 text-sm">{success}</p>
                  </div>
                </div>
              </div>
            )}
            <div className="border-t-2 border-gray-200 pt-8">
              <h3 className="text-xl font-bold text-gray-900 text-center mb-6">
                📁 Upload MCQs Data
              </h3>
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded-r-lg">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-blue-800 font-medium mb-1">Need a template?</p>
                    <p className="text-blue-700 text-sm">
                      Download our JSON template to see the correct format for your data.
                      <a 
                        href="/sample-upload-template.json" 
                        download
                        className="text-blue-600 font-semibold hover:text-blue-800 transition-colors duration-300 underline ml-1"
                      >
                        Download Template
                      </a>
                    </p>
                  </div>
                </div>
              </div>
              <form onSubmit={handleFileUpload} className="space-y-6">
                {/* Type first */}
                <div>
                  <label htmlFor="type" className="block text-sm font-semibold text-gray-700 mb-2">
                    Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="type"
                    value={uploadData.type}
                    onChange={(e) => setUploadData(prev => ({ ...prev, type: e.target.value }))}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Select Type</option>
                    <option value="simple-mcqs">Simple MCQs</option>
                    <option value="past-papers">Past Papers</option>
                    <option value="past-interviews">Past Interviews</option>
                    <option value="mock-tests">Mock Test</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="file-input" className="block text-sm font-semibold text-gray-700 mb-2">
                    JSON File <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    id="file-input"
                    accept=".json"
                    onChange={handleFileChange}
                    required
                    className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 cursor-pointer transition-all duration-300 hover:border-indigo-400 hover:bg-indigo-50"
                  />
                  <p className="text-sm text-gray-600 mt-2">Select a JSON file containing MCQs data</p>
                </div>
                <div>
                  <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="category"
                    value={uploadData.category}
                    onChange={(e) => setUploadData(prev => ({ ...prev, category: e.target.value }))}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Select Category</option>
                    {uploadData.type === 'mock-tests'
                      ? mockCategories.map(category => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))
                      : categories.map(category => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))
                    }
                  </select>
                </div>
                <div>
                  <label htmlFor="subcategory" className="block text-sm font-semibold text-gray-700 mb-2">
                    {uploadData.type === 'mock-tests' ? 'Subcategory (Select e.g., University)' : 'Subcategory (Optional)'}
                  </label>
                  {uploadData.type === 'mock-tests' && uploadData.category === 'universities' ? (
                    <select
                      id="subcategory"
                      value={uploadData.subcategory}
                      onChange={(e) => setUploadData(prev => ({ ...prev, subcategory: e.target.value }))}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">Select University</option>
                      {universities.map(u => (
                        <option key={u.slug} value={u.slug} title={u.full}>
                          {u.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      id="subcategory"
                      value={uploadData.subcategory}
                      onChange={(e) => setUploadData(prev => ({ ...prev, subcategory: e.target.value }))}
                      placeholder="e.g., FPSC, SPSC, etc."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  )}
                </div>

                {/* Mock Test specific fields */}
                {uploadData.type === 'mock-tests' && (
                  <>
                    <div>
                      <label htmlFor="mockTestName" className="block text-sm font-semibold text-gray-700 mb-2">
                        Mock Test Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="mockTestName"
                        value={uploadData.mockTestName}
                        onChange={(e) => setUploadData(prev => ({ ...prev, mockTestName: e.target.value }))}
                        placeholder="e.g., SBBU SBA Entry Test 2025 - Set A"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="durationMinutes" className="block text-sm font-semibold text-gray-700 mb-2">
                        Duration (minutes)
                      </label>
                      <input
                        type="number"
                        id="durationMinutes"
                        min="5"
                        max="240"
                        value={uploadData.durationMinutes}
                        onChange={(e) => setUploadData(prev => ({ ...prev, durationMinutes: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                  </>
                )}
                {/* Info Box */}
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-blue-800 font-medium mb-1">Important Information:</p>
                      <ul className="text-blue-700 text-sm space-y-1">
                        <li>• All fields marked with <span className="text-red-500">*</span> are mandatory</li>
                        <li>• JSON file must contain an array of MCQs</li>
                        <li>• For Past Papers/Interviews, include year field</li>
                        <li>• Duplicate questions will be automatically skipped</li>
                        <li>• Use the template for correct JSON format</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center">
                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className={`inline-flex items-center gap-2 px-8 py-4 rounded-lg font-semibold text-white transition-all duration-200 ${
                      isLoading 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        Upload Data
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : showSubmissions ? (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <AdminUserSubmissions />
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <AdminContactSubmissions />
          </div>
        )}
        {/* Footer Note */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Secure admin access for data management and uploads
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;