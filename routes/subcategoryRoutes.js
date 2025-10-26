import express from 'express';
import { getSubcategories, addSubcategory, updateSubcategory, deleteSubcategory } from '../controllers/subcategoryController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getSubcategories);
router.post('/', requireAdmin, addSubcategory);
router.put('/:id', requireAdmin, updateSubcategory);
router.delete('/:id', requireAdmin, deleteSubcategory);

export default router; 