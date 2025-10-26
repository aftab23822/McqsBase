// Unified category configuration for Next.js
// Loads category mappings from shared JSON configuration

import categoryData from '../../shared/categoryMapping.json';

const CATEGORY_MAPPING = categoryData.mappings;
const CATEGORIES = categoryData.categories;

// JavaScript version of normalizeCategoryName
export function normalizeCategoryName(raw) {
  let name = raw.toLowerCase().replace(/_/g, '-');
  if (name.endsWith('-mcqs')) name = name.slice(0, -5);
  if (name.endsWith('-mcq')) name = name.slice(0, -4);
  
  // First try exact matches
  if (CATEGORY_MAPPING[name]) {
    return CATEGORY_MAPPING[name];
  }
  
  // Then try prefix matches for cases where we want partial matching
  // Sort by length (longest first) to ensure more specific matches come first
  const sortedKeys = Object.keys(CATEGORY_MAPPING).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (name.startsWith(key)) return CATEGORY_MAPPING[key];
  }
  return name;
}

// Get all available categories for the admin panel
export const getAllCategories = () => {
  return CATEGORIES;
};
