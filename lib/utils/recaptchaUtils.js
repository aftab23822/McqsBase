/**
 * reCAPTCHA utilities for Next.js
 * Migrated from utils/recaptchaUtils.js with Next.js adaptations
 */

/**
 * Verify reCAPTCHA token with Google's API
 * @param {string} token - The reCAPTCHA token from frontend
 * @param {string} secretKey - Your reCAPTCHA secret key
 * @param {string} remoteIP - Optional IP address for additional security
 * @returns {Promise<boolean>} - Whether the token is valid
 */
export const verifyRecaptchaToken = async (token, secretKey, remoteIP = null) => {
  try {
    const url = 'https://www.google.com/recaptcha/api/siteverify';
    const body = new URLSearchParams({
      secret: secretKey,
      response: token,
      ...(remoteIP && { remoteip: remoteIP })
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString()
    });

    const data = await response.json();

    if (!data.success) {
      console.error('reCAPTCHA verification failed:', data['error-codes']);
      return false;
    }

    // Check if score is above threshold (for v3)
    if (data.score !== undefined && data.score < 0.5) {
      console.error('reCAPTCHA score too low:', data.score);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error verifying reCAPTCHA:', error);
    return false;
  }
};

/**
 * Next.js helper to verify reCAPTCHA from API request
 * @param {Request} request - Next.js request object
 * @param {string} secretKey - Your reCAPTCHA secret key
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export const verifyRecaptchaFromRequest = async (request, secretKey) => {
  try {
    // Get token from headers or body
    let token = request.headers.get('x-recaptcha-token');
    
    if (!token) {
      const body = await request.json();
      token = body.recaptchaToken;
    }
    
    if (!token) {
      return {
        success: false,
        message: 'reCAPTCHA token is required'
      };
    }

    // Get client IP for additional security
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const remoteIP = forwardedFor?.split(',')[0] || realIP || null;

    const isValid = await verifyRecaptchaToken(token, secretKey, remoteIP);
    
    if (!isValid) {
      return {
        success: false,
        message: 'reCAPTCHA verification failed'
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error verifying reCAPTCHA from request:', error);
    return {
      success: false,
      message: 'reCAPTCHA verification error'
    };
  }
};

/**
 * Middleware wrapper for Next.js API routes with reCAPTCHA verification
 * @param {Function} handler - API route handler
 * @param {string} secretKey - reCAPTCHA secret key
 * @returns {Function} - Protected API handler
 */
export function withRecaptcha(handler, secretKey = null) {
  return async (request, context) => {
    const secret = secretKey || process.env.RECAPTCHA_SECRET_KEY;
    
    if (!secret) {
      console.error('RECAPTCHA_SECRET_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, message: 'reCAPTCHA not configured' }), 
        { status: 500 }
      );
    }

    const verification = await verifyRecaptchaFromRequest(request, secret);
    
    if (!verification.success) {
      return new Response(
        JSON.stringify(verification), 
        { status: 400 }
      );
    }
    
    return handler(request, context);
  };
}
