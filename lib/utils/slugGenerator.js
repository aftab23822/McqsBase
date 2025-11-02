/**
 * Utility functions for generating SEO-friendly slugs
 */

/**
 * Generate a slug from text
 * @param {string} text - The text to convert to a slug
 * @param {number} maxLength - Maximum length of the slug (default: 100)
 * @returns {string} - The generated slug
 */
export function generateSlug(text, maxLength = 100) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Remove HTML tags if any
  let slug = text.replace(/<[^>]*>/g, '');
  
  // Convert to lowercase
  slug = slug.toLowerCase();
  
  // Remove special characters, keep only alphanumeric, spaces, and hyphens
  slug = slug.replace(/[^\w\s-]/g, '');
  
  // Replace multiple spaces/hyphens with single hyphen
  slug = slug.replace(/[\s_-]+/g, '-');
  
  // Remove leading/trailing hyphens
  slug = slug.replace(/^-+|-+$/g, '');
  
  // Truncate to max length
  if (slug.length > maxLength) {
    slug = slug.substring(0, maxLength);
    // Remove trailing hyphen if truncation created one
    slug = slug.replace(/-+$/, '');
  }
  
  return slug || 'question';
}

/**
 * Generate a unique question slug from question text and ID
 * @param {string} question - The question text
 * @param {string} questionId - The MongoDB ObjectId
 * @returns {string} - The generated slug
 */
export function generateQuestionSlug(question, questionId = null) {
  // Generate slug without ID for better SEO and security
  // Slugs are stored in database with unique constraint to ensure uniqueness
  let baseSlug = generateSlug(question, 120);
  
  // If base slug is too short, use more characters
  if (baseSlug.length < 30) {
    baseSlug = generateSlug(question, 150);
  }
  
  return baseSlug;
}

/**
 * Generate a unique slug by checking database and appending suffix if needed
 * This ensures no collisions while keeping URLs clean (no visible IDs)
 */
export async function generateUniqueQuestionSlug(question, questionId, categoryId, MCQ) {
  let baseSlug = generateQuestionSlug(question);
  let finalSlug = baseSlug;
  let counter = 1;
  
  // Check for existing slug in same category
  let exists = await MCQ.findOne({ 
    slug: finalSlug,
    categoryId: categoryId
  });
  
  // If exists and it's not the same question, append suffix
  while (exists && exists._id.toString() !== questionId) {
    finalSlug = `${baseSlug}-${counter}`;
    exists = await MCQ.findOne({ 
      slug: finalSlug,
      categoryId: categoryId
    });
    counter++;
  }
  
  return finalSlug;
}

/**
 * Extract question ID from slug
 * @param {string} slug - The slug with ID at the end
 * @returns {string|null} - The extracted ID or null
 */
export function extractIdFromSlug(slug) {
  const parts = slug.split('-');
  if (parts.length > 1) {
    const lastPart = parts[parts.length - 1];
    // Check if last part looks like MongoDB ObjectId (24 hex chars, 16 chars, 12 chars, or 8 chars)
    if (/^[0-9a-f]{8}$/i.test(lastPart) || /^[0-9a-f]{12}$/i.test(lastPart) || /^[0-9a-f]{16}$/i.test(lastPart) || /^[0-9a-f]{24}$/i.test(lastPart)) {
      return lastPart;
    }
  }
  return null;
}

