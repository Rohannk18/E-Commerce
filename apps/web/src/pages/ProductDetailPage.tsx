import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { ProductDTO } from '@commerceflow/shared';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ProductCard } from '../components/products/ProductCard';
import {
  ShoppingCart,
  Zap,
  ShieldCheck,
  Truck,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Minus,
  ArrowLeft,
  Edit2,
  UserCheck,
} from 'lucide-react';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated, role, demoLogin } = useAuth();

  const [product, setProduct] = useState<ProductDTO | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<ProductDTO[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const isAdmin = role === 'ADMIN';

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        setSelectedImageIndex(0);
        setQuantity(1);
        const res = await api.get(`/products/${id}`);
        if (res.data?.product) {
          setProduct(res.data.product);

          // Fetch related products in category
          if (res.data.product.category_id) {
            const relRes = await api.get(
              `/products?categoryId=${res.data.product.category_id}&limit=4`
            );
            if (relRes.data?.products) {
              setRelatedProducts(
                relRes.data.products.filter((p: ProductDTO) => p.id !== res.data.product.id)
              );
            }
          }
        }
      } catch (err: any) {
        setErrorToast(err.message || 'Product not found.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4 space-y-8 animate-pulse">
        <div className="h-6 w-32 bg-slate-200 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="aspect-square bg-slate-200 rounded-3xl" />
          <div className="space-y-4">
            <div className="h-8 w-3/4 bg-slate-200 rounded-xl" />
            <div className="h-6 w-1/3 bg-slate-200 rounded-lg" />
            <div className="h-24 bg-slate-200 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Product Not Found</h2>
        <p className="text-xs text-slate-500">
          The requested item may have been discontinued or removed.
        </p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Products
        </Link>
      </div>
    );
  }

  const isOutOfStock = product.stock_quantity === 0 || product.status === 'OUT_OF_STOCK';
  const isLowStock = !isOutOfStock && product.stock_quantity <= 5;
  const images =
    product.images && product.images.length > 0
      ? product.images
      : [
          {
            id: 0,
            product_id: product.id,
            image_url:
              'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
            is_primary: true,
            display_order: 0,
          },
        ];

  const handleAddToCart = async () => {
    if (isOutOfStock) return;
    if (!isAuthenticated) {
      setErrorToast('Please sign in or use Demo Fast-Login to add items to cart.');
      setTimeout(() => setErrorToast(null), 3000);
      return;
    }
    if (isAdmin) {
      setErrorToast('Administrators are not permitted to purchase items. Switch to Customer to test shopping.');
      setTimeout(() => setErrorToast(null), 4000);
      return;
    }

    try {
      setIsAdding(true);
      setErrorToast(null);
      await addToCart(product.id, quantity);
      setSuccessToast(`Added ${quantity} ${quantity > 1 ? 'items' : 'item'} to cart!`);
      setTimeout(() => setSuccessToast(null), 2500);
    } catch (err: any) {
      setErrorToast(err.message);
      setTimeout(() => setErrorToast(null), 4000);
    } finally {
      setIsAdding(false);
    }
  };

  const handleBuyNow = async () => {
    if (isOutOfStock) return;
    if (!isAuthenticated) {
      navigate('/auth?redirect=/checkout');
      return;
    }
    if (isAdmin) {
      setErrorToast('Administrators are not permitted to purchase items. Switch to Customer to test checkout.');
      setTimeout(() => setErrorToast(null), 4000);
      return;
    }

    try {
      await addToCart(product.id, quantity);
      navigate('/checkout');
    } catch (err: any) {
      setErrorToast(err.message);
    }
  };

  return (
    <div className="space-y-12 py-6">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Link to="/products" className="hover:text-indigo-600 flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Products
        </Link>
        <span>/</span>
        <span className="text-slate-400">{product.category?.name}</span>
        <span>/</span>
        <span className="text-slate-900 font-semibold truncate max-w-xs">{product.name}</span>
      </div>

      {/* Main Product Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-sm">
        {/* Left: Image Gallery */}
        <div className="space-y-4">
          {/* Main Selected Image */}
          <div className="aspect-square w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 relative group">
            <img
              src={images[selectedImageIndex]?.image_url}
              alt={product.name}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition duration-500"
            />
            {isOutOfStock && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center">
                <span className="px-4 py-2 bg-rose-600 text-white font-extrabold text-sm uppercase tracking-wider rounded-xl shadow-lg">
                  Out of Stock
                </span>
              </div>
            )}
          </div>

          {/* Thumbnails Row */}
          {images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 transition ${
                    selectedImageIndex === idx
                      ? 'border-indigo-600 shadow-md ring-2 ring-indigo-200'
                      : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img.image_url}
                    alt={`${product.name} thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Details & Controls */}
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              {product.category && (
                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full">
                  {product.category.name}
                </span>
              )}
              <span className="text-xs font-mono text-slate-400">SKU: {product.sku}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
              {product.name}
            </h1>
          </div>

          {/* Pricing */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-baseline justify-between">
            <div>
              <span className="text-xs text-slate-400 block">Total Price (incl. taxes)</span>
              <span className="text-3xl font-black text-slate-900">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Inventory Status Pill */}
            <div>
              {isOutOfStock ? (
                <span className="px-3 py-1 bg-rose-100 text-rose-700 text-xs font-bold rounded-full">
                  Out of Stock
                </span>
              ) : isLowStock ? (
                <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full flex items-center gap-1.5 animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Only {product.stock_quantity} left in stock!
                </span>
              ) : (
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  In Stock ({product.stock_quantity} available)
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Description & Features
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>

          {/* Admin Mode Notice Bar */}
          {isAdmin && (
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-purple-900 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                Admin Mode Active
              </div>
              <p className="text-[11px] text-purple-700">
                Administrators manage store inventory & delivery pipelines and cannot purchase products. To test customer checkout, switch to a Customer account:
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => demoLogin('CUSTOMER')}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition shadow-sm"
                >
                  <UserCheck className="w-3.5 h-3.5" /> Switch to Demo Customer
                </button>
                <Link
                  to="/admin/products"
                  className="px-3 py-1.5 bg-white border border-purple-200 hover:bg-purple-100 text-purple-800 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit in Admin Panel
                </Link>
              </div>
            </div>
          )}

          {/* Action Toasts */}
          {successToast && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              {successToast}
            </div>
          )}

          {errorToast && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              {errorToast}
            </div>
          )}

          {/* Quantity and Checkout Actions */}
          {!isOutOfStock ? (
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-slate-700">Quantity:</span>
                <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1 || isAdmin}
                    className="p-2 px-3 text-slate-600 hover:bg-slate-200 disabled:opacity-30 transition"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-4 text-xs font-bold text-slate-900">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stock_quantity, q + 1))}
                    disabled={quantity >= product.stock_quantity || isAdmin}
                    className="p-2 px-3 text-slate-600 hover:bg-slate-200 disabled:opacity-30 transition"
                    title={
                      quantity >= product.stock_quantity
                        ? 'Max stock reached'
                        : 'Add more'
                    }
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span className="text-xs text-slate-400">
                  Max: {product.stock_quantity} units
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={handleAddToCart}
                  disabled={isAdding || isAdmin}
                  className={`py-3.5 px-6 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
                    isAdmin
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                      : 'bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  {isAdmin ? 'Admin View Only' : isAdding ? 'Adding...' : 'Add to Cart'}
                </button>

                <button
                  onClick={handleBuyNow}
                  disabled={isAdmin}
                  className={`py-3.5 px-6 rounded-xl font-bold text-xs shadow-lg transition flex items-center justify-center gap-2 ${
                    isAdmin
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30 hover:scale-102 active:scale-98'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  {isAdmin ? 'Admin View Only' : 'Buy Now'}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-1">
              <h4 className="font-bold text-rose-800 text-sm">Product Out of Stock</h4>
              <p className="text-xs text-rose-600">
                This item is currently sold out. Check back soon or explore related tech gear below.
              </p>
            </div>
          )}

          {/* Trust Value Badges */}
          <div className="grid grid-cols-3 gap-3 pt-6 border-t border-slate-100 text-center text-slate-500">
            <div className="p-3 rounded-xl bg-slate-50 flex flex-col items-center">
              <Truck className="w-4 h-4 text-indigo-600 mb-1" />
              <span className="text-[11px] font-bold text-slate-800">Free Express</span>
              <span className="text-[10px]">On orders &gt; ₹999</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 flex flex-col items-center">
              <ShieldCheck className="w-4 h-4 text-emerald-600 mb-1" />
              <span className="text-[11px] font-bold text-slate-800">1 Year Warranty</span>
              <span className="text-[10px]">100% Genuine</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 flex flex-col items-center">
              <RotateCcw className="w-4 h-4 text-purple-600 mb-1" />
              <span className="text-[11px] font-bold text-slate-800">7 Days Return</span>
              <span className="text-[10px]">Hassle-free</span>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900">Similar Products You Might Like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
