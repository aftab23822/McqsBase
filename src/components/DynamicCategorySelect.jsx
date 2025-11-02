"use client";

import React, { useState, useEffect } from 'react';
import { Plus, ChevronDown, X } from 'lucide-react';

/**
 * Dynamic Category Select Component
 * 
 * Provides searchable, creatable dropdowns for categories, commissions, departments, and roles
 * Supports adding new entries inline
 */

const DynamicCategorySelect = ({
  label,
  value,
  onChange,
  options = [],
  placeholder = "Select or type to add new...",
  onCreateNew,
  isLoading = false,
  required = false,
  showAddNew = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewInput, setShowNewInput] = useState(false);
  const [newValue, setNewValue] = useState('');

  // Filter options based on search term
  const filteredOptions = options.filter(option => {
    const label = typeof option === 'string' ? option : option.label || option;
    return label.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Check if search term matches any existing option
  const exactMatch = options.some(option => {
    const label = typeof option === 'string' ? option : option.label || option;
    return label.toLowerCase() === searchTerm.toLowerCase();
  });

  const handleSelect = (option) => {
    const selectedValue = typeof option === 'string' ? option : option.value || option;
    onChange(selectedValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleCreateNew = async () => {
    if (newValue.trim() && onCreateNew) {
      await onCreateNew(newValue.trim());
      setNewValue('');
      setShowNewInput(false);
      setSearchTerm('');
    }
  };

  const displayValue = options.find(option => {
    const optionValue = typeof option === 'string' ? option : option.value || option;
    return optionValue === value;
  });

  return (
    <div className="relative">
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="relative">
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white cursor-pointer focus:ring-2 focus:ring-indigo-500 focus:border-transparent flex items-center justify-between"
        >
          <span className={value ? "text-gray-900" : "text-gray-500"}>
            {value 
              ? (typeof displayValue === 'string' ? displayValue : displayValue?.label || displayValue || value)
              : placeholder
            }
          </span>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
        </div>

        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)}
            ></div>
            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
              {/* Search Input */}
              <div className="sticky top-0 bg-white border-b border-gray-200 p-2">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowNewInput(false);
                  }}
                  placeholder="Search or type new..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              {/* Options List */}
              <div className="py-1">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((option, index) => {
                    const optionValue = typeof option === 'string' ? option : option.value || option;
                    const optionLabel = typeof option === 'string' ? option : option.label || option;
                    const isSelected = optionValue === value;
                    
                    return (
                      <div
                        key={index}
                        onClick={() => handleSelect(option)}
                        className={`px-4 py-2 cursor-pointer hover:bg-indigo-50 ${
                          isSelected ? 'bg-indigo-100 font-semibold' : ''
                        }`}
                      >
                        {optionLabel}
                      </div>
                    );
                  })
                ) : (
                  <div className="px-4 py-2 text-gray-500 text-sm">
                    No options found
                  </div>
                )}

                {/* Add New Option */}
                {showAddNew && searchTerm && !exactMatch && !showNewInput && (
                  <div
                    onClick={() => setShowNewInput(true)}
                    className="px-4 py-2 cursor-pointer hover:bg-green-50 border-t border-gray-200 text-green-600 font-medium flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add "{searchTerm}"
                  </div>
                )}

                {showNewInput && (
                  <div className="px-4 py-2 border-t border-gray-200 bg-green-50">
                    <input
                      type="text"
                      value={newValue || searchTerm}
                      onChange={(e) => setNewValue(e.target.value)}
                      placeholder="Enter new value..."
                      className="w-full px-3 py-2 border border-green-300 rounded-md focus:ring-2 focus:ring-green-500 mb-2"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleCreateNew}
                        className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewInput(false);
                          setNewValue('');
                        }}
                        className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DynamicCategorySelect;

