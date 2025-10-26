import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

// Next.js middleware helper for JWT authentication
export function authenticateToken(request) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { 
      error: { message: 'No token provided' }, 
      status: 401 
    };
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return { 
        error: { message: 'Forbidden: Admins only' }, 
        status: 403 
      };
    }
    
    return { user: decoded };
  } catch (err) {
    return { 
      error: { message: 'Invalid or expired token' }, 
      status: 401 
    };
  }
}

// Wrapper function to protect API routes
export function withAuth(handler) {
  return async (request, context) => {
    const auth = authenticateToken(request);
    
    if (auth.error) {
      return NextResponse.json(auth.error, { status: auth.status });
    }
    
    // Add user to request context
    request.user = auth.user;
    return handler(request, context);
  };
}

// Admin role requirement
export function requireAdmin(request) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { 
      error: { message: 'No token provided' }, 
      status: 401 
    };
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return { 
        error: { message: 'Forbidden: Admins only' }, 
        status: 403 
      };
    }
    
    return { user: decoded };
  } catch (err) {
    return { 
      error: { message: 'Invalid or expired token' }, 
      status: 401 
    };
  }
}

// Wrapper for admin-only routes
export function withAdminAuth(handler) {
  return async (request, context) => {
    const auth = requireAdmin(request);
    
    if (auth.error) {
      return NextResponse.json(auth.error, { status: auth.status });
    }
    
    request.user = auth.user;
    return handler(request, context);
  };
}
