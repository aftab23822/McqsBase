import express from 'express';
import { login, getProfile, changePassword } from '../controllers/authController.js';
import { requireAdmin } from '../middleware/auth.js';
import { recaptchaMiddleware } from '../utils/recaptchaUtils.js';

const router = express.Router();

// Get reCAPTCHA secret key from environment
const recaptchaSecretKey = process.env.RECAPTCHA_SECRET_KEY || 'your-recaptcha-secret-key';

// Public routes
//router.post('/login', recaptchaMiddleware(recaptchaSecretKey), login);
router.post('/login', login);

// Protected routes (require admin authentication)
router.get('/profile', requireAdmin, getProfile);
router.post('/change-password', requireAdmin, changePassword);

export default router; 