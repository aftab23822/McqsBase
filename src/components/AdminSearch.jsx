"use client";

import React, { useState } from 'react';
import { apiFetch } from '../utils/api';
import { Search, Loader2, Trash2, Edit2, X, Save } from 'lucide-react';

const TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'mcq', label: 'MCQs' },
  { value: 'pastpaper', label: 'Past Papers' },
  { value: 'interview', label: 'Past Interviews' },
];

export default function AdminSearch() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingType, setEditingType] = useState(null);
  const [editForm, setEditForm] = useState({
    // Shared (MCQ + PastPaper + Interview)
    question: '',
    explanation: '',
    year: '',
    department: '',
    // MCQ + PastPaper
    options: [],
    answer: '',
    link: '',
    // PastPaper only
    role: '',
    commission: '',
    // Interviews only
    interviewTitle: '',
    description: '',
    position: '',
    sharedBy: '',
    experience: '',
  });

  const handleSearch = async (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      setError('Please enter text to search');
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({
        q: trimmed,
        type,
        page: '1',
        limit: '50',
      }).toString();

      const res = await apiFetch(`/api/admin/search?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Search failed');
      }
      setResults(data.results || []);
    } catch (err) {
      setError(err.message || 'Search failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    const token = localStorage.getItem('adminToken');

    try {
      let url = '';
      if (item.type === 'mcq') {
        url = `/api/admin/mcqs/${item._id}`;
      } else if (item.type === 'pastpaper') {
        url = `/api/admin/pastpapers/${item._id}`;
      } else if (item.type === 'interview') {
        url = `/api/admin/interviews/${item._id}`;
      } else {
        return;
      }

      const res = await apiFetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Delete failed');
      }

      setResults((prev) => prev.filter((r) => r._id !== item._id));
    } catch (err) {
      alert(err.message || 'Delete failed');
    }
  };

  const startEdit = (item) => {
    setEditingId(item._id);
    setEditingType(item.type);

    if (item.type === 'interview') {
      setEditForm({
        question: '',
        explanation: '',
        year: item.year || '',
        department: item.department || '',
        options: [],
        answer: '',
        link: '',
        role: '',
        commission: '',
        interviewTitle: item.question || '',
        description: item.descriptionFull || item.preview || '',
        position: item.position || '',
        sharedBy: item.sharedBy || '',
        experience: item.experience || '',
      });
    } else if (item.type === 'pastpaper') {
      setEditForm({
        question: item.question || '',
        explanation: '',
        year: item.year || '',
        department: item.department || '',
        options: item.options || [],
        answer: item.answer || '',
        link: item.link || '',
        role: item.role || '',
        commission: item.commission || '',
        interviewTitle: '',
        description: '',
        position: '',
        sharedBy: '',
        experience: '',
      });
    } else {
      // mcq
      setEditForm({
        question: item.question || '',
        explanation: '',
        year: item.year || '',
        department: item.department || '',
        options: item.options || [],
        answer: item.answer || '',
        link: item.link || '',
        role: '',
        commission: '',
        interviewTitle: '',
        description: '',
        position: '',
        sharedBy: '',
        experience: '',
      });
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingType(null);
    setEditForm({
      question: '',
      explanation: '',
      year: '',
      department: '',
       // shared arrays/extra fields reset
      options: [],
      answer: '',
      link: '',
      role: '',
      commission: '',
      interviewTitle: '',
      description: '',
      position: '',
      sharedBy: '',
      experience: '',
    });
  };

  const saveEdit = async () => {
    if (!editingId || !editingType) return;
    const token = localStorage.getItem('adminToken');
    try {
      let url = '';
      let body = {};

      if (editingType === 'interview') {
        url = `/api/admin/interviews/${editingId}`;
        body = {
          interviewTitle: editForm.interviewTitle,
          description: editForm.description,
          year: editForm.year,
          department: editForm.department,
          position: editForm.position,
          sharedBy: editForm.sharedBy,
          experience: editForm.experience,
        };
      } else if (editingType === 'pastpaper') {
        url = `/api/admin/pastpapers/${editingId}`;
        body = {
          question: editForm.question,
          explanation: editForm.explanation,
          answer: editForm.answer,
          options: editForm.options,
          year: editForm.year,
          department: editForm.department,
          role: editForm.role,
          commission: editForm.commission,
          link: editForm.link,
        };
      } else if (editingType === 'mcq') {
        url = `/api/admin/mcqs/${editingId}`;
        body = {
          question: editForm.question,
          explanation: editForm.explanation,
          answer: editForm.answer,
          options: editForm.options,
          year: editForm.year,
          department: editForm.department,
          link: editForm.link,
        };
      } else {
        return;
      }

      const res = await apiFetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Update failed');
      }
      setResults((prev) =>
        prev.map((item) =>
          item._id === editingId
            ? editingType === 'interview'
              ? {
                  ...item,
                  question: editForm.interviewTitle,
                  preview: editForm.description.slice(0, 200),
                  year: editForm.year,
                  department: editForm.department,
                  position: editForm.position,
                  sharedBy: editForm.sharedBy,
                  experience: editForm.experience,
                }
              : {
                  ...item,
                  question: editForm.question,
                  preview: editForm.question,
                  year: editForm.year,
                  department: editForm.department,
                  role: editingType === 'pastpaper' ? editForm.role : item.role,
                  commission:
                    editingType === 'pastpaper' ? editForm.commission : item.commission,
                  options: editForm.options,
                  answer: editForm.answer,
                  link: editForm.link,
                }
            : item
        )
      );
      cancelEdit();
    } catch (err) {
      alert(err.message || 'Update failed');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <Search className="w-5 h-5 text-indigo-600" />
        Search & Edit Content
      </h2>
      <p className="text-sm text-gray-600">
        Search across MCQs, Past Papers, and Past Interviews by plain text, then edit or delete
        matching records from a single screen.
      </p>

      <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3 items-stretch md:items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search text
          </label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type any part of question, interview title, or description…"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <div className="w-full md:w-52">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full md:w-auto">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-2 mt-1.5 md:mt-0 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Searching…
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Search
              </>
            )}
          </button>
        </div>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="border-t border-gray-200 pt-4">
        {results.length === 0 && !isLoading ? (
          <p className="text-sm text-gray-500">No results yet. Run a search to see matching records.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {results.map((item) => (
              <li key={item._id} className="py-3 border-b border-gray-100 last:border-b-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                        {item.type}
                      </span>
                      {item.year && (
                        <span className="text-xs text-gray-500">Year: {item.year}</span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {item.question}
                    </p>
                    {item.preview && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {item.preview}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      <Edit2 className="w-3 h-3" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </div>

                {editingId === item._id && (
                  <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          {item.type === 'interview' ? 'Interview Title' : 'Question'}
                        </label>
                        <input
                          type="text"
                          value={
                            item.type === 'interview'
                              ? editForm.interviewTitle
                              : editForm.question
                          }
                          onChange={(e) =>
                            setEditForm((prev) =>
                              item.type === 'interview'
                                ? { ...prev, interviewTitle: e.target.value }
                                : { ...prev, question: e.target.value }
                            )
                          }
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Year
                        </label>
                        <input
                          type="number"
                          value={editForm.year}
                          onChange={(e) =>
                            setEditForm((prev) => ({ ...prev, year: e.target.value }))
                          }
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {item.type === 'interview' ? (
                        <>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Position
                            </label>
                            <input
                              type="text"
                              value={editForm.position}
                              onChange={(e) =>
                                setEditForm((prev) => ({ ...prev, position: e.target.value }))
                              }
                              className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Department (topic)
                            </label>
                            <input
                              type="text"
                              value={editForm.department}
                              onChange={(e) =>
                                setEditForm((prev) => ({ ...prev, department: e.target.value }))
                              }
                              className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Department
                            </label>
                            <input
                              type="text"
                              value={editForm.department}
                              onChange={(e) =>
                                setEditForm((prev) => ({ ...prev, department: e.target.value }))
                              }
                              className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                          </div>
                          {item.type === 'pastpaper' && (
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Role
                              </label>
                              <input
                                type="text"
                                value={editForm.role}
                                onChange={(e) =>
                                  setEditForm((prev) => ({ ...prev, role: e.target.value }))
                                }
                                className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              />
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {item.type === 'pastpaper' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Commission
                          </label>
                          <input
                            type="text"
                            value={editForm.commission}
                            onChange={(e) =>
                              setEditForm((prev) => ({ ...prev, commission: e.target.value }))
                            }
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Detail Link
                          </label>
                          <input
                            type="text"
                            value={editForm.link}
                            onChange={(e) =>
                              setEditForm((prev) => ({ ...prev, link: e.target.value }))
                            }
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    )}

                    {(item.type === 'mcq' || item.type === 'pastpaper') && (
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Options
                        </label>
                        {editForm.options.map((opt, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 w-4">
                              {String.fromCharCode(65 + idx)}.
                            </span>
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const next = [...editForm.options];
                                next[idx] = e.target.value;
                                setEditForm((prev) => ({ ...prev, options: next }));
                              }}
                              className="flex-1 px-2 py-1 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() =>
                            setEditForm((prev) => ({
                              ...prev,
                              options: [...prev.options, ''],
                            }))
                          }
                          className="text-[11px] text-indigo-600 hover:text-indigo-800"
                        >
                          + Add option
                        </button>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Correct Answer
                          </label>
                          <input
                            type="text"
                            value={editForm.answer}
                            onChange={(e) =>
                              setEditForm((prev) => ({ ...prev, answer: e.target.value }))
                            }
                            className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        {item.type === 'interview'
                          ? 'Description'
                          : 'Explanation (optional)'}
                      </label>
                      <textarea
                        rows={4}
                        value={
                          item.type === 'interview'
                            ? editForm.description
                            : editForm.explanation
                        }
                        onChange={(e) =>
                          setEditForm((prev) =>
                            item.type === 'interview'
                              ? { ...prev, description: e.target.value }
                              : { ...prev, explanation: e.target.value }
                          )
                        }
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>

                    {item.type === 'interview' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Shared By
                          </label>
                          <input
                            type="text"
                            value={editForm.sharedBy}
                            onChange={(e) =>
                              setEditForm((prev) => ({ ...prev, sharedBy: e.target.value }))
                            }
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Experience
                          </label>
                          <input
                            type="text"
                            value={editForm.experience}
                            onChange={(e) =>
                              setEditForm((prev) => ({ ...prev, experience: e.target.value }))
                            }
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                      >
                        <X className="w-3 h-3" />
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={saveEdit}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-indigo-600 bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-700"
                      >
                        <Save className="w-3 h-3" />
                        Save
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

