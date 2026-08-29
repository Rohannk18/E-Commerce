import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

export interface CartItem {
  id: number;
  cart_id: number;
  product_id: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    slug: string;
    price: number;
    stock_quantity: number;
    sku: string;
    status: string;
    image: string | null;
  };
  itemTotal: number;
  isStockAvailable: boolean;
  isProductActive: boolean;
}

export interface CartData {
  id: number;
  user_id: number;
  items: CartItem[];
  subtotal: number;
  shipping_fee: number;
  total: number;
  item_count: number;
}

interface CartContextType {
  cart: CartData | null;
  itemCount: number;
  isLoading: boolean;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  addToCart: (productId: number, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState<CartData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(null);
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.get('/cart');
      if (res.data?.cart) {
        setCart(res.data.cart);
      }
    } catch {
      // Cart fetch failed or unauthorized
      setCart(null);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = async (productId: number, quantity: number = 1) => {
    try {
      await api.post('/cart/items', { productId, quantity });
      await refreshCart();
      setIsDrawerOpen(true);
    } catch (err: any) {
      throw err;
    }
  };

  const updateQuantity = async (itemId: number, quantity: number) => {
    try {
      await api.put(`/cart/items/${itemId}`, { quantity });
      await refreshCart();
    } catch (err: any) {
      throw err;
    }
  };

  const removeItem = async (itemId: number) => {
    try {
      await api.delete(`/cart/items/${itemId}`);
      await refreshCart();
    } catch (err: any) {
      throw err;
    }
  };

  const clearCart = async () => {
    try {
      await api.delete('/cart');
      await refreshCart();
    } catch (err: any) {
      throw err;
    }
  };

  const itemCount = cart ? cart.item_count : 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        itemCount,
        isLoading,
        isDrawerOpen,
        setIsDrawerOpen,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
