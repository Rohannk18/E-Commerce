import { Router } from 'express';
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController';
import { authenticateUser } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

// Public routes
router.get('/', getCategories);
router.get('/:id', getCategoryById);

// Admin-protected routes
router.post('/', authenticateUser, requireRole('ADMIN'), createCategory);
router.put('/:id', authenticateUser, requireRole('ADMIN'), updateCategory);
router.delete('/:id', authenticateUser, requireRole('ADMIN'), deleteCategory);

export default router;
