import express from 'express';
import { getQuizzes, addQuiz, updateQuiz, deleteQuiz, getQuizBySubject } from '../controllers/quizController.js';
import { getMcqs, addMcq, updateMcq, deleteMcq, getMcqsBySubject, batchUploadMcqs } from '../controllers/mcqController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// router.get('/', getQuizzes);
// router.get('/:subject', getQuizBySubject);
// router.post('/', requireAdmin, addQuiz);
// router.put('/:id', requireAdmin, updateQuiz);
// router.delete('/:id', requireAdmin, deleteQuiz);

router.get('/', getMcqs);
router.get('/:subject', getMcqsBySubject);
router.post('/', requireAdmin, addMcq);
router.post('/batch', requireAdmin, batchUploadMcqs);
router.put('/:id', requireAdmin, updateMcq);
router.delete('/:id', requireAdmin, deleteMcq);


export default router; 