'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Pricing } from '@/types';

export default function AdminPricingPage() {
  const [pricing, setPricing] = useState<Pricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedPrices, setEditedPrices] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    fetchPricing();
  }, []);

  const fetchPricing = async () => {
    try {
      const response = await fetch('/api/pricing');
      const data = await response.json();
      setPricing(data);

      // Initialize edited prices
      const prices: { [key: number]: string } = {};
      data.forEach((p: Pricing) => {
        prices[p.bagel_quantity] = p.price.toFixed(2);
      });
      setEditedPrices(prices);
    } catch (error) {
      console.error('Failed to fetch pricing:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePriceChange = (quantity: number, value: string) => {
    setEditedPrices((prev) => ({
      ...prev,
      [quantity]: value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const updates = Object.entries(editedPrices).map(([quantity, price]) => ({
        bagel_quantity: parseInt(quantity),
        price: parseFloat(price),
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
        </nav>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-md">
        <h2 className="text-2xl font-semibold mb-6">Manage Pricing</h2>

        <div className="space-y-4">
          {pricing.map((item) => (
            <div key={item.id} className="flex items-center justify-between">
              <label className="font-medium text-lg">
                {item.bagel_quantity} {item.bagel_quantity === 1 ? 'Bagel' : 'Bagels'}:
              </label>
              <div className="flex items-center">
                <span className="mr-2 text-lg">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editedPrices[item.bagel_quantity] || ''}
                  onChange={(e) => handlePriceChange(item.bagel_quantity, e.target.value)}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
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
