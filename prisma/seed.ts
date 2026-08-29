import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding for CommerceFlow...');

  // 1. Clean up existing records in reverse dependency order
  await prisma.inventoryLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned existing tables.');

  // 2. Create Users
  const adminPasswordHash = await bcrypt.hash('Admin123!', 10);
  const customerPasswordHash = await bcrypt.hash('Password123!', 10);

  const adminUser = await prisma.user.create({
    data: {
      name: 'Alex Rivera (Admin)',
      email: 'admin@commerceflow.com',
      password_hash: adminPasswordHash,
      role: 'ADMIN',
      cart: { create: {} },
    },
  });

  const customerUser = await prisma.user.create({
    data: {
      name: 'Rohan Sharma',
      email: 'customer@commerceflow.com',
      password_hash: customerPasswordHash,
      role: 'CUSTOMER',
      cart: { create: {} },
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      name: 'Sarah Connor',
      email: 'sarah.c@example.com',
      password_hash: customerPasswordHash,
      role: 'CUSTOMER',
      cart: { create: {} },
    },
  });

  console.log('👤 Created Users:');
  console.log('   - Admin: admin@commerceflow.com / Admin123!');
  console.log('   - Customer: customer@commerceflow.com / Password123!');

  // 3. Create Categories
  const categoriesData = [
    {
      name: 'Audio & Headphones',
      slug: 'audio-headphones',
      description: 'Premium noise-canceling headphones, earbuds, and studio-grade sound systems.',
      image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
    },
    {
      name: 'Laptops & Computers',
      slug: 'laptops-computers',
      description: 'Ultra-portable laptops, workstation setups, and high-performance accessories.',
      image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80',
    },
    {
      name: 'Smart Wearables',
      slug: 'smart-wearables',
      description: 'Fitness trackers, health monitoring smartwatches, and next-gen wearables.',
      image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
    },
    {
      name: 'Mobile & Tablets',
      slug: 'mobile-tablets',
      description: 'Flagship smartphones, pro tablets, and essential mobile gear.',
      image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80',
    },
    {
      name: 'Gaming Gear',
      slug: 'gaming-gear',
      description: 'Mechanical keyboards, ultra-precise mice, and immersive gaming setups.',
      image_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80',
    },
    {
      name: 'Smart Home',
      slug: 'smart-home',
      description: 'Ambient smart lighting, AI home assistants, and automated living devices.',
      image_url: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=600&auto=format&fit=crop&q=80',
    },
  ];

  const categories: Record<string, any> = {};
  for (const cat of categoriesData) {
    const created = await prisma.category.create({ data: cat });
    categories[cat.slug] = created;
  }
  console.log(`📁 Created ${Object.keys(categories).length} Categories.`);

  // 4. Create Products with multiple images and inventory
  const productsData = [
    {
      name: 'FlowSound Nova Pro Wireless Headphones',
      slug: 'flowsound-nova-pro-wireless-headphones',
      description: 'Experience pure acoustic excellence with 40mm beryllium drivers, active hybrid noise cancellation (ANC), 45-hour battery life, and ultra-plush memory foam earcups for all-day comfort.',
      price: 18999,
      stock_quantity: 14,
      sku: 'CF-AUD-001',
      category_id: categories['audio-headphones'].id,
      status: 'ACTIVE',
      images: [
        { image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80', is_primary: true, display_order: 0 },
        { image_url: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80', is_primary: false, display_order: 1 },
        { image_url: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&auto=format&fit=crop&q=80', is_primary: false, display_order: 2 },
      ],
    },
    {
      name: 'AeroBook Titanium 16" Creator Laptop',
      slug: 'aerobook-titanium-16-creator-laptop',
      description: 'Engineered for developers and creators. Powered by an M3 Pro processor, 32GB unified RAM, 1TB ultra-fast NVMe SSD, and a breathtaking 3.2K 120Hz Mini-LED Liquid Retina display.',
      price: 149999,
      stock_quantity: 8,
      sku: 'CF-LAP-002',
      category_id: categories['laptops-computers'].id,
      status: 'ACTIVE',
      images: [
        { image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80', is_primary: true, display_order: 0 },
        { image_url: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&auto=format&fit=crop&q=80', is_primary: false, display_order: 1 },
        { image_url: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800&auto=format&fit=crop&q=80', is_primary: false, display_order: 2 },
      ],
    },
    {
      name: 'PulseTrack Horizon Smartwatch Ultra',
      slug: 'pulsetrack-horizon-smartwatch-ultra',
      description: 'Rugged aerospace-grade titanium case with dual-frequency GPS, ECG monitor, blood oxygen tracking, 100m water resistance, and up to 72 hours of battery endurance.',
      price: 24999,
      stock_quantity: 3, // LOW STOCK (<=5)
      sku: 'CF-WRB-003',
      category_id: categories['smart-wearables'].id,
      status: 'ACTIVE',
      images: [
        { image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80', is_primary: true, display_order: 0 },
        { image_url: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&auto=format&fit=crop&q=80', is_primary: false, display_order: 1 },
      ],
    },
    {
      name: 'ApexPro 75% Wireless Mechanical Keyboard',
      slug: 'apexpro-75-wireless-mechanical-keyboard',
      description: 'Gasket-mounted mechanical keyboard with hot-swappable custom lubricated linear switches, CNC aluminum chassis, PBT double-shot keycaps, and tri-mode connectivity (2.4G/BT/USB-C).',
      price: 11499,
      stock_quantity: 18,
      sku: 'CF-GAM-004',
      category_id: categories['gaming-gear'].id,
      status: 'ACTIVE',
      images: [
        { image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80', is_primary: true, display_order: 0 },
        { image_url: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800&auto=format&fit=crop&q=80', is_primary: false, display_order: 1 },
      ],
    },
    {
      name: 'Lumina Smart Ambient Studio Bar 2-Pack',
      slug: 'lumina-smart-ambient-studio-bar-2-pack',
      description: 'Sync your workspace with over 16 million vibrant colors and reactive sound visualizer modes. Seamlessly connects with Apple Home, Alexa, and Google Assistant.',
      price: 6999,
      stock_quantity: 2, // LOW STOCK (<=5)
      sku: 'CF-SMH-005',
      category_id: categories['smart-home'].id,
      status: 'ACTIVE',
      images: [
        { image_url: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=800&auto=format&fit=crop&q=80', is_primary: true, display_order: 0 },
        { image_url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80', is_primary: false, display_order: 1 },
      ],
    },
    {
      name: 'Vortex Precision 4K Wireless Gaming Mouse',
      slug: 'vortex-precision-4k-wireless-gaming-mouse',
      description: 'Ultra-lightweight 49-gram magnesium skeleton design with 26,000 DPI optical sensor, optical micro switches rated for 100M clicks, and zero-latency 4,000Hz polling rate.',
      price: 8499,
      stock_quantity: 0, // OUT OF STOCK
      sku: 'CF-GAM-006',
      category_id: categories['gaming-gear'].id,
      status: 'OUT_OF_STOCK',
      images: [
        { image_url: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=80', is_primary: true, display_order: 0 },
        { image_url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&auto=format&fit=crop&q=80', is_primary: false, display_order: 1 },
      ],
    },
    {
      name: 'SoundPod Air ANC True Wireless Earbuds',
      slug: 'soundpod-air-anc-true-wireless-earbuds',
      description: 'Studio sound inside your pocket. Featuring adaptive spatial audio with dynamic head tracking, transparency mode, wireless Qi charging case, and IPX5 sweat resistance.',
      price: 9999,
      stock_quantity: 25,
      sku: 'CF-AUD-007',
      category_id: categories['audio-headphones'].id,
      status: 'ACTIVE',
      images: [
        { image_url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80', is_primary: true, display_order: 0 },
        { image_url: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=800&auto=format&fit=crop&q=80', is_primary: false, display_order: 1 },
      ],
    },
    {
      name: 'OmniDesk Pro Dual Monitor Arm Mount',
      slug: 'omnidesk-pro-dual-monitor-arm-mount',
      description: 'Heavy-duty gas spring dual monitor mount supporting up to 34" ultrawide displays. Integrated cable management channels and smooth 360-degree swivel articulation.',
      price: 5499,
      stock_quantity: 12,
      sku: 'CF-LAP-008',
      category_id: categories['laptops-computers'].id,
      status: 'ACTIVE',
      images: [
        { image_url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80', is_primary: true, display_order: 0 },
      ],
    },
    {
      name: 'VisionPad Max 12.9" OLED Tablet',
      slug: 'visionpad-max-12-9-oled-tablet',
      description: 'Stunning 120Hz tandem OLED screen with stylus support, 16GB RAM, 512GB storage, quad-speaker Dolby Atmos audio, and all-day 10,000mAh battery life.',
      price: 79999,
      stock_quantity: 4, // LOW STOCK (<=5)
      sku: 'CF-MOB-009',
      category_id: categories['mobile-tablets'].id,
      status: 'ACTIVE',
      images: [
        { image_url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&auto=format&fit=crop&q=80', is_primary: true, display_order: 0 },
        { image_url: 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800&auto=format&fit=crop&q=80', is_primary: false, display_order: 1 },
      ],
    },
    {
      name: 'AuraSense Smart Air Purifier & Monitor',
      slug: 'aurasense-smart-air-purifier-monitor',
      description: 'Medical-grade True HEPA H13 filtration removes 99.97% of airborne allergens and smoke. Real-time AQI display and smartphone app automation.',
      price: 13999,
      stock_quantity: 9,
      sku: 'CF-SMH-010',
      category_id: categories['smart-home'].id,
      status: 'ACTIVE',
      images: [
        { image_url: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&auto=format&fit=crop&q=80', is_primary: true, display_order: 0 },
      ],
    },
    {
      name: 'Zenith Magnetic Fast Wireless Charging Station 3-in-1',
      slug: 'zenith-magnetic-fast-wireless-charging-station',
      description: 'Premium aluminum stand capable of simultaneously fast-charging your smartphone (15W), smartwatch (5W), and wireless earbuds (5W) with a single cable.',
      price: 4299,
      stock_quantity: 30,
      sku: 'CF-MOB-011',
      category_id: categories['mobile-tablets'].id,
      status: 'ACTIVE',
      images: [
        { image_url: 'https://images.unsplash.com/photo-1622445262464-84b1456045b6?w=800&auto=format&fit=crop&q=80', is_primary: true, display_order: 0 },
      ],
    },
    {
      name: 'HyperDrive Gen4 2TB NVMe PCIe M.2 SSD',
      slug: 'hyperdrive-gen4-2tb-nvme-pcie-m2-ssd',
      description: 'Blazing fast 7,450 MB/s read and 6,900 MB/s write speeds with a sleek aluminum heatsink. Perfect upgrade for PC gaming rigs and PlayStation 5.',
      price: 15499,
      stock_quantity: 15,
      sku: 'CF-GAM-012',
      category_id: categories['gaming-gear'].id,
      status: 'ACTIVE',
      images: [
        { image_url: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800&auto=format&fit=crop&q=80', is_primary: true, display_order: 0 },
      ],
    },
  ];

  const createdProducts = [];
  for (const item of productsData) {
    const { images, ...prodFields } = item;
    const prod = await prisma.product.create({
      data: {
        ...prodFields,
        images: {
          create: images,
        },
      },
      include: { images: true },
    });

    if (prod.stock_quantity > 0) {
      await prisma.inventoryLog.create({
        data: {
          product_id: prod.id,
          previous_stock: 0,
          new_stock: prod.stock_quantity,
          change_amount: prod.stock_quantity,
          reason: 'Initial Product Catalog Stock',
        },
      });
    }

    createdProducts.push(prod);
  }

  console.log(`📦 Created ${createdProducts.length} Products with images and initial inventory logs.`);

  // 5. Create Sample Orders for testing Admin and Customer portals
  const sampleOrders = [
    {
      order_number: 'CF-782910241',
      user_id: customerUser.id,
      shipping_name: 'Rohan Sharma',
      shipping_phone: '+91 9876543210',
      shipping_address: 'Flat 402, Skyline Residency, Outer Ring Road',
      shipping_city: 'Bengaluru',
      shipping_state: 'Karnataka',
      shipping_postal: '560103',
      subtotal: 18999,
      shipping_fee: 0,
      total_amount: 18999,
      payment_status: 'PAID',
      order_status: 'DELIVERED',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      items: [
        {
          product_id: createdProducts[0].id,
          product_name: createdProducts[0].name,
          product_sku: createdProducts[0].sku,
          product_image: createdProducts[0].images[0]?.image_url,
          quantity: 1,
          price: 18999,
        },
      ],
      payment: {
        payment_method: 'CREDIT_CARD',
        payment_status: 'PAID',
        transaction_reference: 'TXN-17248001-9821',
        amount: 18999,
      },
    },
    {
      order_number: 'CF-941827453',
      user_id: customerUser.id,
      shipping_name: 'Rohan Sharma',
      shipping_phone: '+91 9876543210',
      shipping_address: 'Flat 402, Skyline Residency, Outer Ring Road',
      shipping_city: 'Bengaluru',
      shipping_state: 'Karnataka',
      shipping_postal: '560103',
      subtotal: 36498,
      shipping_fee: 0,
      total_amount: 36498,
      payment_status: 'PAID',
      order_status: 'SHIPPED',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      items: [
        {
          product_id: createdProducts[2].id,
          product_name: createdProducts[2].name,
          product_sku: createdProducts[2].sku,
          product_image: createdProducts[2].images[0]?.image_url,
          quantity: 1,
          price: 24999,
        },
        {
          product_id: createdProducts[3].id,
          product_name: createdProducts[3].name,
          product_sku: createdProducts[3].sku,
          product_image: createdProducts[3].images[0]?.image_url,
          quantity: 1,
          price: 11499,
        },
      ],
      payment: {
        payment_method: 'UPI',
        payment_status: 'PAID',
        transaction_reference: 'TXN-17248102-3847',
        amount: 36498,
      },
    },
    {
      order_number: 'CF-103847192',
      user_id: customer2.id,
      shipping_name: 'Sarah Connor',
      shipping_phone: '+91 9123456780',
      shipping_address: 'Cyberdyne Villa #12, Bandra West',
      shipping_city: 'Mumbai',
      shipping_state: 'Maharashtra',
      shipping_postal: '400050',
      subtotal: 6999,
      shipping_fee: 0,
      total_amount: 6999,
      payment_status: 'PENDING',
      order_status: 'PENDING',
      created_at: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      items: [
        {
          product_id: createdProducts[4].id,
          product_name: createdProducts[4].name,
          product_sku: createdProducts[4].sku,
          product_image: createdProducts[4].images[0]?.image_url,
          quantity: 1,
          price: 6999,
        },
      ],
      payment: {
        payment_method: 'COD',
        payment_status: 'PENDING',
        transaction_reference: 'TXN-17248209-5102',
        amount: 6999,
      },
    },
  ];

  for (const ord of sampleOrders) {
    const { items, payment, ...orderFields } = ord;
    const createdOrder = await prisma.order.create({
      data: {
        ...orderFields,
        items: {
          create: items,
        },
        payments: {
          create: payment,
        },
      },
    });

    for (const oi of items) {
      await prisma.inventoryLog.create({
        data: {
          product_id: oi.product_id,
          previous_stock: 20,
          new_stock: 20 - oi.quantity,
          change_amount: -oi.quantity,
          reason: `Order #${createdOrder.order_number} Checkout (${oi.quantity} units)`,
          created_at: ord.created_at,
        },
      });
    }
  }

  console.log(`🛍️ Created ${sampleOrders.length} Sample Orders with items and payments.`);
  console.log('✨ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
