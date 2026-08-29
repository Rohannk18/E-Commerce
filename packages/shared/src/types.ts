export type UserRole = 'CUSTOMER' | 'ADMIN';

export type ProductStatus = 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK';

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED';

export type PaymentMethod = 'CREDIT_CARD' | 'UPI' | 'COD';

export interface UserDTO {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface CategoryDTO {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  _count?: {
    products: number;
  };
}

export interface ProductImageDTO {
  id: number;
  product_id: number;
  image_url: string;
  is_primary: boolean;
  display_order: number;
}

export interface ProductDTO {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock_quantity: number;
  sku: string;
  category_id: number;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
  category?: CategoryDTO;
  images: ProductImageDTO[];
}

export interface CartItemDTO {
  id: number;
  cart_id: number;
  product_id: number;
  quantity: number;
  product: ProductDTO;
}

export interface CartDTO {
  id: number;
  user_id: number;
  items: CartItemDTO[];
  subtotal: number;
  shipping_fee: number;
  total: number;
  item_count: number;
}

export interface OrderItemDTO {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  product_image?: string | null;
  quantity: number;
  price: number;
}

export interface PaymentDTO {
  id: number;
  order_id: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  transaction_reference?: string | null;
  amount: number;
  created_at: string;
}

export interface OrderDTO {
  id: number;
  order_number: string;
  user_id: number;
  shipping_name: string;
  shipping_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_postal: string;
  subtotal: number;
  shipping_fee: number;
  total_amount: number;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  items: OrderItemDTO[];
  payments?: PaymentDTO[];
}

export interface InventoryLogDTO {
  id: number;
  product_id: number;
  previous_stock: number;
  new_stock: number;
  change_amount: number;
  reason: string;
  created_at: string;
  product?: {
    id: number;
    name: string;
    sku: string;
  };
}

export interface DashboardMetricsDTO {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  pendingOrders: number;
  lowStockProducts: number;
  recentOrders: OrderDTO[];
  categoryBreakdown: {
    category: string;
    count: number;
    revenue: number;
  }[];
}

// Order Status State Machine Transitions
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [], // Terminal state
  CANCELLED: [], // Terminal state
};

export function canTransitionOrderStatus(
  from: OrderStatus,
  to: OrderStatus
): boolean {
  if (from === to) return true;
  const allowed = ORDER_STATUS_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

export function getNextAllowedStatuses(current: OrderStatus): OrderStatus[] {
  return ORDER_STATUS_TRANSITIONS[current] || [];
}

export const LOW_STOCK_THRESHOLD = 5;
