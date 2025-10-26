import express from 'express';
import { getPastInterviews, addPastInterview, updatePastInterview, deletePastInterview, getPastInterviewsBySubject } from '../controllers/pastInterviewController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getPastInterviews);
router.get('/:subject', getPastInterviewsBySubject);
router.post('/', requireAdmin, addPastInterview);
router.put('/:id', requireAdmin, updatePastInterview);
router.delete('/:id', requireAdmin, deletePastInterview);

export default router; 