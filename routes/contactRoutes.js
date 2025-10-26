import express from 'express';
import { recaptchaMiddleware } from '../utils/recaptchaUtils.js';
import { 
  submitContact, 
  getAllContacts, 
  getContactById, 
  updateContactStatus, 
  deleteContact 
} from '../controllers/contactController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get reCAPTCHA secret key from environment
const recaptchaSecretKey = process.env.RECAPTCHA_SECRET_KEY || 'your-recaptcha-secret-key';

// Public routes
router.post('/', recaptchaMiddleware(recaptchaSecretKey), submitContact);

// Protected routes (Admin only)
router.get('/', authenticateToken, getAllContacts);
router.get('/:id', authenticateToken, getContactById);
router.patch('/:id', authenticateToken, updateContactStatus);
router.delete('/:id', authenticateToken, deleteContact);

export default router; 