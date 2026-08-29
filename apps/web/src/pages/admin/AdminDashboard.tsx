import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { DashboardMetricsDTO, OrderStatus } from '@commerceflow/shared';
import { OrderStatusBadge, PaymentStatusBadge } from '../../components/orders/OrderStatusBadge';
import {
  IndianRupee,
  ShoppingBag,
  Users,
  Package,
  Clock,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Boxes,
  Plus,
  Truck,
  CheckCircle2,
  PackageCheck,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetricsDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);

  const fetchMetrics = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/admin/dashboard');
      if (res.data?.metrics) {
        setMetrics(res.data.metrics);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard KPIs.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleQuickStatusAdvance = async (orderId: number, currentStatus: string) => {
    let nextStatus: OrderStatus | null = null;
    if (currentStatus === 'PENDING') nextStatus = 'CONFIRMED';
    else if (currentStatus === 'CONFIRMED') nextStatus = 'PROCESSING';
    else if (currentStatus === 'PROCESSING') nextStatus = 'SHIPPED';
    else if (currentStatus === 'SHIPPED') nextStatus = 'DELIVERED';

    if (!nextStatus) return;

    try {
      setUpdatingOrderId(orderId);
      await api.put(`/admin/orders/${orderId}/status`, { status: nextStatus });
      await fetchMetrics();
    } catch (err) {
      console.error('Failed to advance status:', err);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-32 bg-slate-200 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-200 rounded-3xl text-center text-rose-700 text-xs">
        {error || 'Unable to load dashboard data.'}
      </div>
    );
  }

  const kpis = [
    {
      label: 'Total Gross Revenue',
      value: `₹${metrics.totalRevenue.toLocaleString('en-IN')}`,
      icon: IndianRupee,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      iconBg: 'bg-emerald-600 text-white',
    },
    {
      label: 'Total Orders Placed',
      value: metrics.totalOrders.toString(),
      icon: ShoppingBag,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      iconBg: 'bg-blue-600 text-white',
    },
    {
      label: 'Orders Needing Delivery Action',
      value: metrics.pendingOrders.toString(),
      icon: Clock,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      iconBg: 'bg-amber-600 text-white',
      note: 'Pending Admin review/dispatch',
    },
    {
      label: 'Low Stock Products',
      value: metrics.lowStockProducts.toString(),
      icon: AlertTriangle,
      color: 'bg-orange-50 text-orange-700 border-orange-200',
      iconBg: 'bg-orange-600 text-white',
      note: 'Threshold <= 5 units',
    },
    {
      label: 'Catalog Items',
      value: metrics.totalProducts.toString(),
      icon: Package,
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      iconBg: 'bg-purple-600 text-white',
    },
    {
      label: 'Registered Customers',
      value: metrics.totalCustomers.toString(),
      icon: Users,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      iconBg: 'bg-indigo-600 text-white',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Executive Control Center
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time platform sales, inventory alerts, and customer delivery pipelines
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/admin/products?action=new"
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-lg shadow-purple-600/20 hover:scale-102 active:scale-98"
          >
            <Plus className="w-4 h-4" /> Add New Item
          </Link>

          <Link
            to="/admin/orders"
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-md shadow-indigo-600/20"
          >
            <Truck className="w-4 h-4" /> Delivery Hub
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className={`p-6 rounded-3xl border ${kpi.color} bg-white shadow-sm flex items-center justify-between transition hover:shadow-md`}
            >
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider">
                  {kpi.label}
                </span>
                <span className="text-2xl font-black text-slate-900 block">{kpi.value}</span>
                {kpi.note && (
                  <span className="text-[10px] font-medium text-slate-400 block">{kpi.note}</span>
                )}
              </div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${kpi.iconBg}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Action Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/admin/orders?status=PENDING"
          className="p-5 bg-gradient-to-r from-amber-500/10 to-amber-600/10 border border-amber-200 rounded-3xl hover:bg-amber-50 transition flex items-center justify-between"
        >
          <div>
            <span className="text-xs font-bold text-amber-900 block">Pending Customer Orders</span>
            <span className="text-xs text-amber-700 mt-0.5 block">
              {metrics.pendingOrders} orders awaiting admin confirmation
            </span>
          </div>
          <ArrowRight className="w-4 h-4 text-amber-600" />
        </Link>

        <Link
          to="/admin/products?action=new"
          className="p-5 bg-gradient-to-r from-purple-500/10 to-purple-600/10 border border-purple-200 rounded-3xl hover:bg-purple-50 transition flex items-center justify-between"
        >
          <div>
            <span className="text-xs font-bold text-purple-900 block">Add New Product</span>
            <span className="text-xs text-purple-700 mt-0.5 block">
              Expand your tech catalog with new items
            </span>
          </div>
          <Plus className="w-4 h-4 text-purple-600" />
        </Link>

        <Link
          to="/admin/inventory"
          className="p-5 bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-200 rounded-3xl hover:bg-orange-50 transition flex items-center justify-between"
        >
          <div>
            <span className="text-xs font-bold text-orange-900 block">Low Stock Alerts</span>
            <span className="text-xs text-orange-700 mt-0.5 block">
              {metrics.lowStockProducts} products with &le; 5 units
            </span>
          </div>
          <Boxes className="w-4 h-4 text-orange-600" />
        </Link>
      </div>

      {/* Category Revenue Breakdown & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Category Revenue */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900">Revenue by Category</h2>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>

          <div className="space-y-3">
            {metrics.categoryBreakdown.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No category sales yet.</p>
            ) : (
              metrics.categoryBreakdown.map((cat, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-700">{cat.category}</span>
                    <span className="font-bold text-slate-900">
                      ₹{cat.revenue.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-purple-600 h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${
                          metrics.totalRevenue > 0
                            ? Math.min(100, (cat.revenue / metrics.totalRevenue) * 100)
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Orders with Quick Delivery Actions */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Customer Orders</h2>
              <p className="text-[11px] text-slate-400">
                Update delivery progress directly from dashboard
              </p>
            </div>
            <Link
              to="/admin/orders"
              className="text-xs text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-1"
            >
              View All Orders <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Order #</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Quick Delivery Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {metrics.recentOrders.map((order) => {
                  const isUpdating = updatingOrderId === order.id;
                  let nextActionText = '';
                  let nextActionClass = '';

                  if (order.order_status === 'PENDING') {
                    nextActionText = 'Confirm';
                    nextActionClass = 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200';
                  } else if (order.order_status === 'CONFIRMED') {
                    nextActionText = 'Process';
                    nextActionClass = 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200';
                  } else if (order.order_status === 'PROCESSING') {
                    nextActionText = 'Ship';
                    nextActionClass = 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200';
                  } else if (order.order_status === 'SHIPPED') {
                    nextActionText = 'Deliver';
                    nextActionClass = 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200';
                  }

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3 font-bold text-slate-900">
                        #{order.order_number}
                      </td>
                      <td className="py-3 px-3 font-sans text-slate-700">
                        {order.shipping_name}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900">
                        ₹{order.total_amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 font-sans">
                        <OrderStatusBadge status={order.order_status} size="sm" />
                      </td>
                      <td className="py-3 px-3 text-right font-sans">
                        {nextActionText ? (
                          <button
                            onClick={() =>
                              handleQuickStatusAdvance(order.id, order.order_status)
                            }
                            disabled={isUpdating}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${nextActionClass}`}
                          >
                            {isUpdating ? '...' : `→ ${nextActionText}`}
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">Complete</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
