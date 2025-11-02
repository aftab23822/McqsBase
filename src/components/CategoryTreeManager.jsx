"use client";

import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Plus, Edit2, Trash2, GripVertical, Building2, Folder, Save, X, Landmark, MapPin, Building, School, Hospital, Briefcase, Users, BookOpen, GraduationCap, Award, Shield, Globe, Calendar, ArrowUp, ArrowDown } from 'lucide-react';
import { apiFetch } from '../utils/api';

// Available icons for picker
const AVAILABLE_ICONS = [
  { name: 'Building2', component: Building2, label: 'Building 2' },
  { name: 'Landmark', component: Landmark, label: 'Landmark' },
  { name: 'MapPin', component: MapPin, label: 'Map Pin' },
  { name: 'Building', component: Building, label: 'Building' },
  { name: 'School', component: School, label: 'School' },
  { name: 'Hospital', component: Hospital, label: 'Hospital' },
  { name: 'Briefcase', component: Briefcase, label: 'Briefcase' },
  { name: 'Users', component: Users, label: 'Users' },
  { name: 'BookOpen', component: BookOpen, label: 'Book' },
  { name: 'GraduationCap', component: GraduationCap, label: 'Graduation' },
  { name: 'Award', component: Award, label: 'Award' },
  { name: 'Shield', component: Shield, label: 'Shield' },
  { name: 'Globe', component: Globe, label: 'Globe' },
  { name: 'Calendar', component: Calendar, label: 'Calendar' },
];

// Icon component map for rendering
const iconMap = {
  Building2,
  Landmark,
  MapPin,
  Building,
  School,
  Hospital,
  Briefcase,
  Users,
  BookOpen,
  GraduationCap,
  Award,
  Shield,
  Globe,
  Calendar,
};

/**
 * CategoryTreeManager Component
 * 
 * Displays categories in a tree structure and allows:
 * - Viewing all categories, commissions, departments, and roles
 * - Adding new items at any level
 * - Editing existing items
 * - Deleting items
 * - Reordering items (via drag and drop or up/down buttons)
 */

const CategoryTreeManager = ({ type }) => {
  const [structure, setStructure] = useState(null);
  const [draftStructure, setDraftStructure] = useState(null); // Draft changes before saving
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [editingItem, setEditingItem] = useState(null);
  const [showAddForm, setShowAddForm] = useState(null); // Format: { level, parentId, parentTitle }
  const [newItemData, setNewItemData] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: string }

  // Fetch category structure
  useEffect(() => {
    if (type) {
      fetchStructure();
    }
  }, [type]);

  const fetchStructure = async (forceRefresh = false) => {
    setLoading(true);
    try {
      // Add cache-busting parameter when force refreshing
      const cacheBuster = forceRefresh ? `&_=${Date.now()}` : '';
      const response = await fetch(`/api/categories/structure?type=${type}${cacheBuster}`);
      if (response.ok) {
        const data = await response.json();
        const newStructure = data.data;
        setStructure(newStructure);
        // Update draft structure to match the freshly loaded structure
        setDraftStructure(JSON.parse(JSON.stringify(newStructure))); // Deep copy for draft
        setHasChanges(false);
        // Reset form states
        setShowAddForm(null);
        setNewItemData({});
        setEditingItem(null);
      }
    } catch (error) {
      console.error('Error fetching structure:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  // Generate slug from text
  const generateSlug = (text) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters except hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();
  };

  // Auto-generate role link
  const generateRoleLink = (roleLabel, commissionTitle, departmentLabel, type) => {
    const typePath = type === 'past-papers' ? 'papers' : 'interviews';
    const commSlug = generateSlug(commissionTitle);
    const deptSlug = generateSlug(departmentLabel.replace(/^[^\w\s]+/, '')); // Remove emoji
    const roleSlug = generateSlug(roleLabel);
    return `/past-${typePath}/${commSlug}/${deptSlug}/${roleSlug}`;
  };

  // Add item to draft structure (doesn't save to file yet)
  const handleAddToDraft = (level, parentData = {}) => {
    if (!draftStructure) return;

    const newDraft = JSON.parse(JSON.stringify(draftStructure));

    if (type === 'mcqs' || type === 'mock-tests') {
      // Simple category structure
      if (type === 'mcqs') {
        if (!newDraft.categories) newDraft.categories = [];
        newDraft.categories.push({
          value: newItemData.value?.toLowerCase().replace(/\s+/g, '-') || '',
          label: newItemData.label || ''
        });
      } else {
        if (!newDraft.universities) newDraft.universities = [];
        newDraft.universities.push({
          label: newItemData.label || '',
          full: newItemData.full || newItemData.label || '',
          slug: newItemData.slug?.toLowerCase().replace(/\s+/g, '-') || newItemData.label?.toLowerCase().replace(/\s+/g, '-') || ''
        });
      }
    } else {
      // Hierarchical structure (Past Papers/Interviews)
      if (level === 'commission') {
        if (!newDraft.commissions) newDraft.commissions = [];
        newDraft.commissions.push({
          title: newItemData.title || '',
          icon: newItemData.icon || 'Building2',
          departments: []
        });
      } else if (level === 'department') {
        const commission = newDraft.commissions?.find(c => c.title === parentData.commissionTitle);
        if (commission) {
          if (!commission.departments) commission.departments = [];
          commission.departments.push({
            label: newItemData.label || '',
            roles: []
          });
        }
      } else if (level === 'role') {
        const commission = newDraft.commissions?.find(c => c.title === parentData.commissionTitle);
        const department = commission?.departments?.find(d => d.label === parentData.departmentLabel);
        if (department) {
          if (!department.roles) department.roles = [];
          // Use provided link or auto-generate if missing
          const roleLink = newItemData.link || generateRoleLink(
            newItemData.label || '',
            parentData.commissionTitle || '',
            parentData.departmentLabel || '',
            type
          );
          department.roles.push({
            label: newItemData.label || '',
            link: roleLink
          });
        }
      }
    }

    setDraftStructure(newDraft);
    setHasChanges(true);
    setShowAddForm(null);
    setNewItemData({});
  };

  // Save all draft changes to file
  const handleSaveChanges = async () => {
    if (!draftStructure || !hasChanges || !structure) return;

    setSaving(true);
    const token = localStorage.getItem('adminToken');
    
    try {
      // Compare draft with original to find changes
      // For now, we'll write the entire draft structure to file
      // Create a new API endpoint for bulk save
      const response = await apiFetch('/api/categories/structure/bulk', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          type,
          structure: draftStructure
        }),
      });

      if (response.ok) {
        // Reload the structure from the API to get the latest saved data (force refresh)
        await fetchStructure(true);
        // Show success message
        setMessage({ type: 'success', text: 'Changes saved successfully!' });
        // Auto-dismiss after 3 seconds
        setTimeout(() => setMessage(null), 3000);
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error || 'Failed to save changes' });
        setTimeout(() => setMessage(null), 5000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error saving changes: ' + error.message });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  // Discard all draft changes
  const handleDiscardChanges = () => {
    if (confirm('Are you sure you want to discard all unsaved changes?')) {
      setDraftStructure(JSON.parse(JSON.stringify(structure)));
      setHasChanges(false);
      setShowAddForm(null);
      setNewItemData({});
      setEditingItem(null);
    }
  };

  const handleDelete = (level, itemData, parentData = {}) => {
    if (!confirm(`Are you sure you want to delete this ${level}?`)) {
      return;
    }

    if (!draftStructure) return;

    const newDraft = JSON.parse(JSON.stringify(draftStructure));

    if (type === 'mcqs' || type === 'mock-tests') {
      // Simple category structure
      if (level === 'category') {
        if (type === 'mcqs') {
          newDraft.categories = newDraft.categories?.filter((_, idx) => idx !== itemData.index) || [];
        } else {
          newDraft.universities = newDraft.universities?.filter((_, idx) => idx !== itemData.index) || [];
        }
      }
    } else {
      // Hierarchical structure (Past Papers/Interviews)
      if (level === 'commission') {
        newDraft.commissions = newDraft.commissions?.filter((_, idx) => idx !== itemData.index) || [];
      } else if (level === 'department') {
        const commission = newDraft.commissions?.find(c => c.title === parentData.commissionTitle);
        if (commission) {
          commission.departments = commission.departments?.filter((_, idx) => idx !== itemData.index) || [];
        }
      } else if (level === 'role') {
        const commission = newDraft.commissions?.find(c => c.title === parentData.commissionTitle);
        const department = commission?.departments?.find(d => d.label === parentData.departmentLabel);
        if (department) {
          department.roles = department.roles?.filter((_, idx) => idx !== itemData.index) || [];
        }
      }
    }

    setDraftStructure(newDraft);
    setHasChanges(true);
  };

  // Handle edit item
  const handleEdit = (item) => {
    setEditingItem(item);
    // Populate form data with existing item data
    if (item.type === 'category') {
      setNewItemData({
        value: item.data.value || '',
        label: item.data.label || ''
      });
    } else if (item.type === 'commission') {
      let iconName = 'Building2';
      if (typeof item.data.icon === 'string') {
        iconName = item.data.icon;
      } else if (item.data.icon && typeof item.data.icon === 'function') {
        iconName = item.data.icon.name || item.data.icon.displayName || 'Building2';
      } else if (item.data.icon && typeof item.data.icon === 'object') {
        iconName = item.data.icon.name || item.data.icon.displayName || 'Building2';
      }
      setNewItemData({
        title: item.data.title || '',
        icon: iconName
      });
    } else if (item.type === 'department') {
      setNewItemData({
        label: item.data.label || ''
      });
    } else if (item.type === 'role') {
      setNewItemData({
        label: item.data.label || '',
        link: item.data.link || ''
      });
    }
  };

  // Move item up or down
  const handleMoveItem = (direction, level, itemIndex, parentData = {}) => {
    if (!draftStructure) return;

    const newDraft = JSON.parse(JSON.stringify(draftStructure));

    if (type === 'mcqs' || type === 'mock-tests') {
      // Simple category structure
      if (level === 'category') {
        const items = type === 'mcqs' ? newDraft.categories : newDraft.universities;
        if (!items || items.length < 2) return;
        
        const newIndex = direction === 'up' ? itemIndex - 1 : itemIndex + 1;
        if (newIndex < 0 || newIndex >= items.length) return;

        // Swap items
        [items[itemIndex], items[newIndex]] = [items[newIndex], items[itemIndex]];
        
        if (type === 'mcqs') {
          newDraft.categories = items;
        } else {
          newDraft.universities = items;
        }
      }
    } else {
      // Hierarchical structure (Past Papers/Interviews)
      if (level === 'commission') {
        if (!newDraft.commissions || newDraft.commissions.length < 2) return;
        
        const newIndex = direction === 'up' ? itemIndex - 1 : itemIndex + 1;
        if (newIndex < 0 || newIndex >= newDraft.commissions.length) return;

        // Swap commissions
        [newDraft.commissions[itemIndex], newDraft.commissions[newIndex]] = 
          [newDraft.commissions[newIndex], newDraft.commissions[itemIndex]];
      } else if (level === 'department') {
        const commission = newDraft.commissions?.find(c => c.title === parentData.commissionTitle);
        if (!commission || !commission.departments || commission.departments.length < 2) return;
        
        const newIndex = direction === 'up' ? itemIndex - 1 : itemIndex + 1;
        if (newIndex < 0 || newIndex >= commission.departments.length) return;

        // Swap departments
        [commission.departments[itemIndex], commission.departments[newIndex]] = 
          [commission.departments[newIndex], commission.departments[itemIndex]];
      } else if (level === 'role') {
        const commission = newDraft.commissions?.find(c => c.title === parentData.commissionTitle);
        const department = commission?.departments?.find(d => d.label === parentData.departmentLabel);
        if (!department || !department.roles || department.roles.length < 2) return;
        
        const newIndex = direction === 'up' ? itemIndex - 1 : itemIndex + 1;
        if (newIndex < 0 || newIndex >= department.roles.length) return;

        // Swap roles
        [department.roles[itemIndex], department.roles[newIndex]] = 
          [department.roles[newIndex], department.roles[itemIndex]];
      }
    }

    setDraftStructure(newDraft);
    setHasChanges(true);
  };

  // Save edited item
  const handleSaveEdit = (level, item) => {
    if (!draftStructure) return;

    const newDraft = JSON.parse(JSON.stringify(draftStructure));

    if (type === 'mcqs' || type === 'mock-tests') {
      // Simple category structure
      if (level === 'category') {
        if (type === 'mcqs') {
          if (newDraft.categories && newDraft.categories[item.index] !== undefined) {
            newDraft.categories[item.index] = {
              value: newItemData.value?.toLowerCase().replace(/\s+/g, '-') || '',
              label: newItemData.label || ''
            };
          }
        } else {
          if (newDraft.universities && newDraft.universities[item.index] !== undefined) {
            newDraft.universities[item.index] = {
              label: newItemData.label || '',
              full: newItemData.full || newItemData.label || '',
              slug: newItemData.slug?.toLowerCase().replace(/\s+/g, '-') || newItemData.label?.toLowerCase().replace(/\s+/g, '-') || ''
            };
          }
        }
      }
    } else {
      // Hierarchical structure (Past Papers/Interviews)
      if (level === 'commission') {
        if (newDraft.commissions && newDraft.commissions[item.index] !== undefined) {
          newDraft.commissions[item.index] = {
            ...newDraft.commissions[item.index],
            title: newItemData.title || '',
            icon: newItemData.icon || 'Building2'
          };
        }
      } else if (level === 'department') {
        const commission = newDraft.commissions?.find((_, idx) => idx === item.commissionIndex);
        if (commission && commission.departments && commission.departments[item.index] !== undefined) {
          commission.departments[item.index] = {
            ...commission.departments[item.index],
            label: newItemData.label || ''
          };
        }
      } else if (level === 'role') {
        const commission = newDraft.commissions?.find((_, idx) => idx === item.commissionIndex);
        const department = commission?.departments?.find((_, idx) => idx === item.departmentIndex);
        if (department && department.roles && department.roles[item.index] !== undefined) {
          department.roles[item.index] = {
            label: newItemData.label || '',
            link: newItemData.link || generateRoleLink(
              newItemData.label || '',
              commission?.title || '',
              department?.label || '',
              type
            )
          };
        }
      }
    }

    setDraftStructure(newDraft);
    setHasChanges(true);
    setEditingItem(null);
    setNewItemData({});
  };

  // Use draft structure if available, otherwise use original
  const displayStructure = draftStructure || structure;

  const renderMcqCategories = () => {
    if (!displayStructure?.categories) return null;

    return (
      <div className="space-y-2">
        {displayStructure.categories.map((category, index) => {
          const isEditing = editingItem?.type === 'category' && editingItem.index === index;
          
          return (
            <div key={index}>
              {isEditing ? (
                <div className="p-4 bg-yellow-50 rounded border border-yellow-300">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category Value (slug)</label>
                      <input
                        type="text"
                        value={newItemData.value || ''}
                        onChange={(e) => setNewItemData(prev => ({ ...prev, value: e.target.value }))}
                        placeholder="e.g., new-subject"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category Label</label>
                      <input
                        type="text"
                        value={newItemData.label || ''}
                        onChange={(e) => setNewItemData(prev => ({ ...prev, label: e.target.value }))}
                        placeholder="e.g., New Subject"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveEdit('category', editingItem)}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingItem(null);
                          setNewItemData({});
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                  <GripVertical className="w-4 h-4 text-gray-400" />
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleMoveItem('up', 'category', index)}
                      disabled={index === 0}
                      className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move up"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleMoveItem('down', 'category', index)}
                      disabled={index === displayStructure.categories.length - 1}
                      className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move down"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="flex-1">{category.label || category.value}</span>
                  <button
                    onClick={() => handleEdit({ type: 'category', index, data: category })}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete('category', { index })}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {showAddForm?.level === 'category' && (
          <div className="p-4 bg-blue-50 rounded border border-blue-200">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Value (slug)</label>
                <input
                  type="text"
                  value={newItemData.value || ''}
                  onChange={(e) => setNewItemData(prev => ({ ...prev, value: e.target.value }))}
                  placeholder="e.g., new-subject"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Label</label>
                <input
                  type="text"
                  value={newItemData.label || ''}
                  onChange={(e) => setNewItemData(prev => ({ ...prev, label: e.target.value }))}
                  placeholder="e.g., New Subject"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAddToDraft('category')}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Add to Draft
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(null);
                    setNewItemData({});
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        <button
          onClick={() => setShowAddForm({ level: 'category' })}
          className="w-full flex items-center gap-2 px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded border border-dashed border-indigo-300"
        >
          <Plus className="w-4 h-4" />
          Add New Category
        </button>
      </div>
    );
  };

  const renderHierarchicalStructure = () => {
    if (!displayStructure?.commissions) return null;

    return (
      <div className="space-y-2">
        {displayStructure.commissions.map((commission, commIndex) => {
          const commId = `comm-${commIndex}`;
          const isExpanded = expandedItems.has(commId);

          return (
            <div key={commIndex} className="border rounded-lg">
              {/* Commission Level */}
              {editingItem?.type === 'commission' && editingItem.index === commIndex ? (
                <div className="p-4 bg-yellow-50 border-b">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Commission Title</label>
                      <input
                        type="text"
                        value={newItemData.title || ''}
                        onChange={(e) => setNewItemData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g., SPSC"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                      <div className="grid grid-cols-7 gap-2 p-2 border border-gray-300 rounded-md bg-white max-h-48 overflow-y-auto">
                        {AVAILABLE_ICONS.map((iconItem) => {
                          const IconComponent = iconItem.component;
                          const isSelected = (newItemData.icon || 'Building2') === iconItem.name;
                          return (
                            <button
                              key={iconItem.name}
                              type="button"
                              onClick={() => setNewItemData(prev => ({ ...prev, icon: iconItem.name }))}
                              className={`p-2 rounded border-2 transition-all ${
                                isSelected
                                  ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                              }`}
                              title={iconItem.label}
                            >
                              <IconComponent className="w-5 h-5 mx-auto" />
                            </button>
                          );
                        })}
                      </div>
                      {newItemData.icon && (
                        <p className="mt-1 text-xs text-gray-500">Selected: {newItemData.icon}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveEdit('commission', editingItem)}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingItem(null);
                          setNewItemData({});
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-gray-50 border-b">
                  <button
                    onClick={() => toggleExpand(commId)}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  <GripVertical className="w-4 h-4 text-gray-400" />
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleMoveItem('up', 'commission', commIndex)}
                      disabled={commIndex === 0}
                      className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move up"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleMoveItem('down', 'commission', commIndex)}
                      disabled={commIndex === displayStructure.commissions.length - 1}
                      className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move down"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>
                  <Folder className="w-4 h-4 text-indigo-600" />
                  <span className="flex-1 font-semibold">{commission.title}</span>
                  <button
                    onClick={() => setShowAddForm({ level: 'department', parentId: commId, parentTitle: commission.title })}
                    className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                    title="Add Department"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEdit({ type: 'commission', index: commIndex, data: commission })}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete('commission', { index: commIndex })}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Departments */}
              {isExpanded && commission.departments && commission.departments.map((department, deptIndex) => {
                const deptId = `${commId}-dept-${deptIndex}`;
                const isDeptExpanded = expandedItems.has(deptId);

                return (
                  <div key={deptIndex} className="border-t">
                    {editingItem?.type === 'department' && editingItem.index === deptIndex && editingItem.commissionIndex === commIndex ? (
                      <div className="p-4 pl-12 bg-yellow-50 border-t">
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Department Label</label>
                            <input
                              type="text"
                              value={newItemData.label || ''}
                              onChange={(e) => setNewItemData(prev => ({ ...prev, label: e.target.value }))}
                              placeholder="e.g., College Education Department"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSaveEdit('department', editingItem)}
                              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setEditingItem(null);
                                setNewItemData({});
                              }}
                              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-2 pl-8 bg-white">
                        <button
                          onClick={() => toggleExpand(deptId)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          {isDeptExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                        <GripVertical className="w-4 h-4 text-gray-400" />
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => handleMoveItem('up', 'department', deptIndex, { commissionTitle: commission.title })}
                            disabled={deptIndex === 0}
                            className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Move up"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleMoveItem('down', 'department', deptIndex, { commissionTitle: commission.title })}
                            disabled={deptIndex === commission.departments.length - 1}
                            className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Move down"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="flex-1">{department.label}</span>
                        <button
                          onClick={() => setShowAddForm({
                            level: 'role',
                            parentId: deptId,
                            parentTitle: department.label,
                            commissionTitle: commission.title,
                            departmentLabel: department.label
                          })}
                          className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                          title="Add Role"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit({ type: 'department', index: deptIndex, commissionIndex: commIndex, data: department })}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete('department', { index: deptIndex }, { commissionTitle: commission.title })}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* Roles */}
                    {isDeptExpanded && department.roles && department.roles.map((role, roleIndex) => {
                      const isEditing = editingItem?.type === 'role' && editingItem.index === roleIndex && editingItem.departmentIndex === deptIndex && editingItem.commissionIndex === commIndex;
                      
                      return (
                        <div key={roleIndex}>
                          {isEditing ? (
                            <div className="p-4 pl-16 bg-yellow-50 border-t">
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Role Label</label>
                                  <input
                                    type="text"
                                    value={newItemData.label || ''}
                                    onChange={(e) => {
                                      const label = e.target.value;
                                      setNewItemData(prev => ({
                                        ...prev,
                                        label,
                                        // Auto-generate link when label changes (only if link hasn't been manually edited)
                                        link: prev.linkWasEdited ? prev.link : generateRoleLink(label, commission.title, department.label, type)
                                      }));
                                    }}
                                    placeholder="e.g., Lecturer Computer Science BPS‑17"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Role Link (URL path)
                                    <span className="text-xs text-gray-500 ml-2">(Auto-generated, editable)</span>
                                  </label>
                                  <input
                                    type="text"
                                    value={newItemData.link || generateRoleLink(newItemData.label || '', commission.title, department.label, type)}
                                    onChange={(e) => {
                                      setNewItemData(prev => ({
                                        ...prev,
                                        link: e.target.value,
                                        linkWasEdited: true // Mark as manually edited
                                      }));
                                    }}
                                    onFocus={(e) => {
                                      // If link is empty or auto-generated, populate it
                                      if (!e.target.value || e.target.value === generateRoleLink(newItemData.label || '', commission.title, department.label, type)) {
                                        const autoLink = generateRoleLink(newItemData.label || '', commission.title, department.label, type);
                                        setNewItemData(prev => ({
                                          ...prev,
                                          link: autoLink,
                                          linkWasEdited: false
                                        }));
                                      }
                                    }}
                                    placeholder={`/past-${type === 'past-papers' ? 'papers' : 'interviews'}/${commission.title.toLowerCase().replace(/\s+/g, '-')}/department-slug/role-slug`}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleSaveEdit('role', editingItem)}
                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingItem(null);
                                      setNewItemData({});
                                    }}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 p-2 pl-16 bg-gray-50 border-t">
                              <GripVertical className="w-4 h-4 text-gray-400" />
                              <div className="flex flex-col gap-1">
                                <button
                                  onClick={() => handleMoveItem('up', 'role', roleIndex, {
                                    commissionTitle: commission.title,
                                    departmentLabel: department.label
                                  })}
                                  disabled={roleIndex === 0}
                                  className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="Move up"
                                >
                                  <ArrowUp className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleMoveItem('down', 'role', roleIndex, {
                                    commissionTitle: commission.title,
                                    departmentLabel: department.label
                                  })}
                                  disabled={roleIndex === department.roles.length - 1}
                                  className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="Move down"
                                >
                                  <ArrowDown className="w-3 h-3" />
                                </button>
                              </div>
                              <span className="flex-1">{role.label}</span>
                              <button
                                onClick={() => handleEdit({
                                  type: 'role',
                                  index: roleIndex,
                                  departmentIndex: deptIndex,
                                  commissionIndex: commIndex,
                                  data: role
                                })}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete('role', { index: roleIndex }, {
                                  commissionTitle: commission.title,
                                  departmentLabel: department.label
                                })}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Add Role Form */}
                    {showAddForm?.level === 'role' && showAddForm?.parentId === deptId && (
                      <div className="p-4 pl-16 bg-blue-50 border-t">
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Role Label</label>
                            <input
                              type="text"
                              value={newItemData.label || ''}
                              onChange={(e) => {
                                const label = e.target.value;
                                setNewItemData(prev => ({
                                  ...prev,
                                  label,
                                  // Auto-generate link when label changes (only if link hasn't been manually edited)
                                  link: prev.linkWasEdited ? prev.link : generateRoleLink(label, commission.title, department.label, type)
                                }));
                              }}
                              placeholder="e.g., Lecturer Computer Science BPS‑17"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Role Link (URL path)
                              <span className="text-xs text-gray-500 ml-2">(Auto-generated, editable)</span>
                            </label>
                            <input
                              type="text"
                              value={newItemData.link || generateRoleLink(newItemData.label || '', commission.title, department.label, type)}
                              onChange={(e) => {
                                setNewItemData(prev => ({
                                  ...prev,
                                  link: e.target.value,
                                  linkWasEdited: true // Mark as manually edited
                                }));
                              }}
                              onFocus={(e) => {
                                // If link is empty or auto-generated, populate it
                                if (!e.target.value || e.target.value === generateRoleLink(newItemData.label || '', commission.title, department.label, type)) {
                                  const autoLink = generateRoleLink(newItemData.label || '', commission.title, department.label, type);
                                  setNewItemData(prev => ({
                                    ...prev,
                                    link: autoLink,
                                    linkWasEdited: false
                                  }));
                                }
                              }}
                              placeholder={`/past-${type === 'past-papers' ? 'papers' : 'interviews'}/${commission.title.toLowerCase().replace(/\s+/g, '-')}/department-slug/role-slug`}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAddToDraft('role', {
                                commissionTitle: commission.title,
                                departmentLabel: department.label
                              })}
                              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                            >
                              Add to Draft
                            </button>
                            <button
                              onClick={() => {
                                setShowAddForm(null);
                                setNewItemData({});
                              }}
                              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Add Department Form */}
              {showAddForm?.level === 'department' && showAddForm?.parentId === commId && (
                <div className="p-4 pl-8 bg-blue-50 border-t">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Department Name</label>
                      <input
                        type="text"
                        value={newItemData.label || ''}
                        onChange={(e) => setNewItemData(prev => ({ ...prev, label: e.target.value }))}
                        placeholder="e.g., 🏫 College Education Department"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddToDraft('department', { commissionTitle: commission.title })}
                        className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                      >
                        Add to Draft
                      </button>
                      <button
                        onClick={() => {
                          setShowAddForm(null);
                          setNewItemData({});
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Add Commission Form */}
        {showAddForm?.level === 'commission' && (
          <div className="p-4 bg-blue-50 rounded border border-blue-200">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Commission Name</label>
                <input
                  type="text"
                  value={newItemData.title || ''}
                  onChange={(e) => setNewItemData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., PPSC, NTS, Punjab Government"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                <div className="grid grid-cols-7 gap-2 p-2 border border-gray-300 rounded-md bg-white max-h-48 overflow-y-auto">
                  {AVAILABLE_ICONS.map((iconItem) => {
                    const IconComponent = iconItem.component;
                    const isSelected = (newItemData.icon || 'Building2') === iconItem.name;
                    return (
                      <button
                        key={iconItem.name}
                        type="button"
                        onClick={() => setNewItemData(prev => ({ ...prev, icon: iconItem.name }))}
                        className={`p-2 rounded border-2 transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        title={iconItem.label}
                      >
                        <IconComponent className="w-5 h-5 mx-auto" />
                      </button>
                    );
                  })}
                </div>
                {newItemData.icon && (
                  <p className="mt-1 text-xs text-gray-500">Selected: {newItemData.icon}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAddToDraft('commission')}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Add to Draft
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(null);
                    setNewItemData({});
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => setShowAddForm({ level: 'commission' })}
          className="w-full flex items-center gap-2 px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded border border-dashed border-indigo-300"
        >
          <Plus className="w-4 h-4" />
          Add New Commission/Category
        </button>
      </div>
    );
  };

  if (!type) {
    return (
      <div className="text-center py-12 text-gray-500">
        Please select a type (MCQs, Past Papers, Past Interviews, or Mock Tests) to manage categories
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading category structure...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Message Banner */}
      {message && (
        <div
          className={`px-4 py-3 rounded-md flex items-center justify-between ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <span className="flex items-center gap-2">
            {message.type === 'success' ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            <span className="font-medium">{message.text}</span>
          </span>
          <button
            onClick={() => setMessage(null)}
            className={`ml-4 ${
              message.type === 'success' ? 'text-green-600 hover:text-green-800' : 'text-red-600 hover:text-red-800'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Category Management</h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage categories for: <span className="font-semibold">{type}</span>
            {hasChanges && <span className="ml-2 text-orange-600 font-medium">• Unsaved changes</span>}
          </p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <>
              <button
                onClick={handleSaveChanges}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={handleDiscardChanges}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                <X className="w-4 h-4" />
                Discard
              </button>
            </>
          )}
          <button
            onClick={fetchStructure}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-6">
        {(type === 'mcqs' || type === 'mock-tests') ? renderMcqCategories() : renderHierarchicalStructure()}
      </div>
    </div>
  );
};

export default CategoryTreeManager;

