import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';

// Helper to get or create cart for user
const getOrCreateCart = async (userId: number) => {
  let cart = await prisma.cart.findUnique({
    where: { user_id: userId },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: {
                where: { is_primary: true },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { user_id: userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  where: { is_primary: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });
  }

  return cart;
};

export const getCart = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const cart = await getOrCreateCart(userId);

    // Calculate subtotal and validate items
    let subtotal = 0;
    let totalItems = 0;

    const formattedItems = cart.items.map((item) => {
      const itemTotal = item.product.price * item.quantity;
      subtotal += itemTotal;
      totalItems += item.quantity;

      const isStockAvailable = item.product.stock_quantity >= item.quantity;
      const isProductActive = item.product.status === 'ACTIVE';

      return {
        id: item.id,
        cart_id: item.cart_id,
        product_id: item.product_id,
        quantity: item.quantity,
        product: {
          id: item.product.id,
          name: item.product.name,
          slug: item.product.slug,
          price: item.product.price,
          stock_quantity: item.product.stock_quantity,
          sku: item.product.sku,
          status: item.product.status,
          image: item.product.images[0]?.image_url || null,
        },
        itemTotal,
        isStockAvailable,
        isProductActive,
      };
    });

    const shipping_fee = subtotal > 999 || subtotal === 0 ? 0 : 50; // Free delivery above 999
    const total = subtotal + shipping_fee;

    res.status(200).json({
      success: true,
      cart: {
        id: cart.id,
        user_id: cart.user_id,
        items: formattedItems,
        subtotal: parseFloat(subtotal.toFixed(2)),
        shipping_fee,
        total: parseFloat(total.toFixed(2)),
        item_count: totalItems,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const addToCart = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Rule: Admins cannot purchase for themselves
    if (userRole === 'ADMIN') {
      res.status(403).json({
        success: false,
        message: 'Administrators cannot add items to a shopping cart. Please use a Customer account to shop.',
      });
      return;
    }

    const { productId, quantity = 1 } = req.body;

    const parsedProductId = parseInt(productId, 10);
    const parsedQuantity = parseInt(quantity, 10);

    if (isNaN(parsedProductId) || isNaN(parsedQuantity) || parsedQuantity < 1) {
      res.status(400).json({
        success: false,
        message: 'Valid productId and positive quantity are required.',
      });
      return;
    }

    const product = await prisma.product.findUnique({
      where: { id: parsedProductId },
    });

    if (!product || product.status === 'INACTIVE') {
      res.status(404).json({
        success: false,
        message: 'Product is unavailable or does not exist.',
      });
      return;
    }

    if (product.stock_quantity === 0 || product.status === 'OUT_OF_STOCK') {
      res.status(400).json({
        success: false,
        message: `Sorry, '${product.name}' is currently out of stock.`,
      });
      return;
    }

    const cart = await getOrCreateCart(userId);

    // Check existing item in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cart_id_product_id: {
          cart_id: cart.id,
          product_id: parsedProductId,
        },
      },
    });

    const currentQtyInCart = existingItem ? existingItem.quantity : 0;
    const desiredTotalQty = currentQtyInCart + parsedQuantity;

    // Cart Validation: Quantity cannot exceed available inventory
    if (desiredTotalQty > product.stock_quantity) {
      res.status(400).json({
        success: false,
        message: `Only ${product.stock_quantity} items are available in stock (you already have ${currentQtyInCart} in cart).`,
        availableStock: product.stock_quantity,
        currentInCart: currentQtyInCart,
      });
      return;
    }

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: desiredTotalQty },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cart_id: cart.id,
          product_id: parsedProductId,
          quantity: parsedQuantity,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: `Added ${product.name} to cart.`,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCartItem = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const itemId = parseInt(req.params.id, 10);
    const { quantity } = req.body;

    const parsedQuantity = parseInt(quantity, 10);
    if (isNaN(itemId) || isNaN(parsedQuantity) || parsedQuantity < 1) {
      res.status(400).json({
        success: false,
        message: 'Valid item ID and quantity >= 1 are required.',
      });
      return;
    }

    const cart = await getOrCreateCart(userId);

    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cart_id: cart.id,
      },
      include: {
        product: true,
      },
    });

    if (!cartItem) {
      res.status(404).json({
        success: false,
        message: 'Cart item not found.',
      });
      return;
    }

    // Cart Validation: Quantity cannot exceed available inventory
    if (parsedQuantity > cartItem.product.stock_quantity) {
      res.status(400).json({
        success: false,
        message: `Only ${cartItem.product.stock_quantity} items are available in stock.`,
        availableStock: cartItem.product.stock_quantity,
      });
      return;
    }

    const updated = await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: parsedQuantity },
    });

    res.status(200).json({
      success: true,
      message: 'Cart updated.',
      item: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const removeCartItem = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const itemId = parseInt(req.params.id, 10);

    if (isNaN(itemId)) {
      res.status(400).json({ success: false, message: 'Invalid item ID.' });
      return;
    }

    const cart = await getOrCreateCart(userId);

    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cart_id: cart.id,
      },
    });

    if (!cartItem) {
      res.status(404).json({ success: false, message: 'Cart item not found.' });
      return;
    }

    await prisma.cartItem.delete({
      where: { id: itemId },
    });

    res.status(200).json({
      success: true,
      message: 'Item removed from cart.',
    });
  } catch (error) {
    next(error);
  }
};

export const clearCart = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const cart = await getOrCreateCart(userId);

    await prisma.cartItem.deleteMany({
      where: { cart_id: cart.id },
    });

    res.status(200).json({
      success: true,
      message: 'Cart cleared.',
    });
  } catch (error) {
    next(error);
  }
};
