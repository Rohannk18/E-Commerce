import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';

export const getCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: { where: { status: 'ACTIVE' } } },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.status(200).json({
      success: true,
      categories,
    });
  } catch (error) {
    next(error);
  }
};

export const getCategoryById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid category ID.' });
      return;
    }

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        products: {
          where: { status: 'ACTIVE' },
          include: { images: true },
        },
      },
    });

    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      category,
    });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, description, image_url } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ success: false, message: 'Category name is required.' });
      return;
    }

    const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const existing = await prisma.category.findFirst({
      where: {
        OR: [{ name: name.trim() }, { slug }],
      },
    });

    if (existing) {
      res.status(409).json({ success: false, message: 'A category with this name or slug already exists.' });
      return;
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        slug,
        description: description?.trim() || null,
        image_url: image_url?.trim() || null,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully.',
      category,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, description, image_url } = req.body;

    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid category ID.' });
      return;
    }

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Category not found.' });
      return;
    }

    let slug = existing.slug;
    if (name && name.trim() !== existing.name) {
      slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(name ? { name: name.trim(), slug } : {}),
        ...(description !== undefined ? { description: description?.trim() || null } : {}),
        ...(image_url !== undefined ? { image_url: image_url?.trim() || null } : {}),
      },
    });

    res.status(200).json({
      success: true,
      message: 'Category updated successfully.',
      category,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid category ID.' });
      return;
    }

    const productCount = await prisma.product.count({
      where: { category_id: id },
    });

    if (productCount > 0) {
      res.status(400).json({
        success: false,
        message: `Cannot delete category: ${productCount} products are currently assigned to it. Reassign or delete them first.`,
      });
      return;
    }

    await prisma.category.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
