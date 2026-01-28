'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TimeSlotWithCapacity } from '@/types';
import SlotManager from '@/components/SlotManager';

export default function AdminSlotsPage() {
  const [slots, setSlots] = useState<TimeSlotWithCapacity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSlots();
  }, []);

  const fetchSlots = async () => {
    try {
      const response = await fetch('/api/slots');
      const data = await response.json();
      setSlots(data);
    } catch (err) {
      console.error('Failed to fetch slots:', err);
    } finally {
      setLoading(false);
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
        <h1 className="text-4xl font-bold mb-4">Paige&apos;s Bagels - Admin</h1>
        <nav className="flex gap-4">
          <Link
            href="/admin/orders"
            className="text-blue-600 hover:underline"
          >
            Orders
          </Link>
          <Link
            href="/admin/slots"
            className="text-blue-600 hover:underline font-semibold"
          >
            Time Slots
          </Link>
          <Link
            href="/admin/bagel-types"
            className="text-blue-600 hover:underline"
          >
            Bagel Types
          </Link>
          <Link
            href="/admin/pricing"
            className="text-blue-600 hover:underline"
          >
            Pricing
          </Link>
          <Link
            href="/admin/costs"
            className="text-blue-600 hover:underline"
          >
            Costs
          </Link>
          <Link
            href="/admin/financials"
            className="text-blue-600 hover:underline"
          >
            Financials
          </Link>
        </nav>
      </div>

      <SlotManager slots={slots} onRefresh={fetchSlots} />
    </div>
  );
}
