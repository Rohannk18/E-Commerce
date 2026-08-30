import {
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_ORDERS,
} from './mockData';
import {
  ProductDTO,
  CategoryDTO,
  OrderDTO,
  OrderStatus,
} from '@commerceflow/shared';

const STORAGE_KEYS = {
  PRODUCTS: 'cf_mock_products_v5',
  CATEGORIES: 'cf_mock_categories_v5',
  ORDERS: 'cf_mock_orders_v5',
  CART: 'cf_mock_cart_v5',
  USERS: 'cf_mock_users_v5',
};

// Initialize & Retrieve Data
export const getStoredProducts = (): ProductDTO[] => {
  const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
    return INITIAL_PRODUCTS;
  }
  try {
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed) || parsed.length < 20) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
    return parsed;
  } catch {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
    return INITIAL_PRODUCTS;
  }
};

export const saveStoredProducts = (products: ProductDTO[]) => {
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
};

export const getStoredCategories = (): CategoryDTO[] => {
  const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
    return INITIAL_CATEGORIES;
  }
  try {
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed) || parsed.length < 6) {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
      return INITIAL_CATEGORIES;
    }
    return parsed;
  } catch {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
    return INITIAL_CATEGORIES;
  }
};

export const getStoredOrders = (): OrderDTO[] => {
  const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS));
    return INITIAL_ORDERS;
  }
  try {
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS));
      return INITIAL_ORDERS;
    }
    return parsed;
  } catch {
    return INITIAL_ORDERS;
  }
};

export const saveStoredOrders = (orders: OrderDTO[]) => {
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
};

export const getStoredCart = (): any[] => {
  const data = localStorage.getItem(STORAGE_KEYS.CART);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
};

export const saveStoredCart = (items: any[]) => {
  localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(items));
};

export const handleMockRequest = async (config: {
  method?: string;
  url?: string;
  data?: any;
  params?: any;
}): Promise<{ data: any; status: number; statusText: string }> => {
  const method = (config.method || 'GET').toUpperCase();
  const url = (config.url || '').replace(/^\/api/, '');
  const [pathname, queryString] = url.split('?');
  const queryParams = new URLSearchParams(queryString || '');

  // 1. Categories
  if (pathname === '/categories' && method === 'GET') {
    const categories = getStoredCategories();
    return {
      data: {
        success: true,
        categories,
      },
      status: 200,
      statusText: 'OK',
    };
  }

  // 2. Products List & Search/Filters (Customer & Admin)
  if (pathname === '/products' && method === 'GET') {
    let products = getStoredProducts();
    const categoryId = config.params?.categoryId || queryParams.get('categoryId');
    const search = config.params?.search || config.params?.q || queryParams.get('search') || queryParams.get('q');
    const sort = config.params?.sort || queryParams.get('sort');
    const minPrice = config.params?.minPrice || queryParams.get('minPrice');
    const maxPrice = config.params?.maxPrice || queryParams.get('maxPrice');
    const inStock = config.params?.inStock || queryParams.get('inStock');
    const statusParam = config.params?.status || queryParams.get('status');
    const page = Number(config.params?.page || queryParams.get('page') || 1);
    const limit = Number(config.params?.limit || queryParams.get('limit') || 100);

    // Filter by status if specified, otherwise default to active for customer
    if (statusParam && statusParam !== 'ALL') {
      products = products.filter((p) => p.status === statusParam);
    } else if (!statusParam) {
      products = products.filter((p) => p.status === 'ACTIVE');
    }

    if (categoryId) {
      products = products.filter((p) => p.category_id === Number(categoryId));
    }
    if (search) {
      const q = String(search).toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q)
      );
    }
    if (minPrice) {
      products = products.filter((p) => p.price >= Number(minPrice));
    }
    if (maxPrice) {
      products = products.filter((p) => p.price <= Number(maxPrice));
    }
    if (inStock === 'true') {
      products = products.filter((p) => p.stock_quantity > 0);
    }

    if (sort === 'price-low') {
      products.sort((a, b) => a.price - b.price);
    } else if (sort === 'price-high') {
      products.sort((a, b) => b.price - a.price);
    }

    const total = products.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginated = products.slice(startIndex, startIndex + limit);

    return {
      data: {
        success: true,
        products: paginated,
        total,
        page,
        limit,
        totalPages,
        pagination: {
          total,
          page,
          limit,
          totalPages,
        },
      },
      status: 200,
      statusText: 'OK',
    };
  }

  // 3. Product Details by ID or Slug
  if (pathname.startsWith('/products/') && method === 'GET') {
    const parts = pathname.split('/');
    const identifier = parts[2];
    const isSlug = isNaN(Number(identifier));
    const products = getStoredProducts();
    const product = isSlug
      ? products.find((p) => p.slug === identifier)
      : products.find((p) => p.id === Number(identifier));

    if (!product) {
      return { data: { success: false, message: 'Product not found' }, status: 404, statusText: 'Not Found' };
    }
    return {
      data: {
        success: true,
        product,
      },
      status: 200,
      statusText: 'OK',
    };
  }

  // 4. Update Product (Admin)
  if (pathname.startsWith('/products/') && method === 'PUT') {
    const parts = pathname.split('/');
    const productId = Number(parts[2]);
    const payload = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
    const products = getStoredProducts();
    const product = products.find((p) => p.id === productId);

    if (!product) {
      return { data: { success: false, message: 'Product not found' }, status: 404, statusText: 'Not Found' };
    }

    const categories = getStoredCategories();
    const cat = categories.find((c) => c.id === Number(payload.category_id)) || product.category;

    product.name = payload.name || product.name;
    product.description = payload.description || product.description;
    product.price = Number(payload.price ?? product.price);
    product.stock_quantity = Number(payload.stock_quantity ?? product.stock_quantity);
    product.sku = payload.sku || product.sku;
    product.category_id = cat.id;
    product.category = cat;
    product.status = payload.status || product.status;
    if (payload.images) {
      product.images = payload.images.map((img: any, idx: number) => ({
        id: idx + 1,
        product_id: product.id,
        image_url: img.image_url,
        is_primary: idx === 0,
        display_order: idx,
      }));
    }
    product.updated_at = new Date().toISOString();

    saveStoredProducts(products);

    return {
      data: {
        success: true,
        message: 'Product updated successfully',
        product,
      },
      status: 200,
      statusText: 'OK',
    };
  }

  // 5. Delete / Deactivate Product (Admin)
  if (pathname.startsWith('/products/') && method === 'DELETE') {
    const parts = pathname.split('/');
    const productId = Number(parts[2]);
    const products = getStoredProducts();
    const product = products.find((p) => p.id === productId);

    if (!product) {
      return { data: { success: false, message: 'Product not found' }, status: 404, statusText: 'Not Found' };
    }

    product.status = 'INACTIVE';
    product.updated_at = new Date().toISOString();
    saveStoredProducts(products);

    return {
      data: {
        success: true,
        message: `Product '${product.name}' deactivated successfully`,
      },
      status: 200,
      statusText: 'OK',
    };
  }

  // 6. Create New Product (Admin)
  if (pathname === '/products' && method === 'POST') {
    const payload = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
    const products = getStoredProducts();
    const categories = getStoredCategories();
    const parsedCatId = Number(payload.category_id) || 1;
    const cat = categories.find((c) => c.id === parsedCatId) || categories[0] || {
      id: 1,
      name: 'General',
      slug: 'general',
      description: '',
      created_at: new Date().toISOString(),
    };

    const newProductId = Date.now();
    const newProduct: ProductDTO = {
      id: newProductId,
      name: payload.name || 'New Tech Product',
      slug: (payload.name || 'new-tech-product')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, ''),
      description: payload.description || '',
      price: Number(payload.price) || 999,
      stock_quantity: Number(payload.stock_quantity) || 10,
      sku: payload.sku || 'CF-' + Math.floor(1000 + Math.random() * 9000),
      category_id: cat.id,
      status: payload.status || 'ACTIVE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      category: cat,
      images: payload.images?.length
        ? payload.images.map((img: any, idx: number) => ({
            id: idx + 1,
            product_id: newProductId,
            image_url: img.image_url,
            is_primary: idx === 0,
            display_order: idx,
          }))
        : [
            {
              id: 1,
              product_id: newProductId,
              image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80',
              is_primary: true,
              display_order: 0,
            },
          ],
    };

    products.unshift(newProduct);
    saveStoredProducts(products);

    return {
      data: {
        success: true,
        message: 'Product created successfully',
        product: newProduct,
      },
      status: 201,
      statusText: 'Created',
    };
  }

  // 7. Authentication Endpoints
  if (pathname === '/auth/login' && method === 'POST') {
    const payload = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
    const email = payload?.email || 'customer@commerceflow.com';
    const isAdmin = email.includes('admin');

    const user = {
      id: isAdmin ? 1 : 2,
      name: isAdmin ? 'Alex Rivera (Admin)' : 'Rohan Sharma',
      email,
      role: isAdmin ? 'ADMIN' : 'CUSTOMER',
    };
    const token = 'mock_jwt_token_' + btoa(JSON.stringify(user));
    return {
      data: {
        success: true,
        token,
        user,
        message: 'Login successful',
      },
      status: 200,
      statusText: 'OK',
    };
  }

  if (pathname === '/auth/register' && method === 'POST') {
    const payload = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
    const user = {
      id: Math.floor(Math.random() * 1000) + 10,
      name: payload?.name || 'Customer User',
      email: payload?.email || 'new@example.com',
      role: 'CUSTOMER',
    };
    const token = 'mock_jwt_token_' + btoa(JSON.stringify(user));
    return {
      data: {
        success: true,
        token,
        user,
        message: 'Registration successful',
      },
      status: 201,
      statusText: 'Created',
    };
  }

  if (pathname === '/auth/me' && method === 'GET') {
    const storedUser = localStorage.getItem('user');
    const user = storedUser
      ? JSON.parse(storedUser)
      : { id: 2, name: 'Rohan Sharma', email: 'customer@commerceflow.com', role: 'CUSTOMER' };
    return {
      data: {
        success: true,
        user,
      },
      status: 200,
      statusText: 'OK',
    };
  }

  // 8. Cart Operations (Unified & Synchronized)
  if (pathname === '/cart' && method === 'GET') {
    const rawItems = getStoredCart();
    const products = getStoredProducts();

    const items = rawItems
      .map((item: any) => {
        const pId = Number(item.productId || item.product_id || item.id);
        const prod = products.find((p) => p.id === pId);
        if (!prod) return null;
        const img =
          prod.images?.[0]?.image_url ||
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80';
        const qty = Number(item.quantity || 1);

        return {
          id: item.id || prod.id,
          cart_id: 1,
          product_id: prod.id,
          quantity: qty,
          product: {
            id: prod.id,
            name: prod.name,
            slug: prod.slug,
            price: prod.price,
            stock_quantity: prod.stock_quantity,
            sku: prod.sku,
            status: prod.status,
            image: img,
          },
          itemTotal: prod.price * qty,
          isStockAvailable: prod.stock_quantity >= qty,
          isProductActive: prod.status === 'ACTIVE',
        };
      })
      .filter(Boolean);

    const subtotal = items.reduce((sum, item: any) => sum + item.itemTotal, 0);
    const shipping_fee = subtotal > 1000 || subtotal === 0 ? 0 : 99;
    const total = subtotal + shipping_fee;
    const item_count = items.reduce((sum, item: any) => sum + item.quantity, 0);

    return {
      data: {
        success: true,
        cart: {
          id: 1,
          user_id: 2,
          items,
          subtotal,
          shipping_fee,
          total,
          item_count,
        },
      },
      status: 200,
      statusText: 'OK',
    };
  }

  if (pathname === '/cart/items' && method === 'POST') {
    const payload = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
    const prodId = Number(payload?.productId || payload?.product_id || payload?.id);
    const qty = Number(payload?.quantity || 1);

    const products = getStoredProducts();
    const product = products.find((p) => p.id === prodId);

    if (!product) {
      return { data: { success: false, message: 'Product not found' }, status: 404, statusText: 'Not Found' };
    }

    const items = getStoredCart();
    const existingIndex = items.findIndex(
      (i) => Number(i.productId || i.product_id) === prodId
    );

    if (existingIndex > -1) {
      items[existingIndex].quantity += qty;
    } else {
      items.push({
        id: Date.now(),
        cart_id: 1,
        product_id: product.id,
        productId: product.id,
        quantity: qty,
      });
    }

    saveStoredCart(items);
    return { data: { success: true, message: 'Item added to cart' }, status: 200, statusText: 'OK' };
  }

  if (pathname.startsWith('/cart/items/') && method === 'PUT') {
    const parts = pathname.split('/');
    const itemId = Number(parts[3]);
    const payload = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
    const items = getStoredCart();
    const item = items.find(
      (i) => Number(i.id) === itemId || Number(i.productId || i.product_id) === itemId
    );

    if (item) {
      item.quantity = Number(payload.quantity);
      saveStoredCart(items);
    }
    return { data: { success: true, message: 'Cart updated' }, status: 200, statusText: 'OK' };
  }

  if (pathname.startsWith('/cart/items/') && method === 'DELETE') {
    const parts = pathname.split('/');
    const itemId = Number(parts[3]);
    let items = getStoredCart();
    items = items.filter(
      (i) => Number(i.id) !== itemId && Number(i.productId || i.product_id) !== itemId
    );
    saveStoredCart(items);
    return { data: { success: true, message: 'Item removed from cart' }, status: 200, statusText: 'OK' };
  }

  if (pathname === '/cart' && method === 'DELETE') {
    saveStoredCart([]);
    return { data: { success: true, message: 'Cart cleared' }, status: 200, statusText: 'OK' };
  }

  // 9. Checkout & Order Placement
  if (pathname === '/orders/checkout' && method === 'POST') {
    const payload = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
    const rawCartItems = getStoredCart();
    const products = getStoredProducts();

    const orderItems: any[] = [];
    let subtotal = 0;

    for (const item of rawCartItems) {
      const pId = Number(item.productId || item.product_id || item.id);
      const prod = products.find((p) => p.id === pId);
      if (prod) {
        const qty = Number(item.quantity || 1);
        prod.stock_quantity = Math.max(0, prod.stock_quantity - qty);
        subtotal += prod.price * qty;
        orderItems.push({
          id: Date.now() + Math.floor(Math.random() * 100),
          order_id: 1,
          product_id: prod.id,
          product_name: prod.name,
          product_sku: prod.sku,
          product_image:
            prod.images?.[0]?.image_url ||
            'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
          quantity: qty,
          price: prod.price,
        });
      }
    }

    if (orderItems.length === 0) {
      return { data: { success: false, message: 'Your cart is empty.' }, status: 400, statusText: 'Bad Request' };
    }

    saveStoredProducts(products); // Save updated stock quantities

    const orderNumber = 'CF-' + Math.floor(100000000 + Math.random() * 900000000);
    const newOrder: OrderDTO = {
      id: Date.now(),
      order_number: orderNumber,
      user_id: 2,
      shipping_name: payload.shipping_name || 'Rohan Sharma',
      shipping_phone: payload.shipping_phone || '+91 98765 43210',
      shipping_address: payload.shipping_address || 'Flat 402, Skyline Residency, MG Road',
      shipping_city: payload.shipping_city || 'Bengaluru',
      shipping_state: payload.shipping_state || 'Karnataka',
      shipping_postal: payload.shipping_postal || '560001',
      subtotal,
      shipping_fee: 0,
      total_amount: subtotal,
      payment_status: 'PAID',
      order_status: 'PENDING',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: orderItems,
      payments: [
        {
          id: Date.now(),
          order_id: 1,
          payment_method: payload.payment_method || 'CREDIT_CARD',
          payment_status: 'PAID',
          transaction_reference: 'TXN-' + Math.floor(1000000 + Math.random() * 9000000),
          amount: subtotal,
          created_at: new Date().toISOString(),
        },
      ],
    };

    const orders = getStoredOrders();
    orders.unshift(newOrder);
    saveStoredOrders(orders);
    saveStoredCart([]); // Clear cart after checkout

    return {
      data: {
        success: true,
        message: 'Order created successfully',
        order: newOrder,
      },
      status: 201,
      statusText: 'Created',
    };
  }

  // 10. Orders Listing & Details (Customer & Admin)
  if (pathname === '/orders' && method === 'GET') {
    const orders = getStoredOrders();
    return {
      data: {
        success: true,
        orders,
      },
      status: 200,
      statusText: 'OK',
    };
  }

  if (pathname.startsWith('/orders/') && !pathname.includes('/status') && !pathname.includes('/cancel') && method === 'GET') {
    const parts = pathname.split('/');
    const orderId = Number(parts[2]);
    const orders = getStoredOrders();
    const order = orders.find((o) => o.id === orderId);
    if (!order) {
      return { data: { success: false, message: 'Order not found' }, status: 404, statusText: 'Not Found' };
    }
    return {
      data: {
        success: true,
        order,
      },
      status: 200,
      statusText: 'OK',
    };
  }

  if (pathname.startsWith('/orders/') && pathname.endsWith('/cancel') && method === 'PUT') {
    const parts = pathname.split('/');
    const orderId = Number(parts[2]);
    const orders = getStoredOrders();
    const order = orders.find((o) => o.id === orderId);

    if (!order) {
      return { data: { success: false, message: 'Order not found' }, status: 404, statusText: 'Not Found' };
    }

    order.order_status = 'CANCELLED';
    order.updated_at = new Date().toISOString();
    saveStoredOrders(orders);

    return {
      data: {
        success: true,
        message: 'Order cancelled successfully',
        order,
      },
      status: 200,
      statusText: 'OK',
    };
  }

  // 11. Admin Hub, Dashboard & Fulfillment Pipeline
  if (pathname === '/admin/dashboard' && method === 'GET') {
    const orders = getStoredOrders();
    const products = getStoredProducts();
    const categories = getStoredCategories();

    const totalRevenue = orders.reduce((sum, o) => (o.payment_status === 'PAID' ? sum + o.total_amount : sum), 0);
    const lowStockProducts = products.filter((p) => p.stock_quantity <= 5).length;
    const pendingOrders = orders.filter((o) => o.order_status === 'PENDING').length;

    const categoryBreakdown = categories.map((cat) => {
      const prods = products.filter((p) => p.category_id === cat.id);
      return {
        category: cat.name,
        count: prods.length,
        revenue: prods.reduce((sum, p) => sum + p.price * 2, 0),
      };
    });

    return {
      data: {
        success: true,
        metrics: {
          totalRevenue,
          totalOrders: orders.length,
          totalCustomers: 2,
          totalProducts: products.length,
          pendingOrders,
          lowStockProducts,
          recentOrders: orders.slice(0, 6),
          categoryBreakdown,
        },
      },
      status: 200,
      statusText: 'OK',
    };
  }

  if (pathname === '/admin/orders' && method === 'GET') {
    const orders = getStoredOrders();
    const status = config.params?.status || queryParams.get('status');
    const filtered = status && status !== 'ALL' ? orders.filter((o) => o.order_status === status) : orders;
    return {
      data: {
        success: true,
        orders: filtered,
        total: filtered.length,
        pagination: {
          total: filtered.length,
          page: 1,
          limit: 100,
          totalPages: 1,
        },
      },
      status: 200,
      statusText: 'OK',
    };
  }

  // Admin Processing Order Status (State Machine)
  if (pathname.startsWith('/admin/orders/') && pathname.endsWith('/status') && method === 'PUT') {
    const parts = pathname.split('/');
    const orderId = Number(parts[3]);
    const payload = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
    const nextStatus = payload.status as OrderStatus;

    const orders = getStoredOrders();
    const order = orders.find((o) => o.id === orderId);

    if (!order) {
      return { data: { success: false, message: 'Order not found' }, status: 404, statusText: 'Not Found' };
    }

    order.order_status = nextStatus;
    order.updated_at = new Date().toISOString();
    saveStoredOrders(orders);

    return {
      data: {
        success: true,
        message: `Order status successfully updated to '${nextStatus}'`,
        order,
      },
      status: 200,
      statusText: 'OK',
    };
  }

  if (pathname === '/admin/inventory' && method === 'GET') {
    const products = getStoredProducts();
    return {
      data: {
        success: true,
        products,
        total: products.length,
      },
      status: 200,
      statusText: 'OK',
    };
  }

  if (pathname === '/admin/customers' && method === 'GET') {
    return {
      data: {
        success: true,
        customers: [
          { id: 2, name: 'Rohan Sharma', email: 'customer@commerceflow.com', role: 'CUSTOMER', ordersCount: 2, totalSpent: 55497, created_at: new Date().toISOString() },
          { id: 3, name: 'Sarah Connor', email: 'sarah.c@example.com', role: 'CUSTOMER', ordersCount: 1, totalSpent: 24999, created_at: new Date().toISOString() },
        ],
      },
      status: 200,
      statusText: 'OK',
    };
  }

  return { data: { success: false, message: 'Not found' }, status: 404, statusText: 'Not Found' };
};
