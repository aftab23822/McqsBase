import express from 'express';
import { getCategories, addCategory, updateCategory, deleteCategory } from '../controllers/categoryController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getCategories);
router.post('/', requireAdmin, addCategory);
router.put('/:id', requireAdmin, updateCategory);
router.delete('/:id', requireAdmin, deleteCategory);

export default router; 