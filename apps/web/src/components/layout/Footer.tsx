import React from 'react';
import { ShoppingBag, ShieldCheck, Zap, RefreshCw, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-sm border-t border-slate-800 mt-20">
      {/* Features Bar */}
      <div className="border-b border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">Atomic Transactions</h4>
              <p className="text-xs text-slate-400">Zero overselling with DB inventory concurrency.</p>
            </div>
          </div>

          <div className="flex items-center justify-center md:justify-start gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">Simulated Sandbox Payments</h4>
              <p className="text-xs text-slate-400">Test Credit Card, UPI & Cash on Delivery workflows.</p>
            </div>
          </div>

          <div className="flex items-center justify-center md:justify-start gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">State Machine Orders</h4>
              <p className="text-xs text-slate-400">Strict order lifecycle transitions & inventory logs.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">CommerceFlow</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            A production-ready full-stack e-commerce platform demonstrating atomic checkout transactions, RBAC, inventory concurrency, and state-machine order workflows.
          </p>
        </div>

        <div>
          <h5 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">Shop Categories</h5>
          <ul className="space-y-2 text-xs">
            <li><Link to="/products?categoryId=1" className="hover:text-white transition">Audio & Headphones</Link></li>
            <li><Link to="/products?categoryId=2" className="hover:text-white transition">Laptops & Computers</Link></li>
            <li><Link to="/products?categoryId=3" className="hover:text-white transition">Smart Wearables</Link></li>
            <li><Link to="/products?categoryId=5" className="hover:text-white transition">Gaming Gear</Link></li>
          </ul>
        </div>

        <div>
          <h5 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">Architecture & Stack</h5>
          <ul className="space-y-2 text-xs">
            <li>React 18 + Vite + TypeScript</li>
            <li>Node.js + Express.js REST API</li>
            <li>Prisma ORM & PostgreSQL / SQLite</li>
            <li>Tailwind CSS + Lucide Icons</li>
          </ul>
        </div>

        <div>
          <h5 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">Quick Navigation</h5>
          <ul className="space-y-2 text-xs">
            <li><Link to="/products" className="hover:text-white transition">Browse Products</Link></li>
            <li><Link to="/orders" className="hover:text-white transition">Customer Orders</Link></li>
            <li><Link to="/admin" className="text-purple-400 hover:text-purple-300 transition font-medium">Admin Control Panel</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800 py-6 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto px-4">
        <p>© {new Date().getFullYear()} CommerceFlow. Built for Full-Stack Portfolio Showcase.</p>
        <p className="flex items-center gap-1 mt-2 sm:mt-0">
          Crafted with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> for clean engineering.
        </p>
      </div>
    </footer>
  );
};
