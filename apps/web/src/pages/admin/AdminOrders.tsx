import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import {
  OrderDTO,
  OrderStatus,
  ORDER_STATUS_TRANSITIONS,
  getNextAllowedStatuses,
} from '@commerceflow/shared';
import { OrderStatusBadge, PaymentStatusBadge } from '../../components/orders/OrderStatusBadge';
import { OrderTimeline } from '../../components/orders/OrderTimeline';
import {
  Search,
  Eye,
  RefreshCw,
  X,
  MapPin,
  CreditCard,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  PackageCheck,
  Truck,
  Package,
  User,
  Phone,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';

export const AdminOrders: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [allOrdersCache, setAllOrdersCache] = useState<OrderDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);

  const search = searchParams.get('search') || '';
  const statusFilter = searchParams.get('status') || 'ALL';

  // Details / Transition Modal State
  const [selectedOrder, setSelectedOrder] = useState<OrderDTO | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const [filteredRes, allRes] = await Promise.all([
        api.get(
          `/admin/orders?limit=100${search ? `&search=${encodeURIComponent(search)}` : ''}${
            statusFilter && statusFilter !== 'ALL' ? `&status=${statusFilter}` : ''
          }`
        ),
        api.get('/admin/orders?limit=100'),
      ]);

      if (filteredRes.data?.orders) {
        setOrders(filteredRes.data.orders);
        if (selectedOrder) {
          const fresh = filteredRes.data.orders.find((o: OrderDTO) => o.id === selectedOrder.id);
          if (fresh) setSelectedOrder(fresh);
        }
      }

      if (allRes.data?.orders) {
        setAllOrdersCache(allRes.data.orders);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to load customer orders.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [search, statusFilter]);

  const handleUpdateStatus = async (orderId: number, nextStatus: OrderStatus) => {
    try {
      setUpdatingOrderId(orderId);
      const res = await api.put(`/admin/orders/${orderId}/status`, { status: nextStatus });
      setMessage({
        type: 'success',
        text: res.data.message || `Order successfully updated to ${nextStatus}`,
      });
      await fetchOrders();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update order status.' });
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleOpenDetails = (order: OrderDTO) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const statusTabs: { id: string; label: string }[] = [
    { id: 'ALL', label: 'All Orders' },
    { id: 'PENDING', label: 'Pending Review' },
    { id: 'CONFIRMED', label: 'Confirmed' },
    { id: 'PROCESSING', label: 'In Processing' },
    { id: 'SHIPPED', label: 'Shipped / In Transit' },
    { id: 'DELIVERED', label: 'Delivered' },
    { id: 'CANCELLED', label: 'Cancelled' },
  ];

  // Helper for quick delivery button label & icon
  const getPrimaryActionConfig = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return {
          nextStatus: 'CONFIRMED' as OrderStatus,
          label: 'Approve & Confirm',
          icon: CheckCircle2,
          btnClass: 'bg-blue-600 hover:bg-blue-700 text-white',
          desc: 'Accept customer order into processing queue',
        };
      case 'CONFIRMED':
        return {
          nextStatus: 'PROCESSING' as OrderStatus,
          label: 'Pack & Process',
          icon: PackageCheck,
          btnClass: 'bg-indigo-600 hover:bg-indigo-700 text-white',
          desc: 'Package items in warehouse for dispatch',
        };
      case 'PROCESSING':
        return {
          nextStatus: 'SHIPPED' as OrderStatus,
          label: 'Dispatch & Ship',
          icon: Truck,
          btnClass: 'bg-purple-600 hover:bg-purple-700 text-white',
          desc: 'Handover parcel to courier partner',
        };
      case 'SHIPPED':
        return {
          nextStatus: 'DELIVERED' as OrderStatus,
          label: 'Mark as Delivered',
          icon: Package,
          btnClass: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20',
          desc: 'Confirm customer received their package',
        };
      default:
        return null;
    }
  };

  const getStatusCount = (statusId: string) => {
    if (statusId === 'ALL') return allOrdersCache.length;
    return allOrdersCache.filter((o) => o.order_status === statusId).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Customer Orders & Fulfillment Manager
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            View customer purchases, manage shipments, and process orders through the delivery lifecycle
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Orders
        </button>
      </div>

      {/* Message Banner */}
      {message && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between animate-fade-in ${
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

      {/* Search & Status Filter Tabs */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        {/* Search */}
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Search by Order #, Customer Name, Email, or City..."
            value={search}
            onChange={(e) => {
              const newParams = new URLSearchParams(searchParams);
              if (e.target.value) newParams.set('search', e.target.value);
              else newParams.delete('search');
              setSearchParams(newParams);
            }}
            className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        </div>

        {/* Status Filter Tabs with Counts */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {statusTabs.map((tab) => {
            const isSelected = statusFilter === tab.id;
            const count = getStatusCount(tab.id);

            return (
              <button
                key={tab.id}
                onClick={() => {
                  const newParams = new URLSearchParams(searchParams);
                  if (tab.id === 'ALL') newParams.delete('status');
                  else newParams.set('status', tab.id);
                  setSearchParams(newParams);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2 ${
                  isSelected
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                    isSelected ? 'bg-purple-800 text-purple-100' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-6">Order Details</th>
                <th className="py-3.5 px-4">Customer & Shipping Address</th>
                <th className="py-3.5 px-4">Items Ordered</th>
                <th className="py-3.5 px-4">Total Amount</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-4">Fulfillment Status</th>
                <th className="py-3.5 px-6 text-right">Process Order Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-400">
                    <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading customer orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-400">
                    No orders found matching the selected filter.
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const currentStatus = order.order_status as OrderStatus;
                  const primaryAction = getPrimaryActionConfig(currentStatus);
                  const isUpdating = updatingOrderId === order.id;

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition">
                      {/* Order Number & Timestamp */}
                      <td className="py-4 px-6">
                        <span className="font-mono font-black text-slate-900 text-xs block">
                          #{order.order_number}
                        </span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          {new Date(order.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </td>

                      {/* Customer Info */}
                      <td className="py-4 px-4">
                        <p className="font-bold text-slate-900 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-purple-600" />
                          {order.shipping_name}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {order.shipping_phone}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate max-w-[200px]">
                          {order.shipping_address}, {order.shipping_city}, {order.shipping_state} - {order.shipping_postal}
                        </p>
                      </td>

                      {/* Items Preview */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5">
                          {order.items.slice(0, 3).map((item, idx) => (
                            <div
                              key={idx}
                              className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0"
                              title={`${item.quantity}x ${item.product_name}`}
                            >
                              <img
                                src={
                                  item.product_image ||
                                  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&q=80'
                                }
                                alt={item.product_name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                          {order.items.length > 3 && (
                            <span className="text-[10px] font-bold text-slate-500 px-1 bg-slate-100 rounded">
                              +{order.items.length - 3}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-600 font-semibold mt-1 block">
                          {order.items.reduce((sum, i) => sum + i.quantity, 0)} items total
                        </span>
                      </td>

                      {/* Total Amount */}
                      <td className="py-4 px-4 font-black text-slate-900 text-sm">
                        ₹{order.total_amount.toLocaleString('en-IN')}
                      </td>

                      {/* Payment Status */}
                      <td className="py-4 px-4">
                        <PaymentStatusBadge status={order.payment_status} />
                        <span className="text-[10px] text-slate-400 font-mono block mt-1">
                          {order.payments?.[0]?.payment_method || 'CREDIT_CARD'}
                        </span>
                      </td>

                      {/* Fulfillment Status */}
                      <td className="py-4 px-4">
                        <OrderStatusBadge status={order.order_status} size="sm" />
                      </td>

                      {/* Process Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* 1-Click Order Processing Button */}
                          {primaryAction && (
                            <button
                              onClick={() =>
                                handleUpdateStatus(order.id, primaryAction.nextStatus)
                              }
                              disabled={isUpdating}
                              className={`px-3.5 py-1.5 rounded-xl font-bold text-[11px] shadow-sm transition flex items-center gap-1.5 ${primaryAction.btnClass} hover:scale-102 active:scale-98`}
                              title={primaryAction.desc}
                            >
                              <primaryAction.icon className="w-3.5 h-3.5" />
                              {isUpdating ? 'Updating...' : primaryAction.label}
                            </button>
                          )}

                          {currentStatus === 'PENDING' && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'CANCELLED')}
                              disabled={isUpdating}
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-xl text-[11px] border border-rose-200 transition"
                              title="Reject / Cancel Order & Restore Stock"
                            >
                              Reject
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenDetails(order)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-[11px] transition flex items-center gap-1"
                            title="View Full Customer Receipt & All Transition Actions"
                          >
                            <Eye className="w-3.5 h-3.5" /> View
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details & Full State Transition Drawer/Modal */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-purple-600 font-bold">
                  Customer Order Review & Processing
                </span>
                <h2 className="font-mono font-black text-slate-900 text-lg">
                  #{selectedOrder.order_number}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper */}
            <OrderTimeline currentStatus={selectedOrder.order_status} />

            {/* State Machine Transition Actions Card */}
            <div className="p-5 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-purple-900 text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  Admin Order Processing Actions
                </span>
                <OrderStatusBadge status={selectedOrder.order_status} size="sm" />
              </div>

              {selectedOrder.order_status === 'DELIVERED' ||
              selectedOrder.order_status === 'CANCELLED' ? (
                <div className="p-3 bg-white rounded-xl border border-purple-100 text-slate-600 text-[11px]">
                  ✓ This order has reached the terminal state (
                  <span className="font-bold">{selectedOrder.order_status}</span>). No further state
                  transitions are permitted.
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-[11px] text-slate-600">
                    Click a step below to update customer fulfillment progress:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {getNextAllowedStatuses(selectedOrder.order_status as OrderStatus).map(
                      (nextState) => (
                        <button
                          key={nextState}
                          onClick={() => handleUpdateStatus(selectedOrder.id, nextState)}
                          disabled={updatingOrderId === selectedOrder.id}
                          className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition flex items-center gap-1.5 ${
                            nextState === 'CANCELLED'
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                              : nextState === 'DELIVERED'
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-purple-600 hover:bg-purple-700 text-white'
                          }`}
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                          Advance to: {nextState}
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Items Breakdown */}
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2">
                Order Items ({selectedOrder.items.length})
              </h3>
              <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                        <img
                          src={
                            item.product_image ||
                            'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80'
                          }
                          alt={item.product_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{item.product_name}</p>
                        <p className="text-[10px] text-slate-400">
                          SKU: {item.product_sku || 'N/A'} | Qty: {item.quantity} × ₹
                          {item.price.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                    <span className="font-black text-slate-900">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer & Shipping Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px] bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="space-y-1">
                <span className="font-bold text-slate-900 block">Customer & Shipping Details</span>
                <p className="font-semibold text-slate-800 flex items-center gap-1">
                  <User className="w-3 h-3 text-purple-600" />
                  {selectedOrder.shipping_name}
                </p>
                <p className="text-slate-500 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {selectedOrder.shipping_phone}
                </p>
                <p className="text-slate-500 flex items-start gap-1">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    {selectedOrder.shipping_address}, {selectedOrder.shipping_city},{' '}
                    {selectedOrder.shipping_state} - {selectedOrder.shipping_postal}
                  </span>
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-900 block">Payment & Totals</span>
                <p className="text-slate-600">
                  Method: <span className="font-semibold">{selectedOrder.payments?.[0]?.payment_method || 'CREDIT_CARD'}</span>
                </p>
                <p className="text-slate-500 font-mono text-[10px]">
                  Ref: {selectedOrder.payments?.[0]?.transaction_reference || 'N/A'}
                </p>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="font-bold text-slate-700">Total Charged:</span>
                  <span className="font-black text-purple-700 text-sm">
                    ₹{selectedOrder.total_amount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
