"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '../utils/api';
import { Edit2, FileText, Globe2, Plus, Save, Search, Trash2, X } from 'lucide-react';

const emptyForm = {
  title: '',
  excerpt: '',
  category: 'Exam Guide',
  body: '',
  seoTitle: '',
  primaryKeyword: '',
  seoUri: '',
  metaDescription: '',
  seoKeywords: '',
  status: 'published',
  author: 'McqsBase Team'
};

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180);
}

function formatDate(value) {
  if (!value) return 'Not published';
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

const AdminBlogManager = () => {
  const [blogs, setBlogs] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const publicUrl = useMemo(() => {
    if (!form.seoUri) return '';
    return `/blog/${form.seoUri}`;
  }, [form.seoUri]);

  const fetchBlogs = async () => {
    setIsLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({ limit: '50' });
      if (search.trim()) params.set('search', search.trim());
      if (status) params.set('status', status);

      const response = await apiFetch(`/api/admin/blogs?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || 'Failed to load blogs');
        return;
      }
      setBlogs(data.data || []);
    } catch (err) {
      setError('Network error while loading blogs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const updateField = (name, value) => {
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'title') {
        if (!prev.seoTitle || prev.seoTitle === prev.title) {
          next.seoTitle = value;
        }
        if (!prev.seoUri || prev.seoUri === slugify(prev.title)) {
          next.seoUri = slugify(value);
        }
      }
      if (name === 'excerpt' && (!prev.metaDescription || prev.metaDescription === prev.excerpt)) {
        next.metaDescription = value;
      }
      if (name === 'seoUri') {
        next.seoUri = slugify(value);
      }
      return next;
    });
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setMessage('');
    setError('');
  };

  const handleEdit = (blog) => {
    setEditingId(blog._id);
    setForm({
      title: blog.title || '',
      excerpt: blog.excerpt || '',
      category: blog.category || 'Exam Guide',
      body: blog.body || '',
      seoTitle: blog.seoTitle || blog.title || '',
      primaryKeyword: blog.primaryKeyword || '',
      seoUri: blog.seoUri || '',
      metaDescription: blog.metaDescription || blog.excerpt || '',
      seoKeywords: Array.isArray(blog.seoKeywords) ? blog.seoKeywords.join(', ') : '',
      status: blog.status || 'published',
      author: blog.author || 'McqsBase Team'
    });
    setMessage('');
    setError('');
  };

  const validateForm = () => {
    const required = ['title', 'body', 'seoTitle', 'primaryKeyword', 'seoUri', 'metaDescription'];
    const missing = required.filter((key) => !form[key].trim());
    if (missing.length) {
      setError('Please fill title, content, SEO title, primary keyword, SEO URI, and meta description.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    setError('');
    setMessage('');

    try {
      const token = localStorage.getItem('adminToken');
      const response = await apiFetch(editingId ? `/api/admin/blogs/${editingId}` : '/api/admin/blogs', {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || 'Failed to save blog');
        return;
      }
      setMessage(editingId ? 'Blog updated successfully.' : 'Blog published successfully.');
      resetForm();
      await fetchBlogs();
    } catch (err) {
      setError('Network error while saving blog');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (blog) => {
    const confirmed = window.confirm(`Delete "${blog.title}"?`);
    if (!confirmed) return;

    setError('');
    setMessage('');
    try {
      const token = localStorage.getItem('adminToken');
      const response = await apiFetch(`/api/admin/blogs/${blog._id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.message || 'Failed to delete blog');
        return;
      }
      setMessage('Blog deleted successfully.');
      if (editingId === blog._id) resetForm();
      await fetchBlogs();
    } catch (err) {
      setError('Network error while deleting blog');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            Blog Management
          </h2>
        </div>
        <button
          type="button"
          onClick={resetForm}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" />
          New Blog
        </button>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>}
      {message && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700">{message}</div>}

      <form onSubmit={handleSubmit} className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Blog Title</label>
            <input
              value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Complete Guide to NTS Preparation"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
            <input
              value={form.category}
              onChange={(e) => updateField('category', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Exam Guide"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Short Excerpt</label>
          <textarea
            value={form.excerpt}
            onChange={(e) => updateField('excerpt', e.target.value)}
            rows={2}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="A short summary shown on the blog listing."
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">SEO Title</label>
            <input
              value={form.seoTitle}
              onChange={(e) => updateField('seoTitle', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Primary Keyword</label>
            <input
              value={form.primaryKeyword}
              onChange={(e) => updateField('primaryKeyword', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="nts preparation"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">SEO URI</label>
            <input
              value={form.seoUri}
              onChange={(e) => updateField('seoUri', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="nts-preparation-guide"
            />
            {publicUrl && (
              <Link href={publicUrl} target="_blank" className="mt-2 inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700">
                <Globe2 className="w-4 h-4" />
                {publicUrl}
              </Link>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">SEO Keywords</label>
            <input
              value={form.seoKeywords}
              onChange={(e) => updateField('seoKeywords', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="nts mcqs, nts test preparation, pakistan exams"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Meta Description</label>
          <textarea
            value={form.metaDescription}
            onChange={(e) => updateField('metaDescription', e.target.value)}
            rows={2}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Write a search-friendly description for Google results."
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Blog Content</label>
          <textarea
            value={form.body}
            onChange={(e) => updateField('body', e.target.value)}
            rows={16}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
            placeholder={`## Introduction\nWrite paragraphs here.\n\n## Comparison Table\n| Feature | McqsBase | Other Sites |\n| --- | --- | --- |\n| Practice | Structured | Scattered |\n\n- Add bullet points\n1. Add numbered steps`}
          />
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-gray-700">Status</label>
            <select
              value={form.status}
              onChange={(e) => updateField('status', e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
          <div className="flex gap-3">
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isSaving}
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white ${isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : editingId ? 'Update Blog' : 'Publish Blog'}
            </button>
          </div>
        </div>
      </form>

      <div className="border-t border-gray-200 pt-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Existing Blogs</h3>
          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
            <div className="flex">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="min-w-0 px-3 py-2 border border-gray-300 rounded-l-lg"
                placeholder="Search blogs"
              />
              <button
                type="button"
                onClick={fetchBlogs}
                className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-r-lg"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Loading blogs...</div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-8 text-gray-500 border border-dashed border-gray-300 rounded-lg">No blogs found.</div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">Title</th>
                  <th className="px-4 py-3 font-semibold">URI</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Updated</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {blogs.map((blog) => (
                  <tr key={blog._id} className="border-t border-gray-100">
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-xs">{blog.title}</td>
                    <td className="px-4 py-3 text-indigo-600">
                      <Link href={`/blog/${blog.seoUri}`} target="_blank">/blog/{blog.seoUri}</Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${blog.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {blog.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(blog.updatedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(blog)}
                          className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50"
                          title="Edit blog"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(blog)}
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                          title="Delete blog"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBlogManager;
