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
  
  // Ensure API paths have trailing slashes to match Next.js trailingSlash: true config
  let apiPath = path;
  if (path.startsWith('/api/') && !path.endsWith('/') && !path.includes('?')) {
    apiPath = path + '/';
  } else if (path.startsWith('/api/') && path.includes('?') && !path.split('?')[0].endsWith('/')) {
    // Handle query parameters - add slash before the query string
    const [pathPart, queryPart] = path.split('?');
    apiPath = pathPart + '/?' + queryPart;
  }
  
  const fullUrl = `${baseUrl}${apiPath}`;
  
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