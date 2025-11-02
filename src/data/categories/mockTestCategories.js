/**
 * Mock Test Categories Configuration
 * 
 * This file contains all Mock Test categories and universities.
 * Edit this file directly to add, remove, or modify Mock Test categories.
 */

// Centralized config for Mock Test categories and subcategories

export const MOCK_TEST_CATEGORIES = [
  { value: 'universities', label: 'Universities' },
  // Future categories can be added here, will auto-appear in Admin UI
];

// Aliases + full names for universities used across the app
// Sorted alphabetically by label
export const UNIVERSITIES = [
  { label: 'AKU', full: 'Aga Khan University', slug: 'aga-khan-university' },
  { label: 'COMSATS', full: 'COMSATS University Islamabad', slug: 'comsats' },
  { label: 'FAST-NUCES', full: 'National University of Computer & Emerging Sciences (FAST-NUCES)', slug: 'fast-nuces' },
  { label: 'GCU Lahore', full: 'Government College University, Lahore', slug: 'gcu-lahore' },
  { label: 'GIKI', full: 'Ghulam Ishaq Khan Institute of Engineering Sciences and Technology', slug: 'giki' },
  { label: 'IBA Karachi', full: 'Institute of Business Administration, Karachi', slug: 'iba-karachi' },
  { label: 'KU', full: 'University of Karachi', slug: 'karachi-university' },
  { label: 'LUMS', full: 'Lahore University of Management Sciences', slug: 'lums' },
  { label: 'NUST', full: 'National University of Sciences and Technology', slug: 'nust' },
  { label: 'PU', full: 'University of the Punjab', slug: 'punjab-university' },
  { label: 'QAU', full: 'Quaid-i-Azam University', slug: 'qau' },
  { label: 'SBBU SBA', full: 'Shaheed Benazir Bhutto University, Shaheed Benazirabad', slug: 'sbbu-sba' },
  { label: 'UET Lahore', full: 'University of Engineering and Technology, Lahore', slug: 'uet-lahore' },
];

/**
 * Get all Mock Test categories
 */
export const getMockTestCategories = () => MOCK_TEST_CATEGORIES;

/**
 * Get all universities (sorted alphabetically)
 */
export const getUniversities = () => {
  return [...UNIVERSITIES].sort((a, b) => 
    a.label.localeCompare(b.label)
  );
};

