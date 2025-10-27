"use client";

import React, { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';
import { CheckCircle, XCircle, Edit2, Loader2, X, Save, Eye } from 'lucide-react';

const mapSubmissionToMcq = (item) => {
  // Get options array
  const options = item.options
    ? Object.values(item.options).filter(Boolean)
    : item.optionsArray || [];
  
  // Convert correct answer letter to full answer text
  let correctAnswerText = item.correctAnswer || item.correct_option;
  if (correctAnswerText && options.length > 0) {
    // If it's a single letter (A, B, C, D), convert to full text
    if (/^[A-D]$/.test(correctAnswerText.trim())) {
      const index = correctAnswerText.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
      if (index >= 0 && index < options.length) {
        correctAnswerText = options[index];
      }
    }
  }
  
  // Map user submission fields to MCQ fields
  return {
    question: item.question,
    options: options,
    correct_option: correctAnswerText,
    detail_link: item.detail_link || '',
    submitter: item.username || item.sharedBy || '',
    explanation: item.explanation || '',
    category: item.category || '', // Send category name instead of ID
  };
};

const mapSubmissionToPastPaper = (item) => {
  // Get options array
  const options = item.options
    ? Object.values(item.options).filter(Boolean)
    : item.optionsArray || [];
  
  // Convert correct answer letter to full answer text
  let correctAnswerText = item.correctAnswer || item.correct_option;
  if (correctAnswerText && options.length > 0) {
    // If it's a single letter (A, B, C, D), convert to full text
    if (/^[A-D]$/.test(correctAnswerText.trim())) {
      const index = correctAnswerText.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
      if (index >= 0 && index < options.length) {
        correctAnswerText = options[index];
      }
    }
  }
  
  // Map user submission fields to Past Paper fields
  return {
    question: item.question,
    options: options,
    correct_option: correctAnswerText,
    detail_link: item.detail_link || '',
    submitter: item.username || item.sharedBy || '',
    explanation: item.explanation || '',
    category: item.category || '', // Send category name instead of ID
    year: item.year || new Date().getFullYear(),
    department: item.department || '',
  };
};

const mapSubmissionToPastInterview = (item) => {
  // Map user submission fields to Past Interview fields
  return {
    question: item.question,
    answer: item.answer || item.correctAnswer || '',
    detail_link: item.detail_link || '',
    submitter: item.username || item.sharedBy || '',
    explanation: item.explanation || '',
    category: item.category || '', // Send category name instead of ID
    year: item.year || new Date().getFullYear(),
    department: item.department || '',
    position: item.position || '',
    experience: item.experience || '',
  };
};

const AdminUserSubmissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rowLoading, setRowLoading] = useState({});
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [expandedRows, setExpandedRows] = useState(new Set());

  useEffect(() => {
    const fetchSubmissions = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('adminToken');
        const response = await apiFetch('/api/admin/submissions/?status=pending', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (response.ok && data.success) {
          setSubmissions(data.data.results);
        } else {
          setError(data.message || 'Failed to fetch submissions');
        }
      } catch (err) {
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, []);

  const toggleRowExpansion = (itemId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedRows(newExpanded);
  };

  const renderOptions = (options) => {
    if (!options) return <span className="text-gray-500">No options</span>;
    
    if (typeof options === 'object') {
      return (
        <div className="space-y-1">
          {Object.entries(options).map(([key, value]) => (
            <div key={key} className="text-sm">
              <span className="font-medium text-gray-600">{key}:</span> {value}
            </div>
          ))}
        </div>
      );
    }
    
    if (Array.isArray(options)) {
      return (
        <div className="space-y-1">
          {options.map((option, index) => (
            <div key={index} className="text-sm">
              <span className="font-medium text-gray-600">{String.fromCharCode(65 + index)}:</span> {option}
            </div>
          ))}
        </div>
      );
    }
    
    return <span className="text-gray-500">Invalid options format</span>;
  };

  const renderExpandedDetails = (item) => {
    return (
      <tr key={`${item._id}-details`} className="bg-gray-50">
        <td colSpan="6" className="px-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Column */}
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Question Details</h4>
                <p className="text-sm text-gray-800 bg-white p-3 rounded border">{item.question}</p>
              </div>
              
              {item.type !== 'interview' && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Options</h4>
                  <div className="bg-white p-3 rounded border">
                    {renderOptions(item.options)}
                  </div>
                </div>
              )}
              
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Correct Answer</h4>
                <p className="text-sm text-green-700 bg-green-50 p-2 rounded font-medium">
                  {item.correctAnswer || item.answer || 'Not specified'}
                </p>
              </div>
            </div>
            
            {/* Right Column */}
            <div className="space-y-3">
              {item.type === 'interview' && (
                <>
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Position</h4>
                    <p className="text-sm text-gray-800 bg-white p-2 rounded border">{item.position || 'Not specified'}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Department</h4>
                    <p className="text-sm text-gray-800 bg-white p-2 rounded border">{item.department || 'Not specified'}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Year</h4>
                    <p className="text-sm text-gray-800 bg-white p-2 rounded border">{item.year || 'Not specified'}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Experience</h4>
                    <p className="text-sm text-gray-800 bg-white p-2 rounded border">{item.experience || 'Not specified'}</p>
                  </div>
                </>
              )}
              
              {item.type !== 'interview' && (
                <>
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Category</h4>
                    <p className="text-sm text-gray-800 bg-white p-2 rounded border">{item.category || 'Not specified'}</p>
                  </div>
                  
                  {item.type === 'pastpaper' && (
                    <>
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2">Year</h4>
                        <p className="text-sm text-gray-800 bg-white p-2 rounded border">{item.year || 'Not specified'}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2">Department</h4>
                        <p className="text-sm text-gray-800 bg-white p-2 rounded border">{item.department || 'Not specified'}</p>
                      </div>
                    </>
                  )}
                </>
              )}
              
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Submitted By</h4>
                <p className="text-sm text-gray-800 bg-white p-2 rounded border">{item.username || item.sharedBy || 'Anonymous'}</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Submitted On</h4>
                <p className="text-sm text-gray-800 bg-white p-2 rounded border">
                  {new Date(item.createdAt).toLocaleDateString()} at {new Date(item.createdAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        </td>
      </tr>
    );
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setEditForm({
      question: item.question || '',
      options: item.options ? Object.values(item.options).filter(Boolean) : item.optionsArray || [],
      correct_option: item.correctAnswer || item.correct_option || '',
      detail_link: item.detail_link || '',
      explanation: item.explanation || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    
    setRowLoading((prev) => ({ ...prev, [editingItem._id]: 'edit' }));
    try {
      const token = localStorage.getItem('adminToken');
              const response = await apiFetch(`/api/admin/submissions/${editingItem._id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update submission');
      }
      
      const data = await response.json();
      
      // Update the item in the local state
      setSubmissions(prev => prev.map(item => 
        item._id === editingItem._id 
          ? { ...item, ...data.data }
          : item
      ));
      
      setEditingItem(null);
      setEditForm({});
    } catch (err) {
      alert(err.message || 'Error updating submission');
    } finally {
      setRowLoading((prev) => ({ ...prev, [editingItem._id]: null }));
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditForm({});
  };

  const handleApprove = async (item) => {
    setRowLoading((prev) => ({ ...prev, [item._id]: 'approve' }));
    try {
      const token = localStorage.getItem('adminToken');
      
      // 1. Save to appropriate database based on type
      let saveResponse;
      
      if (item.type === 'simple' || item.type === 'pastpaper') {
        // Save to MCQs or Past Papers table
        const payload = item.type === 'simple' 
          ? mapSubmissionToMcq(item)
          : mapSubmissionToPastPaper(item);
        
        saveResponse = await apiFetch('/api/mcqs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else if (item.type === 'interview') {
        // Save to Past Interviews table
        const payload = mapSubmissionToPastInterview(item);
        
        saveResponse = await apiFetch('/api/interviews', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        throw new Error(`Unknown submission type: ${item.type}`);
      }
      
      if (!saveResponse.ok) {
        throw new Error('Failed to save to database');
      }
      
      // 2. Mark as approved
      const patchRes = await apiFetch(`/api/admin/submissions/${item._id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'approved' })
      });
      if (!patchRes.ok) {
        throw new Error('Failed to update submission status');
      }
      
      // 3. Remove from UI
      setSubmissions((prev) => prev.filter((s) => s._id !== item._id));
    } catch (err) {
      alert(err.message || 'Error approving submission');
    } finally {
      setRowLoading((prev) => ({ ...prev, [item._id]: null }));
    }
  };

  const handleReject = async (item) => {
    setRowLoading((prev) => ({ ...prev, [item._id]: 'reject' }));
    try {
      const token = localStorage.getItem('adminToken');
      const patchRes = await apiFetch(`/api/admin/submissions/${item._id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'rejected' })
      });
      if (!patchRes.ok) {
        throw new Error('Failed to update submission status');
      }
      setSubmissions((prev) => prev.filter((s) => s._id !== item._id));
    } catch (err) {
      alert(err.message || 'Error rejecting submission');
    } finally {
      setRowLoading((prev) => ({ ...prev, [item._id]: null }));
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        User Submissions Review
      </h2>
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-center">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      ) : submissions.length === 0 ? (
        <div className="text-gray-600 text-center py-12">
          <p className="text-lg">No pending user submissions.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Type</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Question</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Submitted By</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Date</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {submissions.map((item) => (
                <React.Fragment key={item._id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        item.type === 'simple' ? 'bg-blue-100 text-blue-800' :
                        item.type === 'pastpaper' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-w-xs">
                        <p className="text-sm text-gray-800 truncate">{item.question}</p>
                        {item.type !== 'interview' && item.correctAnswer && (
                          <p className="text-xs text-green-600 mt-1">
                            Answer: {item.correctAnswer}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800">{item.username || item.sharedBy || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-xs font-semibold"
                          onClick={() => toggleRowExpansion(item._id)}
                          title="View Details"
                        >
                          <Eye className="w-3 h-3" />
                          {expandedRows.has(item._id) ? 'Hide' : 'View'}
                        </button>
                        <button
                          className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-xs font-semibold disabled:opacity-60"
                          onClick={() => handleApprove(item)}
                          disabled={rowLoading[item._id]}
                          title="Approve"
                        >
                          {rowLoading[item._id] === 'approve' ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <CheckCircle className="w-3 h-3" />
                          )}
                          Approve
                        </button>
                        <button
                          className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-xs font-semibold disabled:opacity-60"
                          onClick={() => handleReject(item)}
                          disabled={rowLoading[item._id]}
                          title="Reject"
                        >
                          {rowLoading[item._id] === 'reject' ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          Reject
                        </button>
                        <button 
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs font-semibold disabled:opacity-60"
                          onClick={() => handleEdit(item)}
                          disabled={rowLoading[item._id]}
                          title="Edit"
                        >
                          <Edit2 className="w-3 h-3" />
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedRows.has(item._id) && renderExpandedDetails(item)}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Submission</h3>
              <button
                onClick={handleCancelEdit}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Question <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={editForm.question}
                  onChange={(e) => setEditForm(prev => ({ ...prev, question: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                  required
                />
              </div>

              {editingItem.type !== 'interview' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Options <span className="text-red-500">*</span>
                  </label>
                  {editForm.options.map((option, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...editForm.options];
                          newOptions[index] = e.target.value;
                          setEditForm(prev => ({ ...prev, options: newOptions }));
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder={`Option ${index + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newOptions = editForm.options.filter((_, i) => i !== index);
                          setEditForm(prev => ({ ...prev, options: newOptions }));
                        }}
                        className="px-2 py-2 text-red-600 hover:text-red-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setEditForm(prev => ({ ...prev, options: [...prev.options, ''] }))}
                    className="text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    + Add Option
                  </button>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {editingItem.type === 'interview' ? 'Answer' : 'Correct Answer'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.correct_option}
                  onChange={(e) => setEditForm(prev => ({ ...prev, correct_option: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Detail Link
                </label>
                <input
                  type="url"
                  value={editForm.detail_link}
                  onChange={(e) => setEditForm(prev => ({ ...prev, detail_link: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Explanation
                </label>
                <textarea
                  value={editForm.explanation}
                  onChange={(e) => setEditForm(prev => ({ ...prev, explanation: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={rowLoading[editingItem._id]}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-60"
              >
                {rowLoading[editingItem._id] === 'edit' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserSubmissions; 