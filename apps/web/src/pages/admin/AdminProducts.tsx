import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { ProductDTO, CategoryDTO, ProductStatus } from '@commerceflow/shared';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  Check,
  X,
  Eye,
  Filter,
  Image,
  Sparkles,
  Zap,
} from 'lucide-react';

const DEFAULT_CATEGORIES: CategoryDTO[] = [
  { id: 1, name: 'Audio & Headphones', slug: 'audio-headphones', description: '', created_at: '' },
  { id: 2, name: 'Laptops & Computers', slug: 'laptops-computers', description: '', created_at: '' },
  { id: 3, name: 'Mobile & Smartphones', slug: 'mobile-smartphones', description: '', created_at: '' },
  { id: 4, name: 'Powerbanks & Charging', slug: 'powerbanks-charging', description: '', created_at: '' },
  { id: 5, name: 'Smart Wearables', slug: 'smart-wearables', description: '', created_at: '' },
  { id: 6, name: 'Gaming Gear', slug: 'gaming-gear', description: '', created_at: '' },
];

export const AdminProducts: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [categories, setCategories] = useState<CategoryDTO[]>(DEFAULT_CATEGORIES);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductDTO | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock_quantity: '25',
    sku: 'CF-MOB-101',
    category_id: '3',
    status: 'ACTIVE' as ProductStatus,
    image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80',
  });

  const sampleImagePresets = [
    {
      name: '📱 Smartphone',
      url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80',
      catId: '3',
    },
    {
      name: '🎧 Headphones',
      url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
      catId: '1',
    },
    {
      name: '💻 Laptop',
      url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
      catId: '2',
    },
    {
      name: '🔋 Powerbank',
      url: 'https://images.unsplash.com/photo-1609592424364-6dfd1a1bca26?w=800&q=80',
      catId: '4',
    },
    {
      name: '⌚ Smartwatch',
      url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
      catId: '5',
    },
    {
      name: '⌨️ Mechanical Keyboard',
      url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80',
      catId: '6',
    },
  ];

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [prodRes, catRes] = await Promise.all([
        api.get(
          `/products?status=ALL&limit=100${search ? `&q=${encodeURIComponent(search)}` : ''}${
            selectedCat ? `&categoryId=${selectedCat}` : ''
          }`
        ),
        api.get('/categories'),
      ]);
      if (prodRes.data?.products) setProducts(prodRes.data.products);
      if (catRes.data?.categories && catRes.data.categories.length > 0) {
        setCategories(catRes.data.categories);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to load products.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, selectedCat]);

  // Check if URL has ?action=new to open modal automatically
  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      handleOpenAddModal();
      searchParams.delete('action');
      setSearchParams(searchParams);
    }
  }, [searchParams]);

  const generateRandomSKU = (catName?: string) => {
    const prefix = catName ? catName.slice(0, 3).toUpperCase() : 'CF';
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${rand}`;
  };

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    const activeCats = categories.length > 0 ? categories : DEFAULT_CATEGORIES;
    setFormData({
      name: '',
      description: '',
      price: '',
      stock_quantity: '25',
      sku: generateRandomSKU(activeCats[0]?.name),
      category_id: activeCats[0]?.id?.toString() || '1',
      status: 'ACTIVE',
      image_url: sampleImagePresets[0].url,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: ProductDTO) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      description: p.description,
      price: p.price.toString(),
      stock_quantity: p.stock_quantity.toString(),
      sku: p.sku,
      category_id: p.category_id.toString(),
      status: p.status,
      image_url: p.images?.[0]?.image_url || '',
    });
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const activeCats = categories.length > 0 ? categories : DEFAULT_CATEGORIES;
      const parsedCatId = parseInt(formData.category_id || activeCats[0]?.id?.toString() || '1', 10) || 1;

      const payload: any = {
        name: formData.name.trim(),
        description: formData.description.trim() || formData.name.trim(),
        price: parseFloat(formData.price) || 999,
        stock_quantity: parseInt(formData.stock_quantity, 10) || 10,
        sku: formData.sku.trim() || generateRandomSKU(),
        category_id: parsedCatId,
        status: formData.status,
        images: formData.image_url ? [{ image_url: formData.image_url.trim(), is_primary: true }] : [],
      };

      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, payload);
        setMessage({
          type: 'success',
          text: `Product '${formData.name}' successfully updated.`,
        });
      } else {
        await api.post('/products', payload);
        setMessage({
          type: 'success',
          text: `Product '${formData.name}' successfully added to store catalog.`,
        });
      }

      setIsModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save product.' });
    }
  };

  const handleDeleteProduct = async (id: number, name: string) => {
    if (!window.confirm(`Deactivate product '${name}'? This will soft-delete the item.`)) return;

    try {
      await api.delete(`/products/${id}`);
      setMessage({ type: 'success', text: `Product '${name}' deactivated.` });
      await fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to deactivate product.' });
    }
  };

  const activeCategories = categories.length > 0 ? categories : DEFAULT_CATEGORIES;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Product Catalog</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage, edit, stock, and add new tech items to your storefront
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-2xl transition flex items-center gap-2 shadow-lg shadow-purple-600/20 self-start sm:self-auto hover:scale-102 active:scale-98"
        >
          <Plus className="w-4 h-4" /> Add New Product
        </button>
      </div>

      {/* Message Notification */}
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

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <input
            type="text"
            placeholder="Search products by title or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="w-full sm:w-auto p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none font-medium"
          >
            <option value="">All Categories ({activeCategories.length})</option>
            {activeCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-6">Product</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Price</th>
                <th className="py-3.5 px-4">Stock</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    Loading products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    No products found matching filters.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const img = p.images?.[0]?.image_url;
                  const isLow = p.stock_quantity <= 5 && p.stock_quantity > 0;
                  const isOut = p.stock_quantity === 0 || p.status === 'OUT_OF_STOCK';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                            <img
                              src={
                                img ||
                                'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80'
                              }
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 line-clamp-1">{p.name}</p>
                            <span className="text-[10px] font-mono text-slate-400">{p.sku}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {p.category?.name || 'General'}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        ₹{p.price.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`font-mono font-bold ${
                            isOut
                              ? 'text-rose-600'
                              : isLow
                              ? 'text-amber-600'
                              : 'text-slate-800'
                          }`}
                        >
                          {p.stock_quantity}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {p.status === 'ACTIVE' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                            Active
                          </span>
                        )}
                        {p.status === 'OUT_OF_STOCK' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700">
                            Out of Stock
                          </span>
                        )}
                        {p.status === 'INACTIVE' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                            Inactive
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-6 text-right space-x-1.5">
                        <button
                          onClick={() => handleOpenEditModal(p)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id, p.name)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition"
                          title="Deactivate / Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-purple-600 font-bold">
                  Store Catalog
                </span>
                <h2 className="font-bold text-slate-900 text-base">
                  {editingProduct ? `Edit: ${editingProduct.name}` : 'Add New Product to Store'}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Ultra ANC Wireless Headphones"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Category *</label>
                  <select
                    required
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none font-medium"
                  >
                    {activeCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-700">SKU Code *</label>
                    <button
                      type="button"
                      onClick={() => {
                        const selCat = activeCategories.find((c) => c.id === Number(formData.category_id));
                        setFormData({ ...formData, sku: generateRandomSKU(selCat?.name) });
                      }}
                      className="text-[10px] text-purple-600 hover:underline flex items-center gap-0.5"
                    >
                      <Zap className="w-3 h-3" /> Auto-Gen
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full p-2.5 font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="2999"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full p-2.5 font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Initial Stock *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="25"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                    className="w-full p-2.5 font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Store Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as ProductStatus })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="ACTIVE">Active (Live in Store)</option>
                    <option value="OUT_OF_STOCK">Out of Stock</option>
                    <option value="INACTIVE">Inactive (Hidden)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Product Description *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Detailed product features, specifications, and warranty info..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="font-semibold text-slate-700">Primary Product Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400 font-semibold mr-1">
                    Quick Presets:
                  </span>
                  {sampleImagePresets.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          image_url: preset.url,
                          category_id: preset.catId,
                        })
                      }
                      className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-purple-100 hover:text-purple-700 text-slate-600 text-[10px] font-medium transition"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition flex items-center gap-1.5 shadow-md shadow-purple-600/20"
                >
                  <Check className="w-4 h-4" />
                  {editingProduct ? 'Save Changes' : 'Publish Product to Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
