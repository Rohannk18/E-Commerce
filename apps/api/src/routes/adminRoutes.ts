import { Router } from 'express';
import {
  getDashboardMetrics,
  getAdminOrders,
  updateOrderStatus,
  getInventory,
  updateStock,
  getInventoryLogs,
  getCustomers,
} from '../controllers/adminController';
import { authenticateUser } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

// All admin routes strictly require authentication and ADMIN role
router.use(authenticateUser, requireRole('ADMIN'));

router.get('/dashboard', getDashboardMetrics);
router.get('/orders', getAdminOrders);
router.put('/orders/:id/status', updateOrderStatus);
router.get('/inventory', getInventory);
router.put('/inventory/:productId', updateStock);
router.get('/inventory/logs', getInventoryLogs);
router.get('/customers', getCustomers);

export default router;
