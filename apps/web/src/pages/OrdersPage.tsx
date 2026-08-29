import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { OrderDTO } from '@commerceflow/shared';
import { OrderStatusBadge, PaymentStatusBadge } from '../components/orders/OrderStatusBadge';
import { Package, Eye, XCircle, ArrowRight, ShoppingBag } from 'lucide-react';

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/orders');
      if (res.data?.orders) {
        setOrders(res.data.orders);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to load order history.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancelOrder = async (orderId: number) => {
    if (!window.confirm('Are you sure you want to cancel this order? Inventory will be restored.')) {
      return;
    }

    try {
      setCancellingId(orderId);
      const res = await api.put(`/orders/${orderId}/cancel`);
      setMessage({ type: 'success', text: res.data.message || 'Order cancelled successfully.' });
      await fetchOrders();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to cancel order.' });
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
      {/* Title */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Order History</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track, view receipts, and manage your recent purchases
          </p>
        </div>
        <Link
          to="/products"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 self-start sm:self-auto shadow-sm"
        >
          <ShoppingBag className="w-4 h-4" /> Shop More
        </Link>
      </div>

      {/* Alert Message */}
      {message && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="underline ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* Orders List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-40 bg-slate-100 animate-pulse rounded-3xl border border-slate-200"
            />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Orders Placed Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You haven’t ordered anything yet. Browse our top tech products to make your first purchase!
          </p>
          <Link
            to="/products"
            className="inline-block px-5 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md"
          >
            Explore Catalog
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const canCancel = ['PENDING', 'CONFIRMED'].includes(order.order_status);

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4 hover:border-slate-300 transition"
              >
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-900 text-xs sm:text-sm">
                      #{order.order_number}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <OrderStatusBadge status={order.order_status} size="sm" />
                    <PaymentStatusBadge status={order.payment_status} />
                  </div>
                </div>

                {/* Items & Preview */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 overflow-x-auto py-1">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 shrink-0"
                          title={`${item.product_name} (Qty: ${item.quantity})`}
                        >
                          <img
                            src={item.product_image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80'}
                            alt={item.product_name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-slate-600 font-medium">
                      {order.items.length} {order.items.length > 1 ? 'items' : 'item'}:{' '}
                      <span className="text-slate-500 font-normal truncate">
                        {order.items.map((i) => i.product_name).join(', ')}
                      </span>
                    </p>
                  </div>

                  {/* Total Amount & Action */}
                  <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 block sm:text-right">
                        Order Total
                      </span>
                      <span className="text-base font-extrabold text-slate-900">
                        ₹{order.total_amount.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {canCancel && (
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          disabled={cancellingId === order.id}
                          className="px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl font-medium transition"
                        >
                          {cancellingId === order.id ? 'Cancelling...' : 'Cancel Order'}
                        </button>
                      )}

                      <Link
                        to={`/orders/${order.id}`}
                        className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                      >
                        <Eye className="w-3.5 h-3.5" /> Details
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
