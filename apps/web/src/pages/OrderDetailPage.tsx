import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { OrderDTO } from '@commerceflow/shared';
import { OrderTimeline } from '../components/orders/OrderTimeline';
import { OrderStatusBadge, PaymentStatusBadge } from '../components/orders/OrderStatusBadge';
import { ArrowLeft, Package, CreditCard, MapPin, Truck } from 'lucide-react';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setIsLoading(true);
        const res = await api.get(`/orders/${id}`);
        if (res.data?.order) {
          setOrder(res.data.order);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch order details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-slate-200 rounded-lg" />
        <div className="h-48 bg-slate-200 rounded-3xl" />
        <div className="h-64 bg-slate-200 rounded-3xl" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Unable to Load Order</h2>
        <p className="text-xs text-slate-500">{error || 'Order not found.'}</p>
        <Link
          to="/orders"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      {/* Back button */}
      <div>
        <Link
          to="/orders"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Orders List
        </Link>
      </div>

      {/* Header Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
              Order Details
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
              #{order.order_number}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Placed on{' '}
              {new Date(order.created_at).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <OrderStatusBadge status={order.order_status} size="md" />
            <PaymentStatusBadge status={order.payment_status} />
          </div>
        </div>

        {/* State Machine Order Stepper */}
        <div className="py-2">
          <OrderTimeline currentStatus={order.order_status} />
        </div>
      </div>

      {/* Items List */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
          Ordered Items ({order.items.length})
        </h2>

        <div className="divide-y divide-slate-100">
          {order.items.map((item) => (
            <div key={item.id} className="py-4 flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                  <img
                    src={item.product_image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80'}
                    alt={item.product_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono text-slate-400">{item.product_sku}</span>
                  <h4 className="font-bold text-slate-900 text-sm">{item.product_name}</h4>
                  <p className="text-slate-500">
                    Qty: {item.quantity} × ₹{item.price.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              <span className="font-black text-sm text-slate-900">
                ₹{(item.price * item.quantity).toLocaleString('en-IN')}
              </span>
            </div>
          ))}
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 text-xs">
          <div className="space-y-1 text-slate-600 bg-slate-50 p-4 rounded-2xl">
            <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-indigo-600" /> Delivery Address
            </h4>
            <p className="font-semibold text-slate-800">{order.shipping_name}</p>
            <p>{order.shipping_phone}</p>
            <p>{order.shipping_address}</p>
            <p>{order.shipping_city}, {order.shipping_state} - {order.shipping_postal}</p>
          </div>

          <div className="space-y-2 text-slate-600 bg-slate-50 p-4 rounded-2xl">
            <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-indigo-600" /> Payment Summary
            </h4>
            <div className="flex justify-between">
              <span>Payment Method:</span>
              <span className="font-semibold text-slate-900">
                {order.payments?.[0]?.payment_method || 'CREDIT_CARD'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Transaction Ref:</span>
              <span className="font-mono text-slate-900 text-[11px]">
                {order.payments?.[0]?.transaction_reference || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-slate-900 text-sm">
              <span>Grand Total:</span>
              <span className="text-indigo-600 font-black">
                ₹{order.total_amount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
