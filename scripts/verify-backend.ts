import axios from 'axios';

const PORT = 5000;

async function runTests() {
  console.log(`🧪 Running backend integration verification against http://localhost:${PORT}`);

  const api = axios.create({
    baseURL: `http://localhost:${PORT}/api`,
    validateStatus: () => true, // Don't throw on non-2xx
  });

  try {
    console.log('\n--- 1. Health Check ---');
    const health = await api.get('/health');
    console.log('Health status:', health.status, health.data);
    if (health.status !== 200) throw new Error('Health check failed');

    console.log('\n--- 2. Public Product Catalog & Filtering ---');
    const productsRes = await api.get('/products?limit=5');
    console.log(
      `Fetched ${productsRes.data.products.length} products (Total: ${productsRes.data.pagination.total})`
    );
    if (productsRes.status !== 200 || productsRes.data.products.length === 0) {
      throw new Error('Failed to list products');
    }

    const firstProduct = productsRes.data.products[0];
    const singleProdRes = await api.get(`/products/${firstProduct.id}`);
    console.log(
      `Product details for '${singleProdRes.data.product.name}': Stock = ${singleProdRes.data.product.stock_quantity}`
    );

    console.log('\n--- 3. Authentication & RBAC ---');
    // Login as Customer
    const customerLogin = await api.post('/auth/login', {
      email: 'customer@commerceflow.com',
      password: 'Password123!',
    });
    console.log(
      'Customer login status:',
      customerLogin.status,
      'User:',
      customerLogin.data.user?.name
    );
    const customerToken = customerLogin.data.token;

    // Login as Admin
    const adminLogin = await api.post('/auth/login', {
      email: 'admin@commerceflow.com',
      password: 'Admin123!',
    });
    console.log('Admin login status:', adminLogin.status, 'User:', adminLogin.data.user?.name);
    const adminToken = adminLogin.data.token;

    // RBAC Test: Customer trying to access Admin endpoint (Must fail with 403)
    const rbacTest = await api.get('/admin/dashboard', {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    console.log(
      'Customer accessing /admin/dashboard -> Status:',
      rbacTest.status,
      '(Expected 403)'
    );
    if (rbacTest.status !== 403)
      throw new Error('RBAC failed: Customer was not blocked from admin dashboard');

    // Admin accessing Admin endpoint
    const adminDash = await api.get('/admin/dashboard', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log('Admin accessing /admin/dashboard -> Status:', adminDash.status, 'Metrics:', {
      revenue: adminDash.data.metrics.totalRevenue,
      orders: adminDash.data.metrics.totalOrders,
      products: adminDash.data.metrics.totalProducts,
      lowStock: adminDash.data.metrics.lowStockProducts,
    });
    if (adminDash.status !== 200) throw new Error('Admin dashboard failed');

    console.log('\n--- 4. Admin Personal Purchase Restriction ---');
    // Admin trying to add to cart (Must fail with 403)
    const adminAddCart = await api.post(
      '/cart/items',
      { productId: firstProduct.id, quantity: 1 },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    console.log(
      'Admin attempting addToCart -> Status:',
      adminAddCart.status,
      'Msg:',
      adminAddCart.data.message,
      '(Expected 403)'
    );
    if (adminAddCart.status !== 403)
      throw new Error('Security check failed: Admin should not be permitted to add to cart');

    // Admin trying to checkout (Must fail with 403)
    const adminCheckout = await api.post(
      '/orders/checkout',
      {
        shipping_name: 'Admin User',
        shipping_phone: '+91 9999999999',
        shipping_address: 'Headquarters, Suite 100',
        shipping_city: 'Bengaluru',
        shipping_state: 'Karnataka',
        shipping_postal: '560001',
        payment_method: 'CREDIT_CARD',
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    console.log(
      'Admin attempting checkout -> Status:',
      adminCheckout.status,
      'Msg:',
      adminCheckout.data.message,
      '(Expected 403)'
    );
    if (adminCheckout.status !== 403)
      throw new Error('Security check failed: Admin should not be permitted to checkout');

    console.log('\n--- 5. Admin Adding New Product to Catalog ---');
    const catListRes = await api.get('/categories');
    const testCatId = catListRes.data.categories[0]?.id || 1;

    const newProductPayload = {
      name: 'CyberAcoustics Spatial Earbuds Pro',
      description: 'Lossless audio streaming with spatial tracking and IPX8 water resistance.',
      price: 4999,
      stock_quantity: 30,
      sku: `CA-${Date.now().toString().slice(-4)}`,
      category_id: testCatId,
      status: 'ACTIVE',
      images: [
        {
          image_url:
            'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80',
          is_primary: true,
        },
      ],
    };

    const createProductRes = await api.post('/products', newProductPayload, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log(
      'Admin create product status:',
      createProductRes.status,
      'Created Product:',
      createProductRes.data.product?.name
    );
    if (createProductRes.status !== 201) throw new Error('Admin product creation failed');

    console.log('\n--- 6. Customer Cart Operations & Stock Validation ---');
    // Clear cart first
    await api.delete('/cart', { headers: { Authorization: `Bearer ${customerToken}` } });

    // Add item with valid quantity
    const addCartRes = await api.post(
      '/cart/items',
      { productId: firstProduct.id, quantity: 2 },
      { headers: { Authorization: `Bearer ${customerToken}` } }
    );
    console.log('Customer Add to cart (2 units):', addCartRes.data.message);

    // Cart validation: Try adding more than stock (e.g. 999 units)
    const overStockRes = await api.post(
      '/cart/items',
      { productId: firstProduct.id, quantity: 999 },
      { headers: { Authorization: `Bearer ${customerToken}` } }
    );
    console.log(
      'Over-stock add to cart -> Status:',
      overStockRes.status,
      'Msg:',
      overStockRes.data.message,
      '(Expected 400)'
    );
    if (overStockRes.status !== 400)
      throw new Error('Stock validation failed: allowed quantity > stock');

    // Fetch cart
    const cartRes = await api.get('/cart', {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    console.log(
      `Cart subtotal: ₹${cartRes.data.cart.subtotal}, Items: ${cartRes.data.cart.item_count}`
    );

    console.log('\n--- 7. Atomic Customer Checkout & Concurrency ---');
    const initialStock = firstProduct.stock_quantity;

    // Checkout with Success Card
    const checkoutRes = await api.post(
      '/orders/checkout',
      {
        shipping_name: 'Rohan Sharma',
        shipping_phone: '+91 9876543210',
        shipping_address: 'Flat 402, Outer Ring Road',
        shipping_city: 'Bengaluru',
        shipping_state: 'Karnataka',
        shipping_postal: '560103',
        payment_method: 'CREDIT_CARD',
        payment_details: {
          cardNumber: '4242 4242 4242 4242',
          expiry: '12/28',
          cvv: '123',
        },
      },
      { headers: { Authorization: `Bearer ${customerToken}` } }
    );

    console.log(
      'Customer Checkout status:',
      checkoutRes.status,
      'Order Number:',
      checkoutRes.data.order?.order_number,
      'Initial Status:',
      checkoutRes.data.order?.order_status
    );
    if (checkoutRes.status !== 201) throw new Error('Checkout failed');
    if (checkoutRes.data.order?.order_status !== 'PENDING')
      throw new Error('Order should initialize as PENDING for admin review/dispatch');

    // Verify stock was reduced
    const updatedProdRes = await api.get(`/products/${firstProduct.id}`);
    const newStock = updatedProdRes.data.product.stock_quantity;
    console.log(
      `Stock before checkout: ${initialStock} -> Stock after checkout: ${newStock} (Decremented by 2)`
    );
    if (newStock !== initialStock - 2) throw new Error('Atomic stock decrement failed');

    console.log('\n--- 8. Admin Delivery Management & State Machine Pipeline ---');
    const newOrderId = checkoutRes.data.order.id;

    // Admin updates delivery status: PENDING -> CONFIRMED
    const step1 = await api.put(
      `/admin/orders/${newOrderId}/status`,
      { status: 'CONFIRMED' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    console.log('Admin Action: PENDING -> CONFIRMED -> Status:', step1.status, step1.data.message);

    // Admin updates delivery status: CONFIRMED -> PROCESSING
    const step2 = await api.put(
      `/admin/orders/${newOrderId}/status`,
      { status: 'PROCESSING' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    console.log(
      'Admin Action: CONFIRMED -> PROCESSING -> Status:',
      step2.status,
      step2.data.message
    );

    // Admin updates delivery status: PROCESSING -> SHIPPED
    const step3 = await api.put(
      `/admin/orders/${newOrderId}/status`,
      { status: 'SHIPPED' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    console.log(
      'Admin Action: PROCESSING -> SHIPPED -> Status:',
      step3.status,
      step3.data.message
    );

    // Admin updates delivery status: SHIPPED -> DELIVERED (completes product delivery!)
    const step4 = await api.put(
      `/admin/orders/${newOrderId}/status`,
      { status: 'DELIVERED' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    console.log(
      'Admin Action: SHIPPED -> DELIVERED -> Status:',
      step4.status,
      step4.data.message
    );

    // Invalid transition: DELIVERED -> PENDING (Must fail with 400)
    const invalidTransition = await api.put(
      `/admin/orders/${newOrderId}/status`,
      { status: 'PENDING' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    console.log(
      'Invalid transition DELIVERED -> PENDING -> Status:',
      invalidTransition.status,
      'Msg:',
      invalidTransition.data.message,
      '(Expected 400)'
    );
    if (invalidTransition.status !== 400)
      throw new Error(
        'State machine failed: allowed invalid transition DELIVERED -> PENDING'
      );

    console.log('\n--- 9. Inventory Audit Logs & Manual Stock Adjustments ---');
    const adjustStockRes = await api.put(
      `/admin/inventory/${firstProduct.id}`,
      {
        new_stock: 50,
        reason: 'Restocked by supplier batch #A99',
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    console.log('Admin stock update:', adjustStockRes.data.message);

    const logsRes = await api.get(`/admin/inventory/logs?productId=${firstProduct.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log(
      `Fetched ${logsRes.data.logs.length} audit logs for product '${firstProduct.name}'`
    );
    console.log('Latest audit log reason:', logsRes.data.logs[0]?.reason);

    console.log('\n🎉 ALL UPDATED BACKEND & BUSINESS LOGIC TESTS PASSED SUCCESSFULLY! ✅');
  } catch (err) {
    console.error('Test run error:', err);
    throw err;
  }
}

runTests().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
