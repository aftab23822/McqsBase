import { NextResponse } from 'next/server';

export function proxy(request) {
  const { pathname, search } = request.nextUrl;

  if (
    request.method === 'GET' &&
    pathname.length > 1 &&
    pathname.endsWith('/') &&
    !pathname.startsWith('/api/')
  ) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace(/\/+$/, '');
    url.search = search;
    return NextResponse.redirect(url, 308);
  }

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
    '/((?!_next/static|_next/image|favicon.ico|eagle.svg|manifest.json|ads.txt).*)',
  ],
}

