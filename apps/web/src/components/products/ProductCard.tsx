import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ProductDTO } from '@commerceflow/shared';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { ShoppingCart, Check, AlertTriangle, Eye, ShieldCheck } from 'lucide-react';

interface ProductCardProps {
  product: ProductDTO;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const { isAuthenticated, role } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const primaryImage =
    product.images?.find((img) => img.is_primary)?.image_url ||
    product.images?.[0]?.image_url ||
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80';

  const isOutOfStock = product.stock_quantity === 0 || product.status === 'OUT_OF_STOCK';
  const isLowStock = !isOutOfStock && product.stock_quantity <= 5;
  const isAdmin = role === 'ADMIN';

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isOutOfStock) return;

    if (!isAuthenticated) {
      setErrorToast('Please sign in or use Demo Fast-Login to add items to cart.');
      setTimeout(() => setErrorToast(null), 3000);
      return;
    }

    if (isAdmin) {
      setErrorToast('Admins cannot purchase for themselves. Use Demo Customer to test shopping.');
      setTimeout(() => setErrorToast(null), 4000);
      return;
    }

    try {
      setIsAdding(true);
      setErrorToast(null);
      await addToCart(product.id, 1);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1800);
    } catch (err: any) {
      setErrorToast(err.message);
      setTimeout(() => setErrorToast(null), 4000);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300 flex flex-col overflow-hidden">
      {/* Image Container with Badges */}
      <Link
        to={`/products/${product.id}`}
        className="relative aspect-square w-full bg-slate-100 overflow-hidden block"
      >
        <img
          src={primaryImage}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Category Pill */}
        {product.category && (
          <span className="absolute top-3 left-3 bg-white/90 backdrop-blur text-slate-800 text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
            {product.category.name}
          </span>
        )}

        {/* Stock Badge */}
        {isOutOfStock ? (
          <span className="absolute top-3 right-3 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-md">
            Out of Stock
          </span>
        ) : isLowStock ? (
          <span className="absolute top-3 right-3 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-md flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Only {product.stock_quantity} left
          </span>
        ) : (
          <span className="absolute top-3 right-3 bg-emerald-600/90 backdrop-blur text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
            In Stock
          </span>
        )}

        {/* Hover Quick View overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <span className="bg-white text-slate-900 text-xs font-semibold px-3 py-1.5 rounded-full shadow flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" /> View Details
          </span>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
            {product.sku}
          </span>
          <Link to={`/products/${product.id}`} className="block mt-0.5">
            <h3 className="text-sm font-bold text-slate-900 line-clamp-2 group-hover:text-indigo-600 transition-colors leading-snug">
              {product.name}
            </h3>
          </Link>
          <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Price & Action */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            <span className="text-xs text-slate-400 block -mb-1">Price</span>
            <span className="text-lg font-black text-slate-900">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock || isAdding}
            className={`p-2.5 rounded-xl font-medium text-xs flex items-center gap-1.5 transition-all ${
              isOutOfStock
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : isAdmin
                ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                : justAdded
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 hover:scale-105 active:scale-95'
            }`}
            aria-label="Add to cart"
            title={
              isOutOfStock
                ? 'Out of stock'
                : isAdmin
                ? 'Admins cannot place orders'
                : 'Add to cart'
            }
          >
            {isAdmin ? (
              <>
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span className="hidden sm:inline">Admin View</span>
              </>
            ) : justAdded ? (
              <>
                <Check className="w-4 h-4" />
                <span className="hidden sm:inline">Added</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                <span className="hidden sm:inline">Add</span>
              </>
            )}
          </button>
        </div>

        {/* Inline Error alert if triggered */}
        {errorToast && (
          <p className="text-[11px] text-red-600 font-medium bg-red-50 p-1.5 rounded-lg text-center animate-fade-in">
            {errorToast}
          </p>
        )}
      </div>
    </div>
  );
};
