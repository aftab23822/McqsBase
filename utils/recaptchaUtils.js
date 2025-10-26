import fetch from 'node-fetch';

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
 * Middleware to verify reCAPTCHA token
 * @param {string} secretKey - Your reCAPTCHA secret key
 * @returns {Function} - Express middleware function
 */
export const recaptchaMiddleware = (secretKey) => {
  return async (req, res, next) => {
    const token = req.body.recaptchaToken || req.headers['x-recaptcha-token'];
    
    if (!token) {
      return res.status(400).json({ 
        success: false, 
        message: 'reCAPTCHA token is required' 
      });
    }

    const isValid = await verifyRecaptchaToken(token, secretKey, req.ip);
    
    if (!isValid) {
      return res.status(400).json({ 
        success: false, 
        message: 'reCAPTCHA verification failed' 
      });
    }

    next();
  };
}; 