import { NextResponse } from 'next/server';

export function proxy(request) {
  const { pathname } = request.nextUrl;

  // Add CORS headers for API routes
  if (pathname.startsWith('/api/')) {
    const response = NextResponse.next();
    
    // Handle CORS
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight OPTIONS requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: response.headers });
    }
    
    return response;
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
  ],
}

