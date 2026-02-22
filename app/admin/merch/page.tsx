'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MerchItem, MerchSettings, MerchOrder } from '@/types';

export default function AdminMerchPage() {
  const [items, setItems] = useState<MerchItem[]>([]);
  const [settings, setSettings] = useState<MerchSettings | null>(null);
  const [orders, setOrders] = useState<MerchOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Shipping cost edit
  const [editShipping, setEditShipping] = useState('');
  const [savingShipping, setSavingShipping] = useState(false);

  // New item form
  const [showNewItem, setShowNewItem] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '', description: '', price: '', stock: '', needs_size: false, sizes: '', display_order: '0',
  });
  const [savingItem, setSavingItem] = useState(false);

  // Active tab
  const [activeTab, setActiveTab] = useState<'items' | 'orders'>('items');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [itemsRes, settingsRes, ordersRes] = await Promise.all([
        fetch('/api/merch/items'),
        fetch('/api/merch/settings'),
        fetch('/api/merch/orders'),
      ]);
      const [itemsData, settingsData, ordersData] = await Promise.all([
        itemsRes.json(),
        settingsRes.json(),
        ordersRes.json(),
      ]);
      setItems(itemsData);
      setSettings(settingsData);
      setEditShipping(settingsData.shipping_cost?.toString() || '5.00');
      setOrders(ordersData);
    } catch (err) {
      console.error('Failed to fetch:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveShipping = async () => {
    setSavingShipping(true);
    try {
      await fetch('/api/merch/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipping_cost: parseFloat(editShipping) }),
      });
      await fetchAll();
    } catch (err) {
      alert('Failed to save shipping cost');
    } finally {
      setSavingShipping(false);
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingItem(true);
    try {
      const response = await fetch('/api/merch/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newItem.name,
          description: newItem.description || null,
          price: parseFloat(newItem.price),
          stock: newItem.stock ? parseInt(newItem.stock) : null,
          needs_size: newItem.needs_size,
          sizes: newItem.needs_size && newItem.sizes
            ? newItem.sizes.split(',').map(s => s.trim()).filter(Boolean)
            : [],
          display_order: parseInt(newItem.display_order) || 0,
        }),
      });
      if (response.ok) {
        setNewItem({ name: '', description: '', price: '', stock: '', needs_size: false, sizes: '', display_order: '0' });
        setShowNewItem(false);
        await fetchAll();
      } else {
        alert('Failed to create item');
      }
    } catch {
      alert('Failed to create item');
    } finally {
      setSavingItem(false);
    }
  };

  const handleUpdateItem = async (id: string, updates: Partial<MerchItem>) => {
    try {
      await fetch(`/api/merch/items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      await fetchAll();
    } catch {
      alert('Failed to update item');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    try {
      await fetch(`/api/merch/items/${id}`, { method: 'DELETE' });
      await fetchAll();
    } catch {
      alert('Failed to delete item');
    }
  };

  const handleMarkShipped = async (orderId: string) => {
    try {
      await fetch(`/api/merch/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'shipped' }),
      });
      await fetchAll();
    } catch {
      alert('Failed to update order');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <div className="mb-4">
          <Link href="/admin/orders">
            <Image src="/logo.png" alt="Paige's Bagels" width={200} height={80} priority />
          </Link>
        </div>
        <nav className="flex gap-4 flex-wrap">
          <Link href="/admin/orders" className="hover:underline" style={{ color: '#004AAD' }}>Orders</Link>
          <Link href="/admin/slots" className="hover:underline" style={{ color: '#004AAD' }}>Time Slots</Link>
          <Link href="/admin/bagel-types" className="hover:underline" style={{ color: '#004AAD' }}>Bagel Types</Link>
          <Link href="/admin/add-ons" className="hover:underline" style={{ color: '#004AAD' }}>Add-Ons</Link>
          <Link href="/admin/pricing" className="hover:underline" style={{ color: '#004AAD' }}>Pricing</Link>
          <Link href="/admin/costs" className="hover:underline" style={{ color: '#004AAD' }}>Costs</Link>
          <Link href="/admin/financials" className="hover:underline" style={{ color: '#004AAD' }}>Financials</Link>
          <Link href="/admin/prep" className="hover:underline" style={{ color: '#004AAD' }}>Prep</Link>
          <Link href="/admin/merch" className="hover:underline font-semibold" style={{ color: '#004AAD' }}>Merch</Link>
        </nav>
      </div>

      <h1 className="text-2xl font-bold mb-6">Merch Management</h1>

      {/* Shipping Cost */}
      <div className="bg-white rounded-lg p-4 mb-6 border border-gray-200">
        <h2 className="font-bold mb-3">Shipping Cost</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">Flat rate: $</span>
          <input
            type="number"
            step="0.01"
            value={editShipping}
            onChange={(e) => setEditShipping(e.target.value)}
            className="w-24 px-3 py-1.5 border border-gray-300 rounded text-sm"
          />
          <button
            onClick={handleSaveShipping}
            disabled={savingShipping}
            className="px-4 py-1.5 text-white text-sm rounded"
            style={{ backgroundColor: '#004AAD' }}
          >
            {savingShipping ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('items')}
          className={`px-4 py-2 font-semibold transition-colors ${
            activeTab === 'items'
              ? 'border-b-2 border-[#004AAD] text-[#004AAD]'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Items ({items.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 font-semibold transition-colors ${
            activeTab === 'orders'
              ? 'border-b-2 border-[#004AAD] text-[#004AAD]'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Orders ({orders.length})
        </button>
      </div>

      {/* Items Tab */}
      {activeTab === 'items' && (
        <div>
          <div className="mb-4">
            <button
              onClick={() => setShowNewItem(!showNewItem)}
              className="px-4 py-2 text-white text-sm font-semibold rounded"
              style={{ backgroundColor: '#004AAD' }}
            >
              {showNewItem ? 'Cancel' : '+ Add Item'}
            </button>
          </div>

          {showNewItem && (
            <form onSubmit={handleCreateItem} className="bg-white rounded-lg p-4 mb-6 border border-gray-200">
              <h3 className="font-bold mb-3">New Item</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  placeholder="Name"
                  value={newItem.name}
                  onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="px-3 py-2 border border-gray-300 rounded text-sm"
                />
                <input
                  placeholder="Price"
                  type="number"
                  step="0.01"
                  value={newItem.price}
                  onChange={(e) => setNewItem(prev => ({ ...prev, price: e.target.value }))}
                  required
                  className="px-3 py-2 border border-gray-300 rounded text-sm"
                />
                <input
                  placeholder="Description"
                  value={newItem.description}
                  onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded text-sm"
                />
                <input
                  placeholder="Stock (blank = unlimited)"
                  type="number"
                  value={newItem.stock}
                  onChange={(e) => setNewItem(prev => ({ ...prev, stock: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded text-sm"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newItem.needs_size}
                    onChange={(e) => setNewItem(prev => ({ ...prev, needs_size: e.target.checked }))}
                    id="needs_size"
                  />
                  <label htmlFor="needs_size" className="text-sm">Needs Size</label>
                </div>
                {newItem.needs_size && (
                  <input
                    placeholder="Sizes (comma-separated: S,M,L,XL)"
                    value={newItem.sizes}
                    onChange={(e) => setNewItem(prev => ({ ...prev, sizes: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                )}
                <input
                  placeholder="Display Order"
                  type="number"
                  value={newItem.display_order}
                  onChange={(e) => setNewItem(prev => ({ ...prev, display_order: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={savingItem}
                className="mt-3 px-4 py-2 text-white text-sm font-semibold rounded"
                style={{ backgroundColor: '#004AAD' }}
              >
                {savingItem ? 'Creating...' : 'Create Item'}
              </button>
            </form>
          )}

          {/* Items List */}
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.id} className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-bold">{item.name}</span>
                    <span className="ml-2 text-sm text-gray-500">
                      ${item.price.toFixed(2)} | Stock: {item.stock ?? 'Unlimited'} | Order: {item.display_order}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateItem(item.id, { active: !item.active })}
                      className={`px-3 py-1 text-xs rounded ${item.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                    >
                      {item.active ? 'Active' : 'Inactive'}
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="px-3 py-1 text-xs rounded bg-red-100 text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {item.description && (
                  <p className="text-sm text-gray-500 mb-2">{item.description}</p>
                )}
                <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                  {item.needs_size && <span>Sizes: {item.sizes.join(', ')}</span>}
                </div>
                {/* Inline edit fields */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <input
                    placeholder="Price"
                    type="number"
                    step="0.01"
                    defaultValue={item.price}
                    onBlur={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val) && val !== item.price) {
                        handleUpdateItem(item.id, { price: val });
                      }
                    }}
                    className="w-20 px-2 py-1 border border-gray-200 rounded text-xs"
                  />
                  <input
                    placeholder="Stock"
                    type="number"
                    defaultValue={item.stock ?? ''}
                    onBlur={(e) => {
                      const val = e.target.value === '' ? null : parseInt(e.target.value);
                      if (val !== item.stock) {
                        handleUpdateItem(item.id, { stock: val } as Partial<MerchItem>);
                      }
                    }}
                    className="w-20 px-2 py-1 border border-gray-200 rounded text-xs"
                  />
                  <input
                    placeholder="Order"
                    type="number"
                    defaultValue={item.display_order}
                    onBlur={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val) && val !== item.display_order) {
                        handleUpdateItem(item.id, { display_order: val });
                      }
                    }}
                    className="w-16 px-2 py-1 border border-gray-200 rounded text-xs"
                  />
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <p className="text-gray-500">No items yet. Add one above!</p>
            )}
          </div>
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="space-y-3">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="font-bold">{order.customer_name}</span>
                  <span className="ml-2 text-sm text-gray-500">{order.customer_email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-xs rounded font-semibold ${
                    order.status === 'paid' ? 'bg-green-100 text-green-700' :
                    order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                    order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {order.status}
                  </span>
                  {order.status === 'paid' && (
                    <button
                      onClick={() => handleMarkShipped(order.id)}
                      className="px-3 py-1 text-xs rounded text-white"
                      style={{ backgroundColor: '#004AAD' }}
                    >
                      Mark Shipped
                    </button>
                  )}
                </div>
              </div>
              <div className="text-sm text-gray-600 mb-2">
                {order.items.map((item, i) => (
                  <span key={i}>
                    {item.quantity}x {item.name}{item.size ? ` (${item.size})` : ''}
                    {i < order.items.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </div>
              <div className="text-sm text-gray-500">
                <span>Ship to: {order.shipping_address}, {order.shipping_city}, {order.shipping_state} {order.shipping_zip}</span>
              </div>
              <div className="flex justify-between mt-2 text-sm">
                <span className="text-gray-500">
                  {new Date(order.created_at).toLocaleDateString()}
                </span>
                <span className="font-semibold">${order.total_price.toFixed(2)}</span>
              </div>
            </div>
          ))}
          {orders.length === 0 && (
            <p className="text-gray-500">No merch orders yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
