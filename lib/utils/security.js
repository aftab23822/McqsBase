/**
 * Escapes special regex characters in a string to prevent regex injection
 * @param {string} str - The string to escape
 * @returns {string} - The escaped string safe for use in regex
 */
export function escapeRegex(str) {
  if (typeof str !== 'string') {
    return '';
  }
  // Escape special regex characters: . * + ? ^ $ { } ( ) | [ ] \
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Sanitizes a string by trimming and limiting length
 * @param {string} str - The string to sanitize
 * @param {number} maxLength - Maximum allowed length (default: 1000)
 * @returns {string} - Sanitized string
 */
export function sanitizeString(str, maxLength = 1000) {
  if (typeof str !== 'string') {
    return '';
  }
  return str.trim().slice(0, maxLength);
}

/**
 * Validates and sanitizes a subject/slug parameter
 * @param {string} subject - Subject parameter from URL
 * @returns {string|null} - Sanitized subject or null if invalid
 */
export function sanitizeSubject(subject) {
  if (typeof subject !== 'string') {
    return null;
  }
  
  // Allow only alphanumeric, hyphens, and underscores
  const sanitized = subject.trim().toLowerCase();
  if (!/^[a-z0-9_-]+$/.test(sanitized)) {
    return null;
  }
  
  // Limit length
  if (sanitized.length > 100) {
    return null;
  }
  
  return sanitized;
}

/**
 * Validates and sanitizes an integer parameter (like page, limit)
 * @param {any} value - The value to validate
 * @param {number} min - Minimum allowed value (default: 1)
 * @param {number} max - Maximum allowed value (default: 1000)
 * @param {number} defaultValue - Default value if invalid (default: 1)
 * @returns {number} - Validated integer
 */
export function sanitizeInt(value, min = 1, max = 1000, defaultValue = 1) {
  const num = parseInt(value, 10);
  if (isNaN(num) || num < min || num > max) {
    return defaultValue;
  }
  return num;
}

