"use client";

import React, { useEffect, useState } from 'react';
import { getUniversities } from '../data/categories/mockTestCategories';

const AdminMockTestsManager = () => {
  const [university, setUniversity] = useState('');
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', durationMinutes: 30 });

  const universities = getUniversities();

  const fetchTests = async () => {
    if (!university) return;
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`/api/mock-tests/${university}/`);
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
  }, [university]);

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
      const res = await fetch(`/api/mock-tests/${university}/${editing}`, {
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
      const res = await fetch(`/api/mock-tests/${university}/${slug}`, {
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
          value={university}
          onChange={(e) => setUniversity(e.target.value)}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="">Select University</option>
          {universities.map(u => (
            <option key={u.slug} value={u.slug}>{u.label}</option>
          ))}
        </select>
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


