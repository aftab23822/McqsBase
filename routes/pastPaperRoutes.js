import express from 'express';
import { getPastPapers, addPastPaper, updatePastPaper, deletePastPaper, getPastPapersBySubject } from '../controllers/pastPaperController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getPastPapers);
router.get('/:subject', getPastPapersBySubject);
router.post('/', requireAdmin, addPastPaper);
router.put('/:id', requireAdmin, updatePastPaper);
router.delete('/:id', requireAdmin, deletePastPaper);

export default router; 