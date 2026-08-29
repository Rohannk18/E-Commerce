import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController';
import { authenticateUser } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

// Public routes
router.get('/', getProducts);
router.get('/:id', getProductById);

// Admin-protected routes
router.post('/', authenticateUser, requireRole('ADMIN'), createProduct);
router.put('/:id', authenticateUser, requireRole('ADMIN'), updateProduct);
router.delete('/:id', authenticateUser, requireRole('ADMIN'), deleteProduct);

export default router;
