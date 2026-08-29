import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { InventoryLogDTO, LOW_STOCK_THRESHOLD } from '@commerceflow/shared';
import {
  Boxes,
  AlertTriangle,
  History,
  Edit3,
  Search,
  CheckCircle2,
  X,
  ArrowUpDown,
} from 'lucide-react';

interface InventoryItem {
  id: number;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock_quantity: number;
  status: string;
  isLowStock: boolean;
  image: string | null;
  updated_at: string;
}

export const AdminInventory: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [logs, setLogs] = useState<InventoryLogDTO[]>([]);
  const [activeTab, setActiveTab] = useState<'inventory' | 'logs'>('inventory');
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Stock Adjustment Modal
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null);
  const [newStock, setNewStock] = useState<number>(0);
  const [reason, setReason] = useState('');

  const fetchInventory = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(
        `/admin/inventory?search=${encodeURIComponent(search)}${lowStockOnly ? '&lowStockOnly=true' : ''}`
      );
      if (res.data?.inventory) setInventory(res.data.inventory);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to fetch inventory.' });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await api.get('/admin/inventory/logs?limit=50');
      if (res.data?.logs) setLogs(res.data.logs);
    } catch (err: any) {
      console.error('Failed to fetch logs:', err);
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchLogs();
  }, [search, lowStockOnly]);

  const handleOpenAdjustModal = (item: InventoryItem) => {
    setSelectedProduct(item);
    setNewStock(item.stock_quantity);
    setReason('Supplier restock batch');
    setAdjustModalOpen(true);
  };

  const handleSaveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      await api.put(`/admin/inventory/${selectedProduct.id}`, {
        new_stock: newStock,
        reason,
      });

      setMessage({
        type: 'success',
        text: `Stock for '${selectedProduct.name}' updated to ${newStock} units. Audit log recorded.`,
      });

      setAdjustModalOpen(false);
      await fetchInventory();
      await fetchLogs();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update stock.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Inventory & Concurrency Monitor
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time stock level monitoring with strict audit logging & low-stock warnings
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-100 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'inventory'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Boxes className="w-4 h-4" /> Live Stock
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'logs'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4" /> Audit Logs ({logs.length})
          </button>
        </div>
      </div>

      {/* Message */}
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

      {/* TAB 1: Live Stock Monitor */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:max-w-xs">
              <input
                type="text"
                placeholder="Search inventory by product or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
              <input
                type="checkbox"
                checked={lowStockOnly}
                onChange={(e) => setLowStockOnly(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500"
              />
              <span className="text-amber-800">Show Low Stock Only (&le; {LOW_STOCK_THRESHOLD} units)</span>
            </label>
          </div>

          {/* Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-6">Product & SKU</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Unit Price</th>
                    <th className="py-3.5 px-4">Current Stock</th>
                    <th className="py-3.5 px-4">Stock Status</th>
                    <th className="py-3.5 px-6 text-right">Adjust Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inventory.map((item) => {
                    const isOut = item.stock_quantity === 0 || item.status === 'OUT_OF_STOCK';
                    const isLow = item.stock_quantity <= LOW_STOCK_THRESHOLD && !isOut;

                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-50/80 transition ${
                          isLow ? 'bg-amber-50/30' : isOut ? 'bg-rose-50/30' : ''
                        }`}
                      >
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                              <img
                                src={item.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80'}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{item.name}</p>
                              <span className="text-[10px] font-mono text-slate-400">
                                {item.sku}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-600">{item.category}</td>

                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          ₹{item.price.toLocaleString('en-IN')}
                        </td>

                        <td className="py-3.5 px-4 font-mono font-black text-sm text-slate-900">
                          {item.stock_quantity}
                        </td>

                        <td className="py-3.5 px-4">
                          {isOut ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                              Out of Stock
                            </span>
                          ) : isLow ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300 animate-pulse">
                              <AlertTriangle className="w-3 h-3" /> LOW STOCK
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                              Healthy Stock
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-6 text-right">
                          <button
                            onClick={() => handleOpenAdjustModal(item)}
                            className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-xl text-xs transition inline-flex items-center gap-1.5"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> Adjust
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Audit Logs */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Immutable Inventory Audit Trail</h2>
              <p className="text-xs text-slate-500">
                Detailed record of stock adjustments, checkout reductions, and order returns
              </p>
            </div>
            <span className="text-xs font-mono font-bold bg-slate-100 px-3 py-1 rounded-xl text-slate-600">
              Total Logs: {logs.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Stock Change</th>
                  <th className="py-3 px-4">Previous &rarr; New</th>
                  <th className="py-3 px-6">Reason / Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {logs.map((log) => {
                  const isPositive = log.change_amount > 0;
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition text-xs">
                      <td className="py-3 px-4 text-slate-400 font-sans">
                        {new Date(log.created_at).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 font-sans font-bold text-slate-900">
                        {log.product?.name || `Product #${log.product_id}`}
                        <span className="text-[10px] text-slate-400 font-mono block">
                          {log.product?.sku}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold">
                        <span
                          className={`px-2 py-0.5 rounded-md ${
                            isPositive
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {isPositive ? `+${log.change_amount}` : log.change_amount}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {log.previous_stock} &rarr; {log.new_stock}
                      </td>
                      <td className="py-3 px-6 font-sans text-slate-700 font-medium">
                        {log.reason}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {adjustModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="font-bold text-slate-900 text-sm">Adjust Inventory Stock</h2>
                <p className="text-[11px] text-slate-400">{selectedProduct.name}</p>
              </div>
              <button
                onClick={() => setAdjustModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStock} className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                <span className="text-slate-500 font-medium">Current Stock on Hand:</span>
                <span className="font-mono font-bold text-sm text-slate-900">
                  {selectedProduct.stock_quantity} units
                </span>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">New Stock Quantity *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={newStock}
                  onChange={(e) => setNewStock(parseInt(e.target.value, 10) || 0)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">
                  Audit Reason (Required for compliance) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Received shipment container #B88, Physical recount"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md"
                >
                  Confirm & Audit Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
