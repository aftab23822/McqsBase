import express from 'express';
import {
  submitItem,
  getAllSubmissions,
  getSubmissionById,
  updateSubmissionStatus,
  updateSubmissionContent,
  getSubmissionStats
} from '../controllers/userSubmittedItemController.js';

import { requireAdmin } from '../middleware/auth.js';
import { recaptchaMiddleware } from '../utils/recaptchaUtils.js';

const router = express.Router();

// Get reCAPTCHA secret key from environment
const recaptchaSecretKey = process.env.RECAPTCHA_SECRET_KEY || 'your-recaptcha-secret-key';

// Public route - anyone can submit (with reCAPTCHA verification)
router.post('/submit-item', recaptchaMiddleware(recaptchaSecretKey), submitItem);

// Admin routes (you may want to add authentication middleware later)
router.get('/admin/submissions',requireAdmin, getAllSubmissions);
router.get('/admin/submissions/:id',requireAdmin, getSubmissionById);
router.put('/admin/submissions/:id/status',requireAdmin, updateSubmissionStatus);
router.put('/admin/submissions/:id/content',requireAdmin, updateSubmissionContent);
router.get('/admin/stats',requireAdmin, getSubmissionStats);

export default router; 