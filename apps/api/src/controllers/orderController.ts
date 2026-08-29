import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { canTransitionOrderStatus } from '@commerceflow/shared';

export const checkoutOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Rule: Admin cannot buy for himself
    if (userRole === 'ADMIN') {
      res.status(403).json({
        success: false,
        message: 'Administrators are not permitted to place personal orders. Please use a Customer account to shop.',
      });
      return;
    }

    const {
      shipping_name,
      shipping_phone,
      shipping_address,
      shipping_city,
      shipping_state,
      shipping_postal,
      payment_method, // "CREDIT_CARD" | "UPI" | "COD"
      payment_details, // card details or UPI ID or simulation flags
    } = req.body;

    // 1. Validate shipping fields
    if (
      !shipping_name ||
      !shipping_phone ||
      !shipping_address ||
      !shipping_city ||
      !shipping_state ||
      !shipping_postal
    ) {
      res.status(400).json({
        success: false,
        message: 'All shipping details (name, phone, address, city, state, postal code) are required.',
      });
      return;
    }

    if (!['CREDIT_CARD', 'UPI', 'COD'].includes(payment_method)) {
      res.status(400).json({
        success: false,
        message: 'Invalid payment method. Allowed: CREDIT_CARD, UPI, COD.',
      });
      return;
    }

    // 2. Retrieve user's cart
    const cart = await prisma.cart.findUnique({
      where: { user_id: userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { where: { is_primary: true }, take: 1 },
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Your cart is empty. Please add products before checking out.',
      });
      return;
    }

    // 3. Pre-validate stock and compute totals
    let subtotal = 0;
    for (const item of cart.items) {
      const product = item.product;
      if (product.status === 'INACTIVE') {
        res.status(400).json({
          success: false,
          message: `Product '${product.name}' is no longer available.`,
        });
        return;
      }
      if (product.stock_quantity < item.quantity) {
        res.status(400).json({
          success: false,
          message: `Insufficient inventory for '${product.name}'. Available: ${product.stock_quantity}, Requested: ${item.quantity}.`,
        });
        return;
      }
      subtotal += product.price * item.quantity;
    }

    const shipping_fee = subtotal > 999 ? 0 : 50;
    const total_amount = parseFloat((subtotal + shipping_fee).toFixed(2));

    // 4. Simulate Payment Gateway
    let paymentSuccess = true;
    let paymentFailureReason = '';

    if (payment_method === 'CREDIT_CARD') {
      const cardNumber = payment_details?.cardNumber?.replace(/\s/g, '') || '';
      // Simulate failure if card number ends in 0000 or includes 'FAIL' or explicit flag
      if (
        cardNumber.endsWith('0000') ||
        payment_details?.simulateFailure === true ||
        payment_details?.cvv === '000'
      ) {
        paymentSuccess = false;
        paymentFailureReason = 'Card payment declined: Insufficient funds or invalid card test simulator.';
      }
    } else if (payment_method === 'UPI') {
      const upiId = payment_details?.upiId?.toLowerCase() || '';
      if (upiId.includes('fail') || payment_details?.simulateFailure === true) {
        paymentSuccess = false;
        paymentFailureReason = 'UPI transaction failed: Bank simulator rejected transaction.';
      }
    }

    // If simulated payment failed, return error without deducting inventory
    if (!paymentSuccess) {
      res.status(402).json({
        success: false,
        message: paymentFailureReason || 'Payment failed. Please try a different payment method.',
        payment_status: 'FAILED',
      });
      return;
    }

    const transactionReference = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const orderNumber = `CF-${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`;

    const paymentStatus = payment_method === 'COD' ? 'PENDING' : 'PAID';
    // Order status starts at PENDING so that Admin reviews and updates the delivery pipeline
    const orderStatus = 'PENDING';

    // 5. Execute DB Transaction (Atomic Concurrency Protection)
    const result = await prisma.$transaction(async (tx) => {
      // Re-verify stock inside transaction to prevent race conditions
      for (const item of cart.items) {
        const freshProduct = await tx.product.findUnique({
          where: { id: item.product_id },
        });

        if (!freshProduct || freshProduct.stock_quantity < item.quantity) {
          throw new Error(
            `Stock conflict: '${freshProduct?.name || 'Product'}' only has ${freshProduct?.stock_quantity || 0} units left.`
          );
        }

        const updatedStock = freshProduct.stock_quantity - item.quantity;
        const newStatus = updatedStock === 0 ? 'OUT_OF_STOCK' : freshProduct.status;

        // Atomically decrement stock
        await tx.product.update({
          where: { id: item.product_id },
          data: {
            stock_quantity: updatedStock,
            status: newStatus,
          },
        });

        // Inventory Audit Log
        await tx.inventoryLog.create({
          data: {
            product_id: item.product_id,
            previous_stock: freshProduct.stock_quantity,
            new_stock: updatedStock,
            change_amount: -item.quantity,
            reason: `Order #${orderNumber} Placed by Customer (${item.quantity} units)`,
          },
        });
      }

      // Create Order
      const newOrder = await tx.order.create({
        data: {
          order_number: orderNumber,
          user_id: userId,
          shipping_name: shipping_name.trim(),
          shipping_phone: shipping_phone.trim(),
          shipping_address: shipping_address.trim(),
          shipping_city: shipping_city.trim(),
          shipping_state: shipping_state.trim(),
          shipping_postal: shipping_postal.trim(),
          subtotal: parseFloat(subtotal.toFixed(2)),
          shipping_fee,
          total_amount,
          payment_status: paymentStatus,
          order_status: orderStatus,
          items: {
            create: cart.items.map((item) => ({
              product_id: item.product_id,
              product_name: item.product.name,
              product_sku: item.product.sku,
              product_image: item.product.images[0]?.image_url || null,
              quantity: item.quantity,
              price: item.product.price,
            })),
          },
          payments: {
            create: {
              payment_method,
              payment_status: paymentStatus,
              transaction_reference: transactionReference,
              amount: total_amount,
            },
          },
        },
        include: {
          items: true,
          payments: true,
        },
      });

      // Clear Cart
      await tx.cartItem.deleteMany({
        where: { cart_id: cart.id },
      });

      return newOrder;
    });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully! Awaiting admin review and dispatch.',
      order: result,
    });
  } catch (error: any) {
    if (error.message && error.message.startsWith('Stock conflict:')) {
      res.status(409).json({
        success: false,
        message: error.message,
      });
      return;
    }
    next(error);
  }
};

export const getUserOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;

    const orders = await prisma.order.findMany({
      where: { user_id: userId },
      include: {
        items: true,
        payments: true,
      },
      orderBy: { created_at: 'desc' },
    });

    res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const orderId = parseInt(req.params.id, 10);
    const userId = req.user!.id;
    const userRole = req.user!.role;

    if (isNaN(orderId)) {
      res.status(400).json({ success: false, message: 'Invalid order ID.' });
      return;
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        payments: true,
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found.' });
      return;
    }

    // Role check: Only the customer who placed the order or an ADMIN can view it
    if (userRole !== 'ADMIN' && order.user_id !== userId) {
      res.status(403).json({
        success: false,
        message: 'Access denied: You cannot view another customer’s order.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const orderId = parseInt(req.params.id, 10);
    const userId = req.user!.id;
    const userRole = req.user!.role;

    if (isNaN(orderId)) {
      res.status(400).json({ success: false, message: 'Invalid order ID.' });
      return;
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found.' });
      return;
    }

    if (userRole !== 'ADMIN' && order.user_id !== userId) {
      res.status(403).json({ success: false, message: 'Access denied.' });
      return;
    }

    // Check State Machine rules
    if (!canTransitionOrderStatus(order.order_status as any, 'CANCELLED')) {
      res.status(400).json({
        success: false,
        message: `Cannot cancel order with status '${order.order_status}'.`,
      });
      return;
    }

    const cancelledOrder = await prisma.$transaction(async (tx) => {
      // Restore inventory
      for (const item of order.items) {
        const product = await tx.product.findUnique({
          where: { id: item.product_id },
        });

        if (product) {
          const restoredStock = product.stock_quantity + item.quantity;
          const restoredStatus =
            product.status === 'OUT_OF_STOCK' && restoredStock > 0
              ? 'ACTIVE'
              : product.status;

          await tx.product.update({
            where: { id: item.product_id },
            data: {
              stock_quantity: restoredStock,
              status: restoredStatus,
            },
          });

          await tx.inventoryLog.create({
            data: {
              product_id: item.product_id,
              previous_stock: product.stock_quantity,
              new_stock: restoredStock,
              change_amount: item.quantity,
              reason: `Order #${order.order_number} Cancelled - Inventory Restored`,
            },
          });
        }
      }

      return tx.order.update({
        where: { id: orderId },
        data: { order_status: 'CANCELLED' },
        include: { items: true, payments: true },
      });
    });

    res.status(200).json({
      success: true,
      message: 'Order cancelled and inventory successfully restored.',
      order: cancelledOrder,
    });
  } catch (error) {
    next(error);
  }
};
