import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Package,
  Layers,
  Boxes,
  ShoppingBag,
  Users,
  ShieldCheck,
  ArrowLeft,
  LogOut,
  AlertTriangle,
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { user, role, demoLogin, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // RBAC Guard: If user is not ADMIN, show access denied barrier with 1-click admin login
  if (!isAuthenticated || role !== 'ADMIN') {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto shadow-md">
          <ShieldCheck className="w-9 h-9" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900">Admin Privileges Required</h2>
          <p className="text-xs text-slate-500">
            This section is protected by Role-Based Access Control (RBAC). Only users with the <span className="font-mono font-bold text-purple-700">ADMIN</span> role can access the management panel.
          </p>
        </div>

        <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl space-y-3">
          <p className="text-xs font-semibold text-purple-900">
            Switch to Admin mode to explore the full dashboard:
          </p>
          <button
            onClick={() => demoLogin('ADMIN')}
            className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" /> 1-Click Fast Login as Admin
          </button>
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Return to Storefront
        </Link>
      </div>
    );
  }

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Orders (State Machine)', path: '/admin/orders', icon: ShoppingBag },
    { label: 'Products', path: '/admin/products', icon: Package },
    { label: 'Categories', path: '/admin/categories', icon: Layers },
    { label: 'Inventory & Logs', path: '/admin/inventory', icon: Boxes },
    { label: 'Customers', path: '/admin/customers', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 p-4 sm:p-6 flex flex-col justify-between shrink-0 shadow-xl border-r border-slate-800">
        <div className="space-y-6">
          {/* Admin Header */}
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-extrabold text-white tracking-tight">Admin Panel</span>
              <span className="block text-[10px] text-purple-400 font-semibold uppercase tracking-wider">
                CommerceFlow
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === '/admin'
                  ? location.pathname === '/admin'
                  : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer info in sidebar */}
        <div className="pt-6 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="truncate">
              <p className="font-bold text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-500 font-mono">Role: ADMIN</p>
            </div>
          </div>

          <div className="space-y-1">
            <Link
              to="/"
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Store
            </Link>

            <button
              onClick={() => logout()}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-rose-400 hover:bg-rose-950/40 text-xs font-medium transition"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto max-w-7xl">
        <Outlet />
      </main>
    </div>
  );
};
