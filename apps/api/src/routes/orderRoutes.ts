import { Router } from 'express';
import {
  checkoutOrder,
  getUserOrders,
  getOrderById,
  cancelOrder,
} from '../controllers/orderController';
import { authenticateUser } from '../middleware/auth';

const router = Router();

router.use(authenticateUser);

router.post('/checkout', checkoutOrder);
router.get('/', getUserOrders);
router.get('/:id', getOrderById);
router.put('/:id/cancel', cancelOrder);

export default router;
