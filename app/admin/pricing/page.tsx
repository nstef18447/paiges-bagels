'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Pricing } from '@/types';

interface EditedPricing {
  quantity: string;
  price: string;
  label: string;
}

export default function AdminPricingPage() {
  const [pricing, setPricing] = useState<Pricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedPricing, setEditedPricing] = useState<{ [id: string]: EditedPricing }>({});

  useEffect(() => {
    fetchPricing();
  }, []);

  const fetchPricing = async () => {
    try {
      const response = await fetch('/api/pricing');
      const data = await response.json();
      setPricing(data);

      // Initialize edited pricing
      const edited: { [id: string]: EditedPricing } = {};
      data.forEach((p: Pricing) => {
        edited[p.id] = {
          quantity: p.bagel_quantity.toString(),
          price: p.price.toFixed(2),
          label: p.label || `${p.bagel_quantity} Bagel${p.bagel_quantity === 1 ? '' : 's'}`,
        };
      });
      setEditedPricing(edited);
    } catch (error) {
      console.error('Failed to fetch pricing:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (id: string, field: keyof EditedPricing, value: string) => {
    setEditedPricing((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const updates = Object.entries(editedPricing).map(([id, data]) => ({
        id,
        bagel_quantity: parseInt(data.quantity),
        price: parseFloat(data.price),
        label: data.label.trim(),
      }));

      const response = await fetch('/api/pricing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updatedPricing = await response.json();
        setPricing(updatedPricing);
        alert('Pricing updated successfully!');
      } else {
        alert('Failed to update pricing');
      }
    } catch (error) {
      console.error('Error updating pricing:', error);
      alert('An error occurred while updating pricing');
    } finally {
      setSaving(false);
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
        <h1 className="text-4xl font-bold mb-4">Paige&apos;s Bagels - Pricing</h1>
        <nav className="flex gap-4">
          <Link href="/admin/orders" className="text-blue-600 hover:underline">
            Orders
          </Link>
          <Link href="/admin/slots" className="text-blue-600 hover:underline">
            Time Slots
          </Link>
          <Link href="/admin/bagel-types" className="text-blue-600 hover:underline">
            Bagel Types
          </Link>
          <Link href="/admin/pricing" className="text-blue-600 hover:underline font-semibold">
            Pricing
          </Link>
          <Link href="/admin/costs" className="text-blue-600 hover:underline">
            Costs
          </Link>
          <Link href="/admin/financials" className="text-blue-600 hover:underline">
            Financials
          </Link>
        </nav>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-2xl">
        <h2 className="text-2xl font-semibold mb-6">Manage Pricing</h2>

        <div className="space-y-6">
          {pricing.map((item) => (
            <div key={item.id} className="border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity (number of bagels)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editedPricing[item.id]?.quantity || ''}
                    onChange={(e) => handleChange(item.id, 'quantity', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Label
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 3 bagels and 1 free"
                    value={editedPricing[item.id]?.label || ''}
                    onChange={(e) => handleChange(item.id, 'label', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This is what customers will see on the order form
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price
                  </label>
                  <div className="flex items-center">
                    <span className="mr-2 text-lg">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editedPricing[item.id]?.price || ''}
                      onChange={(e) => handleChange(item.id, 'price', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full mt-6 py-3 px-6 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving...' : 'Save Pricing'}
        </button>
      </div>
    </div>
  );
}
