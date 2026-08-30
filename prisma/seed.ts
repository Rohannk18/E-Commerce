import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding for CommerceFlow...');

  // 1. Clean up existing records
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

  console.log('👤 Created Users (Admin & Customer).');

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
      description: 'Ultra-portable laptops, workstation setups, and high-performance gaming rigs.',
      image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80',
    },
    {
      name: 'Mobile & Smartphones',
      slug: 'mobile-smartphones',
      description: 'Flagship 5G smartphones, foldables, and pro creator mobile devices.',
      image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80',
    },
    {
      name: 'Powerbanks & Charging',
      slug: 'powerbanks-charging',
      description: 'High-capacity 140W laptop powerbanks, magnetic wireless batteries, and fast chargers.',
      image_url: 'https://images.unsplash.com/photo-1609592424364-6dfd1a1bca26?w=600&auto=format&fit=crop&q=80',
    },
    {
      name: 'Smart Wearables',
      slug: 'smart-wearables',
      description: 'Fitness trackers, health monitoring smartwatches, and next-gen wearables.',
      image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
    },
    {
      name: 'Gaming Gear',
      slug: 'gaming-gear',
      description: 'Mechanical keyboards, ultra-precise mice, and immersive gaming setups.',
      image_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80',
    },
  ];

  const categories: Record<string, any> = {};
  for (const cat of categoriesData) {
    const created = await prisma.category.create({ data: cat });
    categories[cat.slug] = created;
  }
  console.log(`📁 Created ${Object.keys(categories).length} Categories.`);

  // 4. Create 20 Flagship Tech Products
  const productsData = [
    // 5 MOBILES
    {
      name: 'TitanPro 5G Ultra Flagship (256GB)',
      slug: 'titanpro-5g-ultra-flagship',
      description: '6.8" 120Hz Dynamic AMOLED 2X display, Snapdragon 8 Gen 3, 200MP Quad Camera with 100x Space Zoom, titanium frame, and 5000mAh all-day battery.',
      price: 74999,
      stock_quantity: 15,
      sku: 'CF-MOB-001',
      category_id: categories['mobile-smartphones'].id,
      status: 'ACTIVE',
      images: [
        { image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80', is_primary: true, display_order: 0 },
        { image_url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&auto=format&fit=crop&q=80', is_primary: false, display_order: 1 },
      ],
    },
    {
      name: 'NovaFold Dual-Screen 5G (512GB)',
      slug: 'novafold-dual-screen-5g',
      description: 'Next-gen foldable phone with 7.6" flexible OLED main screen and 6.2" cover display, Armor Aluminum hinge, and multitask stylus support.',
      price: 129999,
      stock_quantity: 8,
      sku: 'CF-MOB-002',
      category_id: categories['mobile-smartphones'].id,
      status: 'ACTIVE',
      images: [
        { image_url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop&q=80', is_primary: true, display_order: 0 },
      ],
    },
    {
      name: 'PixelCraft Pro 120Hz Studio Phone (128GB)',
      slug: 'pixelcraft-pro-120hz-studio-phone',
      description: 'Pro-grade computational photography with dedicated Tensor AI chip, 50MP triple lens system, and clean stock Android interface.',
      price: 64999,
      stock_quantity: 12,
      sku: 'CF-MOB-003',
      category_id: categories['mobile-smartphones'].id,
      status: 'ACTIVE',
      images: [
        { image_url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&auto=format&fit=crop&q=80', is_primary: true, display_order: 0 },
      ],
    },
    {
      name: 'Apex Gaming Phone 165Hz RGB Edition (512GB)',
      slug: 'apex-gaming-phone-165hz-rgb-edition',
      description: 'High-performance mobile gaming monster with 165Hz AMOLED, built-in active cooling fan, ultrasonic shoulder triggers, and 6000mAh dual-cell battery.',
      price: 59999,
      stock_quantity: 10,
      sku: 'CF-MOB-004',
      category_id: categories['mobile-smartphones'].id,
      status: 'ACTIVE',
      images: [
        { image_url: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&auto=format&fit=crop&q=80', is_primary: true, display_order: 0 },
      ],
    },
    {
      name: 'AeroSlim Compact Flagship 5G (128GB)',
      slug: 'aeroslim-compact-flagship-5g',
      description: 'Ergonomic one-handed compact design weighing just 165g with flagship processor, IP68 water resistance, and crisp 6.1" OLED display.',
      price: 49999,
      stock_quantity: 20,
      sku: 'CF-MOB-005',
      category_id: categories['mobile-smartphones'].id,
      status: 'ACTIVE',
      images: [
        { image_url: 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=800&auto=format&fit=crop&q=80', is_primary: true, display_order: 0 },
      ],
    },

    // 5 HEADPHONES
    {
      name: 'FlowSound Nova Pro Wireless ANC Headphones',
      slug: 'flowsound-nova-pro-wireless-anc-headphones',
      description: 'Experience pure acoustic excellence with 40mm beryllium drivers, active hybrid noise cancellation (ANC), 45-hour battery life, and ultra-plush memory foam earcups.',
      price: 18999,
      stock_quantity: 14,
      sku: 'CF-AUD-001',
      category_id: categories['audio-headphones'].id,
      status: 'ACTIVE',
      images: [
        { image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80', is_primary: true, display_order: 0 },
        { image_url: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80', is_primary: false, display_order: 1 },
      ],
    },
    {
      name: 'SoundPod Air ANC True Wireless Earbuds',
      slug: 'soundpod-air-anc-true-wireless-earbuds',
      description: 'Studio sound in your pocket with adaptive spatial audio, head tracking, active noise cancellation, wireless Qi charging case, and IPX5 sweat resistance.',
      price: 9999,
      stock_quantity: 25,
      sku: 'CF-AUD-002',
      category_id: categories['audio-headphones'].id,
      status: 'ACTIVE',
      images: [
        { image_url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80', is_primary: true, display_order: 0 },
      ],
    },
    {
      name: 'StudioAcoustics Reference Open-Back Headphones',
      slug: 'studioacoustics-reference-open-back-headphones',
      description: 'Open-back planar magnetic headphones engineered for mixing and critical listening with unmatched soundstage width and flat frequency response.',
      price: 29999,
      stock_quantity: 6,
      sku: 'CF-AUD-003',
      category_id: categories['audio-headphones'].id,
      status: 'ACTIVE',
      images: [
        { image_url: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80', is_primary: true, display_order: 0 },
      ],
    },
    {
      name: 'PulseWave Sport Waterproof Earphones (IPX8)',
      slug: 'pulsewave-sport-waterproof-earphones',
      description: 'Rugged waterproof in-ear sport earphones with secure ear-hooks, ambient sound pass-through, and 12-hour continuous workout playback.',
      price: 4499,
      stock_quantity: 30,
      sku: 'CF-AUD-004',
      category_id: categories['audio-headphones'].id,
      status: 'ACTIVE',
      images: [
        { image_url: 'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=800&auto=format&fit=crop&q=80', is_primary: true, display_order: 0 },
      ],
    },
    {
      name: 'AcousticBar Hi-Res Wireless Neckband',
      slug: 'acousticbar-hi-res-wireless-neckband',
      description: 'Ultra-flexible silicone neckband with magnetic earbuds, LDAC high-resolution audio streaming, dual-device pairing, and vibration call alerts.',
      price: 3299,
      stock_quantity: 40,
      sku: 'CF-AUD-005',
      category_id: categories['audio-headphones'].id,
      status: 'ACTIVE',
      images: [
        { image_url: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&auto=format&fit=crop&q=80', is_primary: true, display_order: 0 },
      ],
    },

    // 5 LAPTOPS
    {
      name: 'AeroBook Titanium 16" Creator Workstation',
      slug: 'aerobook-titanium-16-creator-workstation',
      description: 'M3 Pro chip, 32GB unified RAM, 1TB NVMe SSD, and 3.2K 120Hz Mini-LED Liquid Retina display engineered for developers and video creators.',
      price: 149999,
      stock_quantity: 8,
      sku: 'CF-LAP-001',
      category_id: categories['laptops-computers'].id,
      status: 'ACTIVE',
      images: [
        { image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80', is_primary: true, display_order: 0 },
        { image_url: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&auto=format&fit=crop&q=80', is_primary: false, display_order: 1 },
      ],
    },
    {
      name: 'CyberBlade 15.6" RTX 4080 Gaming Laptop',
      slug: 'cyberblade-15-6-rtx-4080-gaming-laptop',
      description: 'Intel Core i9-14900HX, NVIDIA GeForce RTX 4080 12GB GDDR6, 32GB DDR5 RAM, 2TB SSD, and 240Hz QHD G-Sync IPS panel.',
      price: 189999,
      stock_quantity: 5,
      sku: 'CF-LAP-002',
      category_id: categories['laptops-computers'].id,
      status: 'ACTIVE',
      images: [
        { image_url: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&auto=format&fit=crop&q=80', is_primary: true, display_order: 0 },
      ],
    },
    {
      name: 'ZenBook Carbon 14" Ultra-Slim Laptop',
      slug: 'zenbook-carbon-14-ultra-slim-laptop',
      description: 'Weighing just 990 grams with Intel Core Ultra 7 processor, 16GB LPDDR5X RAM, 2.8K OLED display, and 18-hour battery life.',
      price: 89999,
      stock_quantity: 15,
      sku: 'CF-LAP-003',
      category_id: categories['laptops-computers'].id,
      status: 'ACTIVE',
      images: [
        { image_url: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800&auto=format&fit=crop&q=80', is_primary: true, display_order: 0 },
      ],
    },
    {
      name: 'DuoScreen Infinity Pro Dual 14" Touch Laptop',
      slug: 'duoscreen-infinity-pro-dual-14-touch-laptop',
      description: 'Innovative dual 14" OLED touchscreen displays with detachable magnetic Bluetooth keyboard, built-in kickstand, and active stylus support.',
      price: 124999,
      stock_quantity: 4,
      sku: 'CF-LAP-004',
      category_id: categories['laptops-computers'].id,
      status: 'ACTIVE',
      images: [
        { image_url: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&auto=format&fit=crop&q=80', is_primary: true, display_order: 0 },
      ],
    },
    {
      name: 'FlexTouch 360 2-in-1 Convertible Laptop',
      slug: 'flextouch-360-2-in-1-convertible-laptop',
      description: '360-degree geared hinge that converts from laptop to tablet mode, 14" FHD Touch display with stylus pen, AMD Ryzen 7, and 16GB RAM.',
      price: 69999,
      stock_quantity: 12,
      sku: 'CF-LAP-005',
      category_id: categories['laptops-computers'].id,
      status: 'ACTIVE',
      images: [
        { image_url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&auto=format&fit=crop&q=80', is_primary: true, display_order: 0 },
      ],
    },

    // 5 POWERBANKS
    {
      name: 'VoltForge 25,000mAh 140W PD3.1 Laptop Powerbank',
      slug: 'voltforge-25000mah-140w-laptop-powerbank',
      description: 'High-capacity power station delivering 140W single-port PD fast charging for MacBook Pro, laptops, phones, and tablets with interactive digital smart OLED screen.',
      price: 6999,
      stock_quantity: 22,
      sku: 'CF-PWR-001',
      category_id: categories['powerbanks-charging'].id,
      status: 'ACTIVE',
      images: [
        { image_url: 'https://images.unsplash.com/photo-1609592424364-6dfd1a1bca26?w=800&auto=format&fit=crop&q=80', is_primary: true, display_order: 0 },
      ],
    },
    {
      name: 'MagSnap 10,000mAh Magnetic Wireless Powerbank',
      slug: 'magsnap-10000mah-magnetic-wireless-powerbank',
      description: 'Snaps magnetically to the back of iPhone and Qi2 phones for 15W wireless charging, with foldable kickstand and 20W USB-C bidirectional port.',
      price: 3499,
      stock_quantity: 35,
      sku: 'CF-PWR-002',
      category_id: categories['powerbanks-charging'].id,
      status: 'ACTIVE',
      images: [
        { image_url: 'https://images.unsplash.com/photo-1622445262464-84b1456045b6?w=800&auto=format&fit=crop&q=80', is_primary: true, display_order: 0 },
      ],
    },
    {
      name: 'PocketCharge Slim 5,000mAh Ultra-Thin Card Powerbank',
      slug: 'pocketcharge-slim-5000mah-ultra-thin-card-powerbank',
      description: 'Razor-thin 8.5mm aluminum profile that easily slips into your pocket or wallet, featuring built-in USB-C cable and fast charge protection.',
      price: 1899,
      stock_quantity: 50,
      sku: 'CF-PWR-003',
      category_id: categories['powerbanks-charging'].id,
      status: 'ACTIVE',
      images: [
        { image_url: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80', is_primary: true, display_order: 0 },
      ],
    },
    {
      name: 'SolarTrek Rugged 20,000mAh Camping Powerbank',
      slug: 'solartrek-rugged-20000mah-camping-powerbank',
      description: 'Heavy-duty shockproof and IP67 waterproof outdoor battery pack with integrated solar panel, bright LED emergency flashlight, and dual USB output.',
      price: 4999,
      stock_quantity: 18,
      sku: 'CF-PWR-004',
      category_id: categories['powerbanks-charging'].id,
      status: 'ACTIVE',
      images: [
        { image_url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80', is_primary: true, display_order: 0 },
      ],
    },
    {
      name: 'PowerMatrix 3-in-1 20,000mAh Fast Charging Hub',
      slug: 'powermatrix-3-in-1-20000mah-fast-charging-hub',
      description: 'All-in-one charging power station with 65W GaN wall plug integrated directly into the powerbank, retractable cables, and multi-device fast delivery.',
      price: 4299,
      stock_quantity: 28,
      sku: 'CF-PWR-005',
      category_id: categories['powerbanks-charging'].id,
      status: 'ACTIVE',
      images: [
        { image_url: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800&auto=format&fit=crop&q=80', is_primary: true, display_order: 0 },
      ],
    },
  ];

  for (const item of productsData) {
    const { images, ...prodData } = item;
    const createdProduct = await prisma.product.create({
      data: prodData,
    });

    for (const img of images) {
      await prisma.productImage.create({
        data: {
          product_id: createdProduct.id,
          image_url: img.image_url,
          is_primary: img.is_primary,
          display_order: img.display_order,
        },
      });
    }

    await prisma.inventoryLog.create({
      data: {
        product_id: createdProduct.id,
        previous_stock: 0,
        new_stock: createdProduct.stock_quantity,
        change_amount: createdProduct.stock_quantity,
        reason: 'Initial seed restock',
      },
    });
  }

  console.log(`✨ Created ${productsData.length} Products with images and initial inventory logs.`);

  // 5. Create Initial Customer Order
  const firstProduct = await prisma.product.findFirst();
  if (firstProduct) {
    const initialOrder = await prisma.order.create({
      data: {
        order_number: 'CF-058211294',
        user_id: customerUser.id,
        shipping_name: 'Rohan Sharma',
        shipping_phone: '+91 98765 43210',
        shipping_address: 'Flat 402, Skyline Residency, MG Road',
        shipping_city: 'Bengaluru',
        shipping_state: 'Karnataka',
        shipping_postal: '560001',
        subtotal: firstProduct.price,
        shipping_fee: 0,
        total_amount: firstProduct.price,
        payment_status: 'PAID',
        order_status: 'PENDING',
        items: {
          create: [
            {
              product_id: firstProduct.id,
              product_name: firstProduct.name,
              product_sku: firstProduct.sku,
              product_image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80',
              quantity: 1,
              price: firstProduct.price,
            },
          ],
        },
        payments: {
          create: [
            {
              payment_method: 'CREDIT_CARD',
              payment_status: 'PAID',
              transaction_reference: 'TXN-9941824',
              amount: firstProduct.price,
            },
          ],
        },
      },
    });

    console.log(`📦 Seeded Initial Customer Order #${initialOrder.order_number} (PENDING).`);
  }

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
