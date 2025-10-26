import express from 'express';
import { getUploadStats } from '../controllers/adminController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require authentication
router.use(authenticateToken);

// Get upload statistics
router.get('/stats', getUploadStats);

export default router; 