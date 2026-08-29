import React, { useEffect } from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { OrderDTO } from '@commerceflow/shared';
import { OrderTimeline } from '../components/orders/OrderTimeline';
import { OrderStatusBadge, PaymentStatusBadge } from '../components/orders/OrderStatusBadge';
import { CheckCircle2, Package, ArrowRight, Home, ShieldCheck } from 'lucide-react';

export const OrderConfirmationPage: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const location = useLocation();
  const order: OrderDTO | undefined = location.state?.order;

  useEffect(() => {
    // Fire festive celebration confetti!
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // Confetti fallback
    }
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-8 animate-in fade-in">
      {/* Celebration Header */}
      <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl text-center space-y-4 relative overflow-hidden">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md shadow-emerald-500/20">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Payment Verified & Stock Locked
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight pt-2">
            Thank you! Your order has been placed.
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Order <span className="font-mono font-bold text-slate-800">#{orderNumber || order?.order_number}</span> has been confirmed and atomic inventory has been updated.
          </p>
        </div>

        {/* Live Stepper */}
        <div className="pt-6 border-t border-slate-100 max-w-2xl mx-auto">
          <OrderTimeline currentStatus={order?.order_status || 'CONFIRMED'} />
        </div>
      </div>

      {/* Order Details Card */}
      {order && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Order Summary</h2>
              <p className="text-xs text-slate-400">
                Transaction Ref: {order.payments?.[0]?.transaction_reference || 'N/A'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <OrderStatusBadge status={order.order_status} size="sm" />
              <PaymentStatusBadge status={order.payment_status} />
            </div>
          </div>

          {/* Items */}
          <div className="divide-y divide-slate-100">
            {order.items.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                    <img
                      src={item.product_image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80'}
                      alt={item.product_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{item.product_name}</h4>
                    <span className="text-[11px] text-slate-400">
                      Qty: {item.quantity} × ₹{item.price.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
                <span className="font-extrabold text-slate-900">
                  ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>

          {/* Breakdown & Shipping */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 text-xs">
            <div className="space-y-1 text-slate-600 bg-slate-50 p-4 rounded-2xl">
              <h4 className="font-bold text-slate-900 mb-2">Shipping Information</h4>
              <p className="font-semibold text-slate-800">{order.shipping_name} ({order.shipping_phone})</p>
              <p>{order.shipping_address}</p>
              <p>{order.shipping_city}, {order.shipping_state} - {order.shipping_postal}</p>
            </div>

            <div className="space-y-2 text-slate-600 bg-slate-50 p-4 rounded-2xl">
              <h4 className="font-bold text-slate-900 mb-2">Payment Breakdown</h4>
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900">₹{order.subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery</span>
                <span className="font-semibold text-slate-900">
                  {order.shipping_fee === 0 ? <span className="text-emerald-600 font-bold">FREE</span> : `₹${order.shipping_fee}`}
                </span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-200 text-sm">
                <span>Total Paid</span>
                <span className="text-indigo-600 font-black">₹{order.total_amount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
        <Link
          to="/orders"
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md shadow-indigo-500/20"
        >
          <Package className="w-4 h-4" /> View Order History
        </Link>
        <Link
          to="/products"
          className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-2"
        >
          <Home className="w-4 h-4" /> Continue Shopping
        </Link>
      </div>
    </div>
  );
};
