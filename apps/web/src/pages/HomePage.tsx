import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { ProductDTO, CategoryDTO } from '@commerceflow/shared';
import { ProductCard } from '../components/products/ProductCard';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  TrendingUp,
  AlertTriangle,
  Cpu,
  Layers,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<ProductDTO[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<ProductDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          api.get('/categories'),
          api.get('/products?limit=8'),
        ]);

        if (catRes.data?.categories) setCategories(catRes.data.categories);
        if (prodRes.data?.products) {
          setFeaturedProducts(prodRes.data.products);
          // Find low stock products for urgency section
          const lowStock = prodRes.data.products.filter(
            (p: ProductDTO) => p.stock_quantity > 0 && p.stock_quantity <= 5
          );
          setLowStockProducts(lowStock);
        }
      } catch (err) {
        console.error('Failed to load home page data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-16 py-6">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-2xl border border-indigo-900/30 p-8 sm:p-12 lg:p-16">
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Next-Gen E-Commerce Architecture
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Engineered for speed, stock integrity & seamless checkout.
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Experience realistic e-commerce with atomic database checkout transactions, inventory concurrency locking, role-based access control, and state machine order pipelines.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              to="/products"
              className="px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 hover:scale-105 transition flex items-center gap-2"
            >
              Explore Products <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/admin"
              className="px-6 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-sm transition flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-purple-400" /> Admin Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Shop by Category
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Find premium electronics and smart gadgets tailored for your setup.
            </p>
          </div>
          <Link
            to="/products"
            className="text-xs sm:text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition"
          >
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/products?categoryId=${cat.id}`}
              className="group relative rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition flex flex-col p-4 text-center items-center"
            >
              <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mb-3 overflow-hidden border border-indigo-100 group-hover:scale-110 transition duration-300">
                <img
                  src={cat.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80'}
                  alt={cat.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="font-bold text-xs text-slate-800 group-hover:text-indigo-600 transition">
                {cat.name}
              </h3>
              {cat._count?.products !== undefined && (
                <span className="text-[11px] text-slate-400 mt-0.5">
                  {cat._count.products} items
                </span>
              )}
            </Link>
          ))}
        </div>
      </section>

      {/* Urgency Section: Low Stock Products */}
      {lowStockProducts.length > 0 && (
        <section className="bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-amber-500/10 border border-amber-200/80 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500 text-white rounded-xl shadow-sm">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                  Almost Gone – Low Stock Deals
                </h2>
                <p className="text-xs text-slate-600">
                  Real-time inventory countdown with 5 or fewer items remaining!
                </p>
              </div>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
              Live Stock
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {lowStockProducts.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                Trending Tech Gear
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Top curated items with multi-image showcases and instant stock checks.
            </p>
          </div>
          <Link
            to="/products"
            className="text-xs sm:text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition"
          >
            Explore Catalog <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-80 bg-slate-100 animate-pulse rounded-2xl border border-slate-200"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Engineering Showcase Architecture Card */}
      <section className="rounded-3xl bg-slate-900 text-white p-8 sm:p-12 border border-slate-800 space-y-6 shadow-xl">
        <div className="max-w-3xl space-y-2">
          <span className="text-indigo-400 text-xs font-mono uppercase tracking-widest">
            Portfolio Differentiators
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            How CommerceFlow handles high-concurrency e-commerce
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
            Rather than a superficial clone, CommerceFlow provides true relational transaction guarantees:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
              <Zap className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-white">Atomic Checkout</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Order creation, payment verification, and stock deduction are wrapped in a single database transaction.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-white">State Machine Orders</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Order status changes follow strict state transitions (PENDING $\rightarrow$ CONFIRMED $\rightarrow$ PROCESSING $\rightarrow$ SHIPPED $\rightarrow$ DELIVERED).
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs">
              <Cpu className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-white">Inventory Audit Logs</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every checkout, cancellation, and manual restock is audited with previous vs new stock and reasons.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
