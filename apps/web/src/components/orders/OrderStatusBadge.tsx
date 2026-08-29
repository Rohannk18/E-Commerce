import React from 'react';
import { OrderStatus, PaymentStatus } from '@commerceflow/shared';
import {
  Clock,
  CheckCircle2,
  PackageCheck,
  Truck,
  Check,
  XCircle,
  AlertTriangle,
} from 'lucide-react';

interface OrderStatusBadgeProps {
  status: OrderStatus | string;
  size?: 'sm' | 'md' | 'lg';
}

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({
  status,
  size = 'md',
}) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'PENDING':
        return {
          label: 'Pending',
          icon: Clock,
          classes: 'bg-amber-50 text-amber-700 border-amber-200',
        };
      case 'CONFIRMED':
        return {
          label: 'Confirmed',
          icon: CheckCircle2,
          classes: 'bg-blue-50 text-blue-700 border-blue-200',
        };
      case 'PROCESSING':
        return {
          label: 'Processing',
          icon: PackageCheck,
          classes: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        };
      case 'SHIPPED':
        return {
          label: 'Shipped',
          icon: Truck,
          classes: 'bg-purple-50 text-purple-700 border-purple-200',
        };
      case 'DELIVERED':
        return {
          label: 'Delivered',
          icon: Check,
          classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      case 'CANCELLED':
        return {
          label: 'Cancelled',
          icon: XCircle,
          classes: 'bg-rose-50 text-rose-700 border-rose-200',
        };
      default:
        return {
          label: status,
          icon: AlertTriangle,
          classes: 'bg-slate-100 text-slate-700 border-slate-200',
        };
    }
  };

  const config = getBadgeConfig();
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2 font-bold',
  }[size];

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border ${config.classes} ${sizeClasses}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
};

export const PaymentStatusBadge: React.FC<{ status: PaymentStatus | string }> = ({
  status,
}) => {
  const isPaid = status === 'PAID';
  const isFailed = status === 'FAILED';

  return (
    <span
      className={`inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${
        isPaid
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : isFailed
          ? 'bg-red-50 text-red-700 border-red-200'
          : 'bg-amber-50 text-amber-700 border-amber-200'
      }`}
    >
      {status}
    </span>
  );
};
