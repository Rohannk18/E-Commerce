import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { canTransitionOrderStatus, LOW_STOCK_THRESHOLD, OrderStatus } from '@commerceflow/shared';

export const getDashboardMetrics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const [
      totalProducts,
      totalCustomers,
      totalOrders,
      revenueResult,
      pendingOrders,
      lowStockProducts,
      recentOrders,
      categories,
    ] = await Promise.all([
      prisma.product.count({ where: { status: { not: 'INACTIVE' } } }),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: { total_amount: true },
        where: { payment_status: 'PAID' },
      }),
      prisma.order.count({ where: { order_status: 'PENDING' } }),
      prisma.product.count({
        where: {
          stock_quantity: { lte: LOW_STOCK_THRESHOLD },
          status: { not: 'INACTIVE' },
        },
      }),
      prisma.order.findMany({
        take: 6,
        orderBy: { created_at: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: true,
          payments: true,
        },
      }),
      prisma.category.findMany({
        include: {
          _count: { select: { products: true } },
          products: {
            select: {
              orderItems: {
                select: { price: true, quantity: true },
              },
            },
          },
        },
      }),
    ]);

    const totalRevenue = revenueResult._sum.total_amount || 0;

    const categoryBreakdown = categories.map((cat) => {
      let revenue = 0;
      for (const prod of cat.products) {
        for (const oi of prod.orderItems) {
          revenue += oi.price * oi.quantity;
        }
      }
      return {
        category: cat.name,
        count: cat._count.products,
        revenue: parseFloat(revenue.toFixed(2)),
      };
    });

    res.status(200).json({
      success: true,
      metrics: {
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalOrders,
        totalCustomers,
        totalProducts,
        pendingOrders,
        lowStockProducts,
        recentOrders,
        categoryBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, search, page = '1', limit = '15' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 15));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (status && status !== 'ALL') {
      where.order_status = status;
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      where.OR = [
        { order_number: { contains: q } },
        { shipping_name: { contains: q } },
        { user: { name: { contains: q } } },
        { user: { email: { contains: q } } },
      ];
    }

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: true,
          payments: true,
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limitNum,
      }),
    ]);

    res.status(200).json({
      success: true,
      orders,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const orderId = parseInt(req.params.id, 10);
    const { status } = req.body;

    if (isNaN(orderId)) {
      res.status(400).json({ success: false, message: 'Invalid order ID.' });
      return;
    }

    if (!status) {
      res.status(400).json({ success: false, message: 'Target order status is required.' });
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

    const currentStatus = order.order_status as OrderStatus;
    const targetStatus = status as OrderStatus;

    // Strict State Machine Verification
    if (!canTransitionOrderStatus(currentStatus, targetStatus)) {
      res.status(400).json({
        success: false,
        message: `Invalid order state transition: Cannot change status from '${currentStatus}' to '${targetStatus}'.`,
        currentStatus,
        targetStatus,
      });
      return;
    }

    const updated = await prisma.$transaction(async (tx) => {
      // If transition is to CANCELLED, restore inventory
      if (targetStatus === 'CANCELLED' && currentStatus !== 'CANCELLED') {
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
                reason: `Order #${order.order_number} Cancelled by Admin - Inventory Restored`,
              },
            });
          }
        }
      }

      // If transitioning to DELIVERED and payment was PENDING (COD), mark payment as PAID
      if (targetStatus === 'DELIVERED' && order.payment_status === 'PENDING') {
        await tx.payment.updateMany({
          where: { order_id: orderId },
          data: { payment_status: 'PAID' },
        });
      }

      return tx.order.update({
        where: { id: orderId },
        data: {
          order_status: targetStatus,
          ...(targetStatus === 'DELIVERED' && order.payment_status === 'PENDING'
            ? { payment_status: 'PAID' }
            : {}),
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: true,
          payments: true,
        },
      });
    });

    res.status(200).json({
      success: true,
      message: `Order status successfully transitioned from '${currentStatus}' to '${targetStatus}'.`,
      order: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const getInventory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { search, lowStockOnly } = req.query;

    const where: any = {};
    if (lowStockOnly === 'true') {
      where.stock_quantity = { lte: LOW_STOCK_THRESHOLD };
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q } },
        { sku: { contains: q } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
        images: { where: { is_primary: true }, take: 1 },
      },
      orderBy: { stock_quantity: 'asc' },
    });

    const formatted = products.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      category: p.category.name,
      price: p.price,
      stock_quantity: p.stock_quantity,
      status: p.status,
      isLowStock: p.stock_quantity <= LOW_STOCK_THRESHOLD,
      image: p.images[0]?.image_url || null,
      updated_at: p.updated_at,
    }));

    res.status(200).json({
      success: true,
      inventory: formatted,
    });
  } catch (error) {
    next(error);
  }
};

export const updateStock = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const productId = parseInt(req.params.productId, 10);
    const { new_stock, reason } = req.body;

    if (isNaN(productId)) {
      res.status(400).json({ success: false, message: 'Invalid product ID.' });
      return;
    }

    const parsedStock = parseInt(new_stock, 10);
    if (isNaN(parsedStock) || parsedStock < 0) {
      res.status(400).json({
        success: false,
        message: 'New stock quantity must be a non-negative integer.',
      });
      return;
    }

    if (!reason || !reason.trim()) {
      res.status(400).json({
        success: false,
        message: 'An audit reason for updating inventory is required.',
      });
      return;
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existingProduct) {
      res.status(404).json({ success: false, message: 'Product not found.' });
      return;
    }

    const difference = parsedStock - existingProduct.stock_quantity;
    const newStatus =
      parsedStock === 0
        ? 'OUT_OF_STOCK'
        : existingProduct.status === 'OUT_OF_STOCK'
        ? 'ACTIVE'
        : existingProduct.status;

    const [updatedProduct, log] = await prisma.$transaction([
      prisma.product.update({
        where: { id: productId },
        data: {
          stock_quantity: parsedStock,
          status: newStatus,
        },
      }),
      prisma.inventoryLog.create({
        data: {
          product_id: productId,
          previous_stock: existingProduct.stock_quantity,
          new_stock: parsedStock,
          change_amount: difference,
          reason: reason.trim(),
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      message: `Inventory for '${existingProduct.name}' updated from ${existingProduct.stock_quantity} to ${parsedStock}.`,
      product: updatedProduct,
      log,
    });
  } catch (error) {
    next(error);
  }
};

export const getInventoryLogs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { productId, limit = '50' } = req.query;

    const where: any = {};
    if (productId) {
      const pid = parseInt(productId as string, 10);
      if (!isNaN(pid)) where.product_id = pid;
    }

    const logs = await prisma.inventoryLog.findMany({
      where,
      include: {
        product: {
          select: { id: true, name: true, sku: true },
        },
      },
      orderBy: { created_at: 'desc' },
      take: Math.min(200, parseInt(limit as string, 10) || 50),
    });

    res.status(200).json({
      success: true,
      logs,
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const customers = await prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      select: {
        id: true,
        name: true,
        email: true,
        created_at: true,
        orders: {
          select: {
            id: true,
            total_amount: true,
            order_status: true,
            created_at: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const formatted = customers.map((c) => {
      const totalSpent = c.orders.reduce((sum, o) => sum + o.total_amount, 0);
      return {
        id: c.id,
        name: c.name,
        email: c.email,
        created_at: c.created_at,
        orderCount: c.orders.length,
        totalSpent: parseFloat(totalSpent.toFixed(2)),
      };
    });

    res.status(200).json({
      success: true,
      customers: formatted,
    });
  } catch (error) {
    next(error);
  }
};
