import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

export const CartDrawer: React.FC = () => {
  const { cart, isDrawerOpen, setIsDrawerOpen, updateQuantity, removeItem, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isDrawerOpen) return null;

  const handleUpdateQty = async (itemId: number, newQty: number) => {
    if (newQty < 1) return;
    setUpdatingId(itemId);
    setErrorMessage(null);
    try {
      await updateQuantity(itemId, newQty);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (itemId: number) => {
    setUpdatingId(itemId);
    setErrorMessage(null);
    try {
      await removeItem(itemId);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCheckout = () => {
    setIsDrawerOpen(false);
    if (!isAuthenticated) {
      navigate('/auth?redirect=/checkout');
    } else {
      navigate('/checkout');
    }
  };

  const hasOutOfStockItems = cart?.items.some((i) => !i.isStockAvailable || !i.isProductActive);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={() => setIsDrawerOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">Your Cart</h2>
              <span className="text-xs bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">
                {cart ? cart.item_count : 0} items
              </span>
            </div>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Error Notice if any */}
          {errorMessage && (
            <div className="mx-4 mt-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {!cart || cart.items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                  <ShoppingBag className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="font-semibold text-slate-800 text-base">Your cart is empty</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Discover our top gadgets, headphones, and gear to get started!
                </p>
                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    navigate('/products');
                  }}
                  className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              cart.items.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-2xl border transition flex gap-3 ${
                    !item.isStockAvailable
                      ? 'border-red-200 bg-red-50/40'
                      : 'border-slate-100 bg-white hover:border-slate-200 shadow-sm'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-xl bg-slate-100 shrink-0 overflow-hidden border border-slate-100">
                    <img
                      src={item.product.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80'}
                      alt={item.product.name}
                      className="w-full h-full object-cover object-center"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="text-xs font-bold text-slate-900 truncate leading-tight">
                          {item.product.name}
                        </h4>
                        <button
                          onClick={() => handleRemove(item.id)}
                          disabled={updatingId === item.id}
                          className="text-slate-400 hover:text-red-600 transition p-1 -mr-1"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs font-semibold text-indigo-600 mt-0.5">
                        ₹{item.product.price.toLocaleString('en-IN')}
                      </p>
                    </div>

                    {/* Stock Alert */}
                    {!item.isStockAvailable && (
                      <p className="text-[11px] font-medium text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Only {item.product.stock_quantity} in stock!
                      </p>
                    )}

                    {/* Quantity Selector */}
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100">
                      <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                        <button
                          onClick={() => handleUpdateQty(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1 || updatingId === item.id}
                          className="p-1 px-2 text-slate-600 hover:bg-slate-200 disabled:opacity-40 transition"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-bold text-slate-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                          disabled={
                            item.quantity >= item.product.stock_quantity ||
                            updatingId === item.id
                          }
                          className="p-1 px-2 text-slate-600 hover:bg-slate-200 disabled:opacity-40 transition"
                          title={
                            item.quantity >= item.product.stock_quantity
                              ? 'Max available stock reached'
                              : 'Add one more'
                          }
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="text-xs font-bold text-slate-800">
                        ₹{item.itemTotal.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer / Summary */}
          {cart && cart.items.length > 0 && (
            <div className="p-4 border-t border-slate-100 bg-slate-50/80 space-y-3">
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-800">
                    ₹{cart.subtotal.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery</span>
                  <span className="font-semibold text-slate-800">
                    {cart.shipping_fee === 0 ? (
                      <span className="text-emerald-600 font-bold">FREE</span>
                    ) : (
                      `₹${cart.shipping_fee}`
                    )}
                  </span>
                </div>
                {cart.subtotal < 999 && (
                  <p className="text-[11px] text-indigo-600">
                    Add ₹{(999 - cart.subtotal).toLocaleString('en-IN')} more for FREE delivery!
                  </p>
                )}
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Amount</span>
                  <span className="text-indigo-600 font-extrabold text-base">
                    ₹{cart.total.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {hasOutOfStockItems && (
                <p className="text-xs text-red-600 font-medium text-center">
                  Please adjust quantities for items exceeding stock before checkout.
                </p>
              )}

              <button
                onClick={handleCheckout}
                disabled={hasOutOfStockItems}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-sm shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 transition"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Simulated Checkout
                </span>
                <button
                  onClick={() => clearCart()}
                  className="hover:text-red-500 transition underline underline-offset-2"
                >
                  Clear Cart
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
