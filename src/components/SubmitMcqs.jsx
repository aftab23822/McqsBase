"use client";

import React, { useState } from 'react';
import { Send, BookOpen, User, CheckCircle, AlertCircle, Briefcase, Calendar, Building2, FileText } from 'lucide-react';
import { ReCaptchaButton } from './recaptcha';

const SubmitMcqs = () => {
  const [formData, setFormData] = useState({
    type: '',
    question: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    optionE: '',
    correctAnswer: '',
    category: '',
    username: '',
    // Interview fields
    position: '',
    sharedBy: '',
    year: '',
    department: '',
    experience: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const categories = [
    'Accounting', 'Agriculture', 'Auditing', 'Biology', 'Chemistry', 'Computer',
    'Economics', 'English', 'Everyday Science', 'Finance', 'General Knowledge',
    'HRM', 'Islamic Studies', 'Management Sciences', 'Marketing', 'Mathematics',
    'Pakistan Current Affairs', 'Pakistan Studies', 'Pedagogy', 'Physics',
    'Psychology', 'Sociology', 'Statistics', 'URDU', 'World Current Affairs'
  ];

  const mcqTypes = [
    { value: '', label: 'Select MCQ Type' },
    { value: 'simple', label: 'Simple Useful MCQ' },
    { value: 'pastpaper', label: 'Past Paper MCQ' },
    { value: 'interview', label: 'Past Interview Question' },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.type) {
      errors.type = 'Please select MCQ type';
    }
    
    if (!formData.question.trim()) {
      errors.question = 'Question is required';
    }
    
    if (formData.type === 'interview') {
      if (!formData.position.trim()) {
        errors.position = 'Position is required';
      }
      if (!formData.sharedBy.trim()) {
        errors.sharedBy = 'Shared By is required';
      }
      if (!formData.year) {
        errors.year = 'Year is required';
      }
      if (!formData.department.trim()) {
        errors.department = 'Department is required';
      }
    } else if (formData.type === 'simple' || formData.type === 'pastpaper') {
      if (!formData.optionA.trim()) {
        errors.optionA = 'Option A is required';
      }
      if (!formData.optionB.trim()) {
        errors.optionB = 'Option B is required';
      }
      if (!formData.optionC.trim()) {
        errors.optionC = 'Option C is required';
      }
      if (!formData.optionD.trim()) {
        errors.optionD = 'Option D is required';
      }
      if (!formData.correctAnswer) {
        errors.correctAnswer = 'Please select correct answer';
      }
      if (!formData.category) {
        errors.category = 'Please select category';
      }
      if (!formData.username.trim()) {
        errors.username = 'Username is required';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (recaptchaToken) => {
    // Validate form before proceeding
    if (!validateForm()) {
      setSubmitStatus('validation_error');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Recaptcha-Token': recaptchaToken,
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSubmitStatus('success');
        setFormData({
          type: '',
          question: '',
          optionA: '',
          optionB: '',
          optionC: '',
          optionD: '',
          optionE: '',
          correctAnswer: '',
          category: '',
          username: '',
          position: '',
          sharedBy: '',
          year: '',
          department: '',
          experience: '',
        });
        setValidationErrors({});
      } else {
        setSubmitStatus('error');
        console.error('Submission failed:', result.message);
      }
    } catch (error) {
      console.error('Error submitting:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
            <BookOpen className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Submit MCQs</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Contribute to McqsBase.com by adding your own MCQs to help our Pakistani community. <br/>
            Our team will check the question for accuracy and suitability before being added to the site.
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            {/* MCQ Type */}
            <div>
              <label htmlFor="type" className="block text-sm font-semibold text-gray-700 mb-2">
                MCQ Type <span className="text-red-500">*</span>
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${validationErrors.type ? 'border-red-500' : 'border-gray-300'}`}
                required
              >
                {mcqTypes.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              {validationErrors.type && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.type}</p>
              )}
            </div>

            {/* Question */}
            <div>
              <label htmlFor="question" className="block text-sm font-semibold text-gray-700 mb-2">
                {formData.type === 'interview' ? 'Interview Question' : 'MCQ Question'} <span className="text-red-500">*</span>
              </label>
              <textarea
                id="question"
                name="question"
                value={formData.question}
                onChange={handleInputChange}
                rows={4}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none ${validationErrors.question ? 'border-red-500' : 'border-gray-300'}`}
                placeholder={formData.type === 'interview' ? 'Enter the interview question asked...' : 'Enter your MCQ question here...'}
                required
              />
              {validationErrors.question && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.question}</p>
              )}
            </div>

            {/* Interview Fields */}
            {formData.type === 'interview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="position" className="block text-sm font-semibold text-gray-700 mb-2">
                    Position/Job Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="position"
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${validationErrors.position ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="e.g. Lecturer Computer Science"
                    required
                  />
                  {validationErrors.position && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.position}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="sharedBy" className="block text-sm font-semibold text-gray-700 mb-2">
                    Shared By <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="sharedBy"
                    name="sharedBy"
                    value={formData.sharedBy}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${validationErrors.sharedBy ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="e.g. Ali Raza"
                    required
                  />
                  {validationErrors.sharedBy && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.sharedBy}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="year" className="block text-sm font-semibold text-gray-700 mb-2">
                    Year <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="year"
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${validationErrors.year ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="e.g. 2023"
                    required
                  />
                  {validationErrors.year && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.year}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="department" className="block text-sm font-semibold text-gray-700 mb-2">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${validationErrors.department ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="e.g. FPSC"
                    required
                  />
                  {validationErrors.department && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.department}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="experience" className="block text-sm font-semibold text-gray-700 mb-2">
                    Experience (Details, Optional)
                  </label>
                  <textarea
                    id="experience"
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    placeholder="e.g. They also asked questions related to polymorphism and database normalization."
                  />
                </div>
              </div>
            )}

            {/* MCQ Options & Answer Fields (not for interview) */}
            {(formData.type === 'simple' || formData.type === 'pastpaper') && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="optionA" className="block text-sm font-semibold text-gray-700 mb-2">
                      Option A <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="optionA"
                      name="optionA"
                      value={formData.optionA}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${validationErrors.optionA ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Enter option A"
                      required
                    />
                    {validationErrors.optionA && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.optionA}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="optionB" className="block text-sm font-semibold text-gray-700 mb-2">
                      Option B <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="optionB"
                      name="optionB"
                      value={formData.optionB}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${validationErrors.optionB ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Enter option B"
                      required
                    />
                    {validationErrors.optionB && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.optionB}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="optionC" className="block text-sm font-semibold text-gray-700 mb-2">
                      Option C <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="optionC"
                      name="optionC"
                      value={formData.optionC}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${validationErrors.optionC ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Enter option C"
                      required
                    />
                    {validationErrors.optionC && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.optionC}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="optionD" className="block text-sm font-semibold text-gray-700 mb-2">
                      Option D <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="optionD"
                      name="optionD"
                      value={formData.optionD}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${validationErrors.optionD ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Enter option D"
                      required
                    />
                    {validationErrors.optionD && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.optionD}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label htmlFor="optionE" className="block text-sm font-semibold text-gray-700 mb-2">
                    Option E (Optional)
                  </label>
                  <input
                    type="text"
                    id="optionE"
                    name="optionE"
                    value={formData.optionE}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter option E (optional)"
                  />
                </div>
                <div>
                  <label htmlFor="correctAnswer" className="block text-sm font-semibold text-gray-700 mb-2">
                    Correct Answer <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="correctAnswer"
                    name="correctAnswer"
                    value={formData.correctAnswer}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${validationErrors.correctAnswer ? 'border-red-500' : 'border-gray-300'}`}
                    required
                  >
                    <option value="">Select correct answer</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                    <option value="E">E</option>
                  </select>
                  {validationErrors.correctAnswer && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.correctAnswer}</p>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-2">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${validationErrors.category ? 'border-red-500' : 'border-gray-300'}`}
                      required
                    >
                      <option value="">Select a category</option>
                      {categories.map((category, index) => (
                        <option key={index} value={category}>{category}</option>
                      ))}
                    </select>
                    {validationErrors.category && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.category}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
                      Username for Credit <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${validationErrors.username ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Enter your username"
                      required
                    />
                    {validationErrors.username && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.username}</p>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Info Box */}
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-blue-800 font-medium mb-1">Important Information:</p>
                  <ul className="text-blue-700 text-sm space-y-1">
                    <li>• All fields marked with <span className="text-red-500">*</span> are mandatory</li>
                    <li>• Option E is optional and can be left empty</li>
                    <li>• For Past Interview Questions, fill in the interview details instead of options</li>
                    <li>• Our team will review your MCQ for accuracy before publishing</li>
                    <li>• You will be credited for your contribution</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center">
              <ReCaptchaButton
                onSubmit={handleSubmit}
                disabled={isSubmitting}
                className={`inline-flex items-center gap-2 px-8 py-4 rounded-lg font-semibold text-white transition-all duration-200 ${
                  isSubmitting 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl'
                }`}
                loadingText="Verifying..."
                action="submit_mcq"
              >
                <Send className="w-5 h-5" />
                Submit
              </ReCaptchaButton>
            </div>

            {/* Status Messages */}
            {submitStatus === 'success' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-green-800 font-medium">Submitted Successfully!</p>
                    <p className="text-green-700 text-sm">Thank you for your contribution. Our team will review it shortly.</p>
                  </div>
                </div>
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="text-red-800 font-medium">Submission Failed</p>
                    <p className="text-red-700 text-sm">Please fill in all required fields and try again.</p>
                  </div>
                </div>
              </div>
            )}

            {submitStatus === 'validation_error' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="text-yellow-800 font-medium">Please Fix the Errors</p>
                    <p className="text-yellow-700 text-sm">Please fill in all required fields correctly.</p>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Help us grow our MCQ and interview database and support the Pakistani community!
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubmitMcqs;