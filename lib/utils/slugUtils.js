/**
 * Utility functions for generating and working with URL slugs
 */

/**
 * Generates a URL-friendly slug from text
 * @param {string} text - Text to convert to slug
 * @returns {string} - URL-friendly slug
 */
export function generateSlug(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  return text
    .toLowerCase()
    .trim()
    // Remove emojis and special characters at the start
    .replace(/^[^\w\s]+/, '')
    // Replace spaces and special chars with hyphens
    .replace(/[\s_]+/g, '-')
    // Remove non-alphanumeric except hyphens
    .replace(/[^\w-]+/g, '')
    // Replace multiple hyphens with single hyphen
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '');
}

/**
 * Normalizes a department name by removing emoji and special characters for matching
 * @param {string} departmentName - Department name (may include emoji)
 * @returns {string} - Normalized slug
 */
export function normalizeDepartmentName(departmentName) {
  if (!departmentName || typeof departmentName !== 'string') {
    return '';
  }
  
  return generateSlug(departmentName);
}

/**
 * Normalizes a role/position name for matching
 * @param {string} roleName - Role or position name
 * @returns {string} - Normalized slug
 */
export function normalizeRoleName(roleName) {
  if (!roleName || typeof roleName !== 'string') {
    return '';
  }
  
  return generateSlug(roleName);
}

