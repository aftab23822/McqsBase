"use client";

import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import LoadingSpinner from './LoadingSpinner';
import { getAllCategories } from '../utils/categoryUtils';
import { getMockTestCategories, getUniversities } from '../data/categories/mockTestCategories';
import { Shield, Upload, LogOut, User, Lock, FileText, AlertCircle, CheckCircle, ListChecks, Mail, Plus } from 'lucide-react';
import AdminUserSubmissions from './AdminUserSubmissions';
import AdminContactSubmissions from './AdminContactSubmissions';
import AdminMockTestsManager from './AdminMockTestsManager';
import CategoryTreeManager from './CategoryTreeManager';
import { ReCaptchaButton } from './recaptcha';

const AdminLogin = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSubmissions, setShowSubmissions] = useState(false);
  const [showContactMessages, setShowContactMessages] = useState(false);
  const [showMockTestsManager, setShowMockTestsManager] = useState(false);
  const [showPagesManagement, setShowPagesManagement] = useState(false);
  const [showCategoriesSync, setShowCategoriesSync] = useState(false);
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

    // Validate required fields based on type
    if (uploadData.type === 'simple-mcqs') {
      if (!uploadData.file || !uploadData.category) {
      setError('Please fill in all required fields');
      setIsLoading(false);
      return;
      }
    } else if (uploadData.type === 'past-papers' || uploadData.type === 'past-interviews') {
      if (!uploadData.file || !selectedCommission || !selectedDepartment || !selectedRole) {
        setError('Please select Commission, Department, and Role');
        setIsLoading(false);
        return;
      }
      // Set category to role link for past papers/interviews
      uploadData.category = selectedRole;
      uploadData.subcategory = selectedCommission;
    } else if (uploadData.type === 'mock-tests') {
      if (!uploadData.file || !uploadData.category || !uploadData.subcategory) {
        setError('Please fill in all required fields');
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

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        setIsCheckingAuth(false);
        return;
      }

      try {
        // Verify token is still valid by checking profile
        const response = await apiFetch('/api/admin/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          // Token is valid, user is authenticated
          setIsLoggedIn(true);
        } else {
          // Token is invalid or expired, remove it
          localStorage.removeItem('adminToken');
        }
      } catch (error) {
        // Network error or token invalid
        localStorage.removeItem('adminToken');
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

  const categories = getAllCategories();
  const mockCategories = getMockTestCategories();
  const universities = getUniversities();

  // Category structure state for Past Papers/Interviews
  const [categoryStructure, setCategoryStructure] = useState(null);
  const [selectedCommission, setSelectedCommission] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [showNewCommission, setShowNewCommission] = useState(false);
  const [showNewDepartment, setShowNewDepartment] = useState(false);
  const [showNewRole, setShowNewRole] = useState(false);
  const [showNewMcqCategory, setShowNewMcqCategory] = useState(false);
  const [newCommissionName, setNewCommissionName] = useState('');
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [newRoleData, setNewRoleData] = useState({ label: '', link: '' });
  const [newMcqCategory, setNewMcqCategory] = useState({ value: '', label: '' });
  const [loadingStructure, setLoadingStructure] = useState(false);
  const [categoriesSeedFile, setCategoriesSeedFile] = useState(null);
  const [isSeedingCategories, setIsSeedingCategories] = useState(false);

  // Fetch category structure when type changes
  useEffect(() => {
    const fetchCategoryStructure = async () => {
      if (uploadData.type === 'past-papers' || uploadData.type === 'past-interviews') {
        setLoadingStructure(true);
        try {
          const response = await fetch(`/api/categories/structure?type=${uploadData.type}`);
          if (response.ok) {
            const data = await response.json();
            setCategoryStructure(data.data);
          }
        } catch (error) {
          console.error('Error fetching category structure:', error);
        } finally {
          setLoadingStructure(false);
        }
      } else {
        setCategoryStructure(null);
      }
      
      // Reset selections when type changes
      setSelectedCommission('');
      setSelectedDepartment('');
      setSelectedRole('');
      setUploadData(prev => ({ ...prev, category: '', subcategory: '' }));
    };

    if (uploadData.type) {
      fetchCategoryStructure();
    } else {
      setCategoryStructure(null);
    }
  }, [uploadData.type]);

  // Get available commissions
  const getCommissions = () => {
    if (!categoryStructure || !categoryStructure.commissions) return [];
    return categoryStructure.commissions.map(comm => ({
      value: comm.title,
      label: comm.title
    }));
  };

  // Get available departments for selected commission
  const getDepartments = () => {
    if (!categoryStructure || !categoryStructure.commissions || !selectedCommission) return [];
    const commission = categoryStructure.commissions.find(c => c.title === selectedCommission);
    if (!commission || !commission.departments) return [];
    return commission.departments.map(dept => ({
      value: dept.label,
      label: dept.label
    }));
  };

  // Get available roles for selected department
  const getRoles = () => {
    if (!categoryStructure || !categoryStructure.commissions || !selectedCommission || !selectedDepartment) return [];
    const commission = categoryStructure.commissions.find(c => c.title === selectedCommission);
    if (!commission || !commission.departments) return [];
    const department = commission.departments.find(d => d.label === selectedDepartment);
    if (!department || !department.roles) return [];
    return department.roles.map(role => ({
      value: role.link,
      label: role.label,
      link: role.link
    }));
  };

  // Handle adding new commission
  const handleAddCommission = async () => {
    if (!newCommissionName.trim()) return;
    
    const token = localStorage.getItem('adminToken');
    try {
      const response = await apiFetch('/api/categories/structure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: uploadData.type,
          action: 'add-commission',
          data: { title: newCommissionName.trim(), icon: 'Building2' }
        }),
      });

      if (response.ok) {
        // Refresh category structure
        const refreshResponse = await fetch(`/api/categories/structure?type=${uploadData.type}`);
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          setCategoryStructure(refreshData.data);
        }
        setSelectedCommission(newCommissionName.trim());
        setNewCommissionName('');
        setShowNewCommission(false);
        setSuccess('Commission added successfully!');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to add commission');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    }
  };

  // Handle adding new department
  const handleAddDepartment = async () => {
    if (!newDepartmentName.trim() || !selectedCommission) return;
    
    const token = localStorage.getItem('adminToken');
    try {
      const response = await apiFetch('/api/categories/structure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: uploadData.type,
          action: 'add-department',
          data: {
            commissionTitle: selectedCommission,
            departmentLabel: newDepartmentName.trim()
          }
        }),
      });

      if (response.ok) {
        // Refresh category structure
        const refreshResponse = await fetch(`/api/categories/structure?type=${uploadData.type}`);
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          setCategoryStructure(refreshData.data);
        }
        setSelectedDepartment(newDepartmentName.trim());
        setNewDepartmentName('');
        setShowNewDepartment(false);
        setSuccess('Department added successfully!');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to add department');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    }
  };

  // Handle adding new role
  const handleAddRole = async () => {
    if (!newRoleData.label.trim() || !newRoleData.link.trim() || !selectedCommission || !selectedDepartment) return;
    
    const token = localStorage.getItem('adminToken');
    try {
      const response = await apiFetch('/api/categories/structure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: uploadData.type,
          action: 'add-role',
          data: {
            commissionTitle: selectedCommission,
            departmentLabel: selectedDepartment,
            roleLabel: newRoleData.label.trim(),
            roleLink: newRoleData.link.trim()
          }
        }),
      });

      if (response.ok) {
        // Refresh category structure
        const refreshResponse = await fetch(`/api/categories/structure?type=${uploadData.type}`);
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          setCategoryStructure(refreshData.data);
        }
        setSelectedRole(newRoleData.link.trim());
        setNewRoleData({ label: '', link: '' });
        setShowNewRole(false);
        setSuccess('Role added successfully!');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to add role');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    }
  };

  // Handle adding new MCQ category
  const handleAddMcqCategory = async () => {
    if (!newMcqCategory.value.trim() || !newMcqCategory.label.trim()) return;
    
    const token = localStorage.getItem('adminToken');
    try {
      const response = await apiFetch('/api/categories/structure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'mcqs',
          action: 'add-category',
          data: {
            value: newMcqCategory.value.trim().toLowerCase().replace(/\s+/g, '-'),
            label: newMcqCategory.label.trim()
          }
        }),
      });

      if (response.ok) {
        setUploadData(prev => ({ ...prev, category: newMcqCategory.value.trim().toLowerCase().replace(/\s+/g, '-') }));
        setNewMcqCategory({ value: '', label: '' });
        setShowNewMcqCategory(false);
        setSuccess('Category added successfully!');
        // Reload page or refresh categories
        window.location.reload();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to add category');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    }
  };

  // Show loading spinner while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

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
        <div className="flex gap-4 mb-8 justify-end flex-wrap">
          <button
            onClick={() => {
              setShowSubmissions(false);
              setShowContactMessages(false);
              setShowMockTestsManager(false);
              setShowPagesManagement(false);
              setShowCategoriesSync(false);
            }}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors duration-200 shadow hover:shadow-lg ${!showSubmissions && !showContactMessages && !showMockTestsManager && !showPagesManagement && !showCategoriesSync ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-white text-indigo-700 border border-indigo-200'}`}
          >
            <Upload className="w-5 h-5" />
            Upload Data
          </button>
          <button
            onClick={() => {
              setShowSubmissions(false);
              setShowContactMessages(false);
              setShowMockTestsManager(false);
              setShowPagesManagement(true);
              setShowCategoriesSync(false);
            }}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors duration-200 shadow hover:shadow-lg ${showPagesManagement ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-white text-indigo-700 border border-indigo-200'}`}
          >
            <FileText className="w-5 h-5" />
            Pages Management
          </button>
          <button
            onClick={() => {
              setShowSubmissions(false);
              setShowContactMessages(false);
              setShowMockTestsManager(false);
              setShowPagesManagement(false);
              setShowCategoriesSync(true);
            }}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors duration-200 shadow hover:shadow-lg ${showCategoriesSync ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-white text-indigo-700 border border-indigo-200'}`}
          >
            <Upload className="w-5 h-5" />
            Sync Categories
          </button>
          <button
            onClick={() => {
              setShowSubmissions(true);
              setShowContactMessages(false);
              setShowMockTestsManager(false);
              setShowPagesManagement(false);
              setShowCategoriesSync(false);
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
              setShowMockTestsManager(false);
              setShowPagesManagement(false);
              setShowCategoriesSync(false);
            }}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors duration-200 shadow hover:shadow-lg ${showContactMessages ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-white text-indigo-700 border border-indigo-200'}`}
          >
            <Mail className="w-5 h-5" />
            Contact Messages
          </button>
          <button
            onClick={() => {
              setShowSubmissions(false);
              setShowContactMessages(false);
              setShowMockTestsManager(true);
              setShowPagesManagement(false);
              setShowCategoriesSync(false);
            }}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors duration-200 shadow hover:shadow-lg ${showMockTestsManager ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-white text-indigo-700 border border-indigo-200'}`}
          >
            Manage Mock Tests
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
        {!showSubmissions && !showContactMessages && !showMockTestsManager && !showPagesManagement && !showCategoriesSync ? (
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
                {/* Category selection based on type */}
                {uploadData.type === 'simple-mcqs' && (
                <div>
                  <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                    <div className="space-y-2">
                  <select
                    id="category"
                    value={uploadData.category}
                    onChange={(e) => setUploadData(prev => ({ ...prev, category: e.target.value }))}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                      {/* Removed "Add New Category" button - now in Pages Management */}
                      {false && showNewMcqCategory && (
                        <div className="border border-indigo-200 rounded-lg p-4 bg-indigo-50">
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Category Value (slug)</label>
                              <input
                                type="text"
                                value={newMcqCategory.value}
                                onChange={(e) => setNewMcqCategory(prev => ({ ...prev, value: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                                placeholder="e.g., new-subject"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                              />
                </div>
                <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Category Label</label>
                              <input
                                type="text"
                                value={newMcqCategory.label}
                                onChange={(e) => setNewMcqCategory(prev => ({ ...prev, label: e.target.value }))}
                                placeholder="e.g., New Subject"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={handleAddMcqCategory}
                                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium"
                              >
                                Add Category
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowNewMcqCategory(false);
                                  setNewMcqCategory({ value: '', label: '' });
                                }}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-medium"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Commission/Department/Role selection for Past Papers/Interviews */}
                {(uploadData.type === 'past-papers' || uploadData.type === 'past-interviews') && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Commission <span className="text-red-500">*</span>
                  </label>
                      <div className="space-y-2">
                        <select
                          value={selectedCommission}
                          onChange={(e) => {
                            setSelectedCommission(e.target.value);
                            setSelectedDepartment('');
                            setSelectedRole('');
                            setUploadData(prev => ({ ...prev, subcategory: e.target.value }));
                          }}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          disabled={loadingStructure}
                        >
                          <option value="">{loadingStructure ? 'Loading...' : 'Select Commission'}</option>
                          {getCommissions().map(comm => (
                            <option key={comm.value} value={comm.value}>{comm.label}</option>
                          ))}
                        </select>
                        {/* Removed "Add New Commission" button - now in Pages Management */}
                        {false && showNewCommission && (
                          <div className="border border-indigo-200 rounded-lg p-4 bg-indigo-50">
                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Commission Name</label>
                  <input
                    type="text"
                                  value={newCommissionName}
                                  onChange={(e) => setNewCommissionName(e.target.value)}
                                  placeholder="e.g., PPSC, NTS, etc."
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                />
                              </div>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={handleAddCommission}
                                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium"
                                >
                                  Add Commission
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowNewCommission(false);
                                    setNewCommissionName('');
                                  }}
                                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-medium"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedCommission && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Department <span className="text-red-500">*</span>
                        </label>
                        <div className="space-y-2">
                          <select
                            value={selectedDepartment}
                            onChange={(e) => {
                              setSelectedDepartment(e.target.value);
                              setSelectedRole('');
                            }}
                            required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          >
                            <option value="">Select Department</option>
                            {getDepartments().map(dept => (
                              <option key={dept.value} value={dept.value}>{dept.label.replace(/^[^\w\s]+/, '')}</option>
                            ))}
                          </select>
                          {/* Removed "Add New Department" button - now in Pages Management */}
                          {false && showNewDepartment && (
                            <div className="border border-indigo-200 rounded-lg p-4 bg-indigo-50">
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Department Name</label>
                                  <input
                                    type="text"
                                    value={newDepartmentName}
                                    onChange={(e) => setNewDepartmentName(e.target.value)}
                                    placeholder="e.g., 🏫 College Education Department"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={handleAddDepartment}
                                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium"
                                  >
                                    Add Department
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setShowNewDepartment(false);
                                      setNewDepartmentName('');
                                    }}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-medium"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {selectedDepartment && (
                <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Role <span className="text-red-500">*</span>
                  </label>
                        <div className="space-y-2">
                  <select
                            value={selectedRole}
                            onChange={(e) => {
                              setSelectedRole(e.target.value);
                              setUploadData(prev => ({ ...prev, category: e.target.value }));
                            }}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                            <option value="">Select Role</option>
                            {getRoles().map(role => (
                              <option key={role.value} value={role.value}>{role.label}</option>
                            ))}
                  </select>
                          {/* Removed "Add New Role" button - now in Pages Management */}
                          {false && showNewRole && (
                            <div className="border border-indigo-200 rounded-lg p-4 bg-indigo-50">
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Role Label</label>
                                  <input
                                    type="text"
                                    value={newRoleData.label}
                                    onChange={(e) => setNewRoleData(prev => ({ ...prev, label: e.target.value }))}
                                    placeholder="e.g., Lecturer Computer Science BPS‑17"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                  />
                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Role Link (URL path)</label>
                                  <input
                                    type="text"
                                    value={newRoleData.link}
                                    onChange={(e) => setNewRoleData(prev => ({ ...prev, link: e.target.value }))}
                                    placeholder={`/past-${uploadData.type === 'past-papers' ? 'papers' : 'interviews'}/${selectedCommission.toLowerCase().replace(/\s+/g, '-')}/department-slug/role-slug`}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={handleAddRole}
                                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium"
                                  >
                                    Add Role
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setShowNewRole(false);
                                      setNewRoleData({ label: '', link: '' });
                                    }}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-medium"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Mock Tests Category and University selection */}
                {uploadData.type === 'mock-tests' && (
                  <>
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
                        {mockCategories.map(category => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    {uploadData.category === 'universities' && (
                      <div>
                        <label htmlFor="subcategory" className="block text-sm font-semibold text-gray-700 mb-2">
                          University <span className="text-red-500">*</span>
                        </label>
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
                      </div>
                    )}
                  </>
                )}

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
        ) : showCategoriesSync ? (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="text-lg font-semibold mb-2">Sync MCQ Categories Hierarchy</h4>
              <p className="text-sm text-gray-600 mb-4">
                Upload your categories_data.json to seed or update sub-categories for each MCQ category. Existing categories remain intact; duplicates are skipped.
              </p>
              <div className="grid gap-3 md:grid-cols-[1fr_auto] items-end">
                <div>
                  <label htmlFor="categories-seed-file" className="block text-sm font-medium text-gray-700 mb-2">
                    categories_data.json
                  </label>
                  <input
                    type="file"
                    id="categories-seed-file"
                    accept=".json"
                    onChange={(e) => setCategoriesSeedFile(e.target.files?.[0] || null)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                  />
                </div>
                <button
                  type="button"
                  disabled={isSeedingCategories || !categoriesSeedFile}
                  onClick={async () => {
                    if (!categoriesSeedFile) return;
                    setIsSeedingCategories(true);
                    setError('');
                    setSuccess('');
                    try {
                      const text = await categoriesSeedFile.text();
                      const parsed = JSON.parse(text);
                      const categoriesPayload = Array.isArray(parsed?.categories) ? parsed.categories : [];
                      if (!Array.isArray(categoriesPayload) || categoriesPayload.length === 0) {
                        setError('Invalid categories_data.json: "categories" array missing or empty.');
                        setIsSeedingCategories(false);
                        return;
                      }
                      const token = localStorage.getItem('adminToken');
                      const resp = await apiFetch('/api/categories/hierarchy/seed', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}`,
                        },
                        body: JSON.stringify({ categories: categoriesPayload })
                      });
                      if (resp.ok) {
                        const data = await resp.json();
                        setSuccess(`Synced categories. Created categories: ${data.createdCategories}, created subcategories: ${data.createdSubcategories}, skipped subcategories: ${data.skippedSubcategories}.`);
                        setCategoriesSeedFile(null);
                        const input = document.getElementById('categories-seed-file');
                        if (input) input.value = '';
                      } else {
                        const err = await resp.json().catch(() => ({}));
                        setError(err.error || 'Failed to sync categories');
                      }
                    } catch (e) {
                      setError('Invalid JSON file or network error.');
                    } finally {
                      setIsSeedingCategories(false);
                    }
                  }}
                  className={`px-6 py-3 rounded-lg font-semibold text-white transition-colors duration-200 ${isSeedingCategories || !categoriesSeedFile ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                >
                  {isSeedingCategories ? 'Syncing…' : 'Sync Categories'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Note: This action is idempotent. Running it multiple times will only add missing items.
              </p>
            </div>
          </div>
        ) : showMockTestsManager ? (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <AdminMockTestsManager />
          </div>
        ) : showPagesManagement ? (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Type to Manage
              </label>
              <select
                value={uploadData.type || ''}
                onChange={(e) => {
                  setUploadData(prev => ({ ...prev, type: e.target.value }));
                  setCategoryStructure(null);
                  setSelectedCommission('');
                  setSelectedDepartment('');
                  setSelectedRole('');
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Select Type</option>
                <option value="simple-mcqs">Simple MCQs</option>
                <option value="past-papers">Past Papers</option>
                <option value="past-interviews">Past Interviews</option>
                <option value="mock-tests">Mock Tests</option>
              </select>
            </div>
            {/* Sync panel moved to its own section (Sync Categories) */}
            <CategoryTreeManager type={
              uploadData.type === 'simple-mcqs' ? 'mcqs' : uploadData.type
            } />
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