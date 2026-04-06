// Next.js environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function apiFetch(path, options = {}) {
  // Determine the base URL based on environment
  let baseUrl;
  
  if (typeof window !== 'undefined') {
    // Client-side: use environment variable or current origin
    baseUrl = API_URL || window.location.origin;
  } else {
    // Server-side: use environment variable or localhost
    baseUrl = API_URL || 'http://localhost:3000';
  }
  
  const fullUrl = `${baseUrl}${path}`;
  
  // Add default headers
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };
  
  return fetch(fullUrl, defaultOptions);
}