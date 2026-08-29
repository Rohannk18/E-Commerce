import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart, CartItem } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

export const CartPage: React.FC = () => {
  const { cart, updateQuantity, removeItem, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/auth?redirect=/checkout');
    } else {
      navigate('/checkout');
    }
  };

  const hasOutOfStockItems = cart?.items.some((i: CartItem) => !i.isStockAvailable || !i.isProductActive);

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Your Cart is Empty</h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
          Explore our collection of cutting-edge technology and gadgets.
        </p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-indigo-500/20"
        >
          <ArrowLeft className="w-4 h-4" /> Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Shopping Cart
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review your selected gadgets before checking out
          </p>
        </div>
        <button
          onClick={() => clearCart()}
          className="text-xs text-red-600 hover:text-red-700 font-semibold transition flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" /> Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Items List */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item: CartItem) => (
            <div
              key={item.id}
              className={`p-4 sm:p-5 rounded-2xl bg-white border transition flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between shadow-sm ${
                !item.isStockAvailable ? 'border-red-300 bg-red-50/30' : 'border-slate-200'
              }`}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-20 h-20 rounded-xl bg-slate-100 shrink-0 overflow-hidden border border-slate-200">
                  <img
                    src={item.product.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&q=80'}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-1 min-w-0">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">
                    {item.product.sku}
                  </span>
                  <Link
                    to={`/products/${item.product.id}`}
                    className="block text-sm font-bold text-slate-900 hover:text-indigo-600 truncate"
                  >
                    {item.product.name}
                  </Link>
                  <p className="text-xs font-semibold text-indigo-600">
                    ₹{item.product.price.toLocaleString('en-IN')}
                  </p>
                  {!item.isStockAvailable && (
                    <p className="text-[11px] font-bold text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Only {item.product.stock_quantity} available in inventory!
                    </p>
                  )}
                </div>
              </div>

              {/* Quantity Controls & Total */}
              <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    className="p-1.5 px-3 text-slate-600 hover:bg-slate-200 disabled:opacity-30 transition"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="px-3 text-xs font-bold text-slate-900">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    disabled={item.quantity >= item.product.stock_quantity}
                    className="p-1.5 px-3 text-slate-600 hover:bg-slate-200 disabled:opacity-30 transition"
                    title={
                      item.quantity >= item.product.stock_quantity
                        ? 'Max available stock reached'
                        : 'Add more'
                    }
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <div className="text-right min-w-[90px]">
                  <span className="text-sm font-extrabold text-slate-900">
                    ₹{item.itemTotal.toLocaleString('en-IN')}
                  </span>
                </div>

                <button
                  onClick={() => removeItem(item.id)}
                  className="text-slate-400 hover:text-red-600 transition p-1.5 rounded-lg hover:bg-red-50"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary Sidebar */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Order Summary
          </h2>

          <div className="space-y-3 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Items Total ({cart.item_count})</span>
              <span className="font-semibold text-slate-900">
                ₹{cart.subtotal.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span className="font-semibold text-slate-900">
                {cart.shipping_fee === 0 ? (
                  <span className="text-emerald-600 font-bold">FREE</span>
                ) : (
                  `₹${cart.shipping_fee}`
                )}
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-900 pt-3 border-t border-slate-100">
              <span>Grand Total</span>
              <span className="text-indigo-600 font-black text-lg">
                ₹{cart.total.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {hasOutOfStockItems && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              Please resolve quantity conflicts before proceeding to checkout.
            </div>
          )}

          <button
            onClick={handleCheckout}
            disabled={hasOutOfStockItems}
            className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="flex items-center justify-center gap-1.5 text-slate-400 text-[11px] pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Atomic Inventory Concurrency Guaranteed
          </div>
        </div>
      </div>
    </div>
  );
};
