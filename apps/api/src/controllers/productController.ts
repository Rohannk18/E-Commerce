import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { ProductStatus } from '@commerceflow/shared';

export const getProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      q,
      categoryId,
      minPrice,
      maxPrice,
      inStock,
      sort = 'newest',
      page = '1',
      limit = '12',
      status,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    // Build filter conditions
    const where: any = {};

    // For customers, only active products (or explicitly filtered if admin)
    if (status) {
      if (status !== 'ALL') {
        where.status = status;
      }
    } else {
      where.status = { in: ['ACTIVE', 'OUT_OF_STOCK'] };
    }

    if (q && typeof q === 'string' && q.trim()) {
      const searchTerm = q.trim();
      where.OR = [
        { name: { contains: searchTerm } },
        { description: { contains: searchTerm } },
        { sku: { contains: searchTerm } },
      ];
    }

    if (categoryId) {
      const catId = parseInt(categoryId as string, 10);
      if (!isNaN(catId)) {
        where.category_id = catId;
      }
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined && minPrice !== '') {
        const min = parseFloat(minPrice as string);
        if (!isNaN(min)) where.price.gte = min;
      }
      if (maxPrice !== undefined && maxPrice !== '') {
        const max = parseFloat(maxPrice as string);
        if (!isNaN(max)) where.price.lte = max;
      }
    }

    if (inStock === 'true') {
      where.stock_quantity = { gt: 0 };
    }

    // Build sort order
    let orderBy: any = { created_at: 'desc' };
    if (sort === 'price_asc') {
      orderBy = { price: 'asc' };
    } else if (sort === 'price_desc') {
      orderBy = { price: 'desc' };
    } else if (sort === 'name_asc') {
      orderBy = { name: 'asc' };
    } else if (sort === 'oldest') {
      orderBy = { created_at: 'asc' };
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
          images: {
            orderBy: { display_order: 'asc' },
          },
        },
        orderBy,
        skip,
        take: limitNum,
      }),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      products,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasMore: pageNum < totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid product ID.' });
      return;
    }

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: {
          orderBy: { display_order: 'asc' },
        },
      },
    });

    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found.' });
      return;
    }

    // Dynamically ensure status matches stock
    if (product.stock_quantity === 0 && product.status === 'ACTIVE') {
      // Return with OUT_OF_STOCK indicator
      product.status = 'OUT_OF_STOCK';
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      name,
      description,
      price,
      stock_quantity = 0,
      sku,
      category_id,
      status = 'ACTIVE',
      images = [],
    } = req.body;

    if (!name || !price || !category_id || !sku) {
      res.status(400).json({
        success: false,
        message: 'Name, price, SKU, and category are required.',
      });
      return;
    }

    const cleanSku = sku.trim().toUpperCase();
    const existingSku = await prisma.product.findUnique({
      where: { sku: cleanSku },
    });

    if (existingSku) {
      res.status(409).json({
        success: false,
        message: `Product with SKU '${cleanSku}' already exists.`,
      });
      return;
    }

    const parsedCategoryId = parseInt(category_id, 10);
    const categoryExists = await prisma.category.findUnique({
      where: { id: parsedCategoryId },
    });

    if (!categoryExists) {
      res.status(400).json({
        success: false,
        message: 'Invalid category_id: Category does not exist.',
      });
      return;
    }

    const slug = `${name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now()}`;
    const initialStock = Math.max(0, parseInt(stock_quantity, 10) || 0);
    const computedStatus: ProductStatus =
      initialStock === 0 && status === 'ACTIVE' ? 'OUT_OF_STOCK' : status;

    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          name: name.trim(),
          slug,
          description: description?.trim() || '',
          price: parseFloat(price),
          stock_quantity: initialStock,
          sku: cleanSku,
          category_id: parseInt(category_id, 10),
          status: computedStatus,
          images: {
            create: images.map((img: { image_url: string; is_primary?: boolean }, index: number) => ({
              image_url: img.image_url,
              is_primary: img.is_primary || index === 0,
              display_order: index,
            })),
          },
        },
        include: {
          category: true,
          images: true,
        },
      });

      // Write initial inventory log
      if (initialStock > 0) {
        await tx.inventoryLog.create({
          data: {
            product_id: created.id,
            previous_stock: 0,
            new_stock: initialStock,
            change_amount: initialStock,
            reason: 'Initial Product Creation Stock',
          },
        });
      }

      return created;
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      product,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid product ID.' });
      return;
    }

    const {
      name,
      description,
      price,
      stock_quantity,
      sku,
      category_id,
      status,
      images,
    } = req.body;

    const existing = await prisma.product.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Product not found.' });
      return;
    }

    if (sku && sku.trim().toUpperCase() !== existing.sku) {
      const cleanSku = sku.trim().toUpperCase();
      const skuConflict = await prisma.product.findUnique({
        where: { sku: cleanSku },
      });
      if (skuConflict) {
        res.status(409).json({
          success: false,
          message: `SKU '${cleanSku}' is already used by another product.`,
        });
        return;
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const dataToUpdate: any = {};
      if (name) dataToUpdate.name = name.trim();
      if (description !== undefined) dataToUpdate.description = description.trim();
      if (price !== undefined) dataToUpdate.price = parseFloat(price);
      if (sku) dataToUpdate.sku = sku.trim().toUpperCase();
      if (category_id) dataToUpdate.category_id = parseInt(category_id, 10);
      if (status) dataToUpdate.status = status;

      // Handle stock update & inventory logging if stock changed
      if (stock_quantity !== undefined) {
        const newStock = Math.max(0, parseInt(stock_quantity, 10));
        if (newStock !== existing.stock_quantity) {
          dataToUpdate.stock_quantity = newStock;
          if (newStock === 0 && (!status || status === 'ACTIVE')) {
            dataToUpdate.status = 'OUT_OF_STOCK';
          } else if (newStock > 0 && existing.status === 'OUT_OF_STOCK' && !status) {
            dataToUpdate.status = 'ACTIVE';
          }

          await tx.inventoryLog.create({
            data: {
              product_id: id,
              previous_stock: existing.stock_quantity,
              new_stock: newStock,
              change_amount: newStock - existing.stock_quantity,
              reason: 'Admin Manual Product Edit',
            },
          });
        }
      }

      // Handle images update if provided
      if (Array.isArray(images)) {
        await tx.productImage.deleteMany({ where: { product_id: id } });
        if (images.length > 0) {
          await tx.productImage.createMany({
            data: images.map((img: { image_url: string; is_primary?: boolean }, index: number) => ({
              product_id: id,
              image_url: img.image_url,
              is_primary: img.is_primary || index === 0,
              display_order: index,
            })),
          });
        }
      }

      return tx.product.update({
        where: { id },
        data: dataToUpdate,
        include: {
          category: true,
          images: {
            orderBy: { display_order: 'asc' },
          },
        },
      });
    });

    res.status(200).json({
      success: true,
      message: 'Product updated successfully.',
      product: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid product ID.' });
      return;
    }

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Product not found.' });
      return;
    }

    // Soft deletion (mark as INACTIVE)
    await prisma.product.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });

    res.status(200).json({
      success: true,
      message: 'Product deactivated (soft-deleted) successfully.',
    });
  } catch (error) {
    next(error);
  }
};
