// Unified category configuration for all environments
// This file loads category mappings from a single JSON file
// that can be shared across Python scraper, Node.js server, and React client

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load category mappings from JSON file
function loadCategoryConfig() {
  const configPath = path.join(__dirname, '../shared/categoryMapping.json');
  const configData = fs.readFileSync(configPath, 'utf8');
  return JSON.parse(configData);
}

// Load the configuration
const categoryMappingData = loadCategoryConfig();

// Extract mappings and categories from JSON
export const CATEGORY_MAPPING = categoryMappingData.mappings;
export const CATEGORIES = categoryMappingData.categories;

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