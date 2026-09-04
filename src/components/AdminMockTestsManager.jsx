"use client";

import React, { useEffect, useState } from 'react';
import {
  getMockTestCategories as getStaticMockTestCategories,
  getUniversities as getStaticUniversities
} from '../data/categories/mockTestCategories';

const AdminMockTestsManager = () => {
  const [category, setCategory] = useState('');
  const [targetSlug, setTargetSlug] = useState('');
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', durationMinutes: 30 });

  const [categories, setCategories] = useState(() => getStaticMockTestCategories());
  const [universities, setUniversities] = useState(() => getStaticUniversities());

  useEffect(() => {
    let cancelled = false;
    fetch('/api/categories/structure?type=mock-tests')
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled && j?.success) {
          if (Array.isArray(j.data?.categories) && j.data.categories.length) {
            setCategories(j.data.categories);
          }
          if (Array.isArray(j.data?.universities) && j.data.universities.length) {
            setUniversities(j.data.universities);
          }
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchTests = async () => {
    const resolvedTarget = category === 'universities' ? targetSlug : category;
    if (!category || !resolvedTarget) return;
    try {
      setLoading(true);
      setError('');
      const categoryQuery = category !== 'universities' ? `?category=${category}` : '';
      const res = await fetch(`/api/mock-tests/${resolvedTarget}${categoryQuery}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed');
      setTests(json.data || []);
    } catch (e) {
      setError(e.message);
      setTests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, targetSlug]);

  const onEdit = (t) => {
    setEditing(t.slug);
    setEditForm({ name: t.name, durationMinutes: t.durationMinutes || 30 });
  };

  const onCancel = () => {
    setEditing(null);
    setEditForm({ name: '', durationMinutes: 30 });
  };

  const onSave = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const resolvedTarget = category === 'universities' ? targetSlug : category;
      const categoryQuery = category !== 'universities' ? `?category=${category}` : '';
      const res = await fetch(`/api/mock-tests/${resolvedTarget}/${editing}${categoryQuery}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : undefined,
        },
        body: JSON.stringify({ mockTestName: editForm.name, durationMinutes: Number(editForm.durationMinutes) || 30 })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Update failed');
      setEditing(null);
      setEditForm({ name: '', durationMinutes: 30 });
      fetchTests();
    } catch (e) {
      alert(e.message);
    }
  };

  const onDelete = async (slug) => {
    if (!confirm('Delete this mock test?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      const resolvedTarget = category === 'universities' ? targetSlug : category;
      const categoryQuery = category !== 'universities' ? `?category=${category}` : '';
      const res = await fetch(`/api/mock-tests/${resolvedTarget}/${slug}${categoryQuery}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : undefined,
        }
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Delete failed');
      fetchTests();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Manage Mock Tests</h2>
      <div className="flex items-center gap-3">
        <select
          value={category}
          onChange={(e) => {
            const value = e.target.value;
            setCategory(value);
            setTargetSlug('');
            setTests([]);
          }}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="">Select Category</option>
          {categories.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        {category === 'universities' && (
          <select
            value={targetSlug}
            onChange={(e) => setTargetSlug(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="">Select University</option>
            {universities.map(u => (
              <option key={u.slug} value={u.slug}>{u.label}</option>
            ))}
          </select>
        )}
        {category && category !== 'universities' && (
          <span className="px-3 py-2 text-sm text-gray-700 bg-gray-50 border rounded-lg">
            {categories.find(c => c.value === category)?.label || category}
          </span>
        )}
        <button onClick={fetchTests} className="px-3 py-2 border rounded-lg bg-white hover:bg-gray-50">Refresh</button>
      </div>

      {loading && <div>Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}

      {!loading && !error && tests.length > 0 && (
        <div className="space-y-3">
          {tests.map(t => (
            <div key={t.slug} className="p-4 border rounded-lg bg-white flex items-center justify-between gap-4">
              {editing === t.slug ? (
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className="px-3 py-2 border rounded-lg"
                    placeholder="Mock Test Name"
                  />
                  <input
                    type="number"
                    value={editForm.durationMinutes}
                    onChange={(e) => setEditForm(prev => ({ ...prev, durationMinutes: e.target.value }))}
                    className="px-3 py-2 border rounded-lg"
                    placeholder="Duration (min)"
                    min={5}
                    max={240}
                  />
                  <div className="flex items-center gap-2">
                    <button onClick={onSave} className="px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">Save</button>
                    <button onClick={onCancel} className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{t.name}</div>
                    <div className="text-sm text-gray-600">Duration: {t.durationMinutes} min • Questions: {t.questionCount || t.questions?.length || 0}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => onEdit(t)} className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50">Edit</button>
                    <button onClick={() => onDelete(t.slug)} className="px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700">Delete</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminMockTestsManager;


