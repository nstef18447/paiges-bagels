'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BitePricing } from '@/types';

export default function AdminBitePricingPage() {
  const [pricing, setPricing] = useState<BitePricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedPricing, setEditedPricing] = useState<{ [id: string]: { price: string; active: boolean } }>({});

  useEffect(() => {
    fetchPricing();
  }, []);

  const fetchPricing = async () => {
    try {
      const response = await fetch('/api/bite-pricing');
      const data = await response.json();
      setPricing(data);

      const edited: { [id: string]: { price: string; active: boolean } } = {};
      data.forEach((p: BitePricing) => {
        edited[p.id] = {
          price: p.price.toFixed(2),
          active: p.active,
        };
      });
      setEditedPricing(edited);
    } catch (error) {
      console.error('Failed to fetch bite pricing:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const updates = Object.entries(editedPricing).map(([id, data]) => ({
        id,
        price: parseFloat(data.price),
        active: data.active,
      }));

      const response = await fetch('/api/bite-pricing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updatedPricing = await response.json();
        setPricing(updatedPricing);
        alert('Bite pricing updated successfully!');
      } else {
        alert('Failed to update bite pricing');
      }
    } catch (error) {
      console.error('Error updating bite pricing:', error);
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
    <div className="max-w-4xl mx-auto p-6">
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
          <Link href="/admin/bite-flavors" className="hover:underline" style={{ color: '#004AAD' }}>Bite Flavors</Link>
          <Link href="/admin/bite-pricing" className="hover:underline font-semibold" style={{ color: '#004AAD' }}>Bite Pricing</Link>
          <Link href="/admin/pricing" className="hover:underline" style={{ color: '#004AAD' }}>Pricing</Link>
          <Link href="/admin/costs" className="hover:underline" style={{ color: '#004AAD' }}>Costs</Link>
          <Link href="/admin/financials" className="hover:underline" style={{ color: '#004AAD' }}>Financials</Link>
          <Link href="/admin/prep" className="hover:underline" style={{ color: '#004AAD' }}>Prep</Link>
          <Link href="/admin/merch" className="hover:underline" style={{ color: '#004AAD' }}>Merch</Link>
        </nav>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-lg">
        <h2 className="text-2xl font-semibold mb-4">Bite Pricing</h2>
        <p className="text-sm text-gray-600 mb-6">
          Set prices and availability for each bite pack size.
        </p>

        <div className="space-y-4">
          {pricing.map((item) => (
            <div key={item.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-bold">{item.pack_size}-Pack</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editedPricing[item.id]?.active ?? item.active}
                    onChange={(e) =>
                      setEditedPricing((prev) => ({
                        ...prev,
                        [item.id]: { ...prev[item.id], active: e.target.checked },
                      }))
                    }
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-600">Active</span>
                </label>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editedPricing[item.id]?.price ?? item.price.toFixed(2)}
                  onChange={(e) =>
                    setEditedPricing((prev) => ({
                      ...prev,
                      [item.id]: { ...prev[item.id], price: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                />
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full mt-6 py-3 px-6 bg-[#004AAD] text-white font-semibold rounded-lg hover:bg-[#003A8C] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving...' : 'Save Pricing'}
        </button>
      </div>
    </div>
  );
}
