'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDate, formatTime } from '@/lib/utils';

interface BagelCount {
  name: string;
  quantity: number;
}

interface SlotPrep {
  id: string;
  time: string;
  is_hangover: boolean;
  bagels: BagelCount[];
  total_bagels: number;
}

interface DayPrep {
  date: string;
  slots: SlotPrep[];
  total_bagels: number;
}

export default function AdminPrepPage() {
  const [days, setDays] = useState<DayPrep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrep();
  }, []);

  const fetchPrep = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/prep');
      const result = await response.json();
      setDays(result.days || []);
    } catch (error) {
      console.error('Failed to fetch prep data:', error);
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
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <div className="mb-4">
          <Link href="/admin/orders">
            <Image src="/logo.png" alt="Paige's Bagels" width={200} height={80} priority />
          </Link>
        </div>
        <nav className="flex gap-4">
          <Link href="/admin/orders" className="hover:underline" style={{ color: '#004AAD' }}>Orders</Link>
          <Link href="/admin/slots" className="hover:underline" style={{ color: '#004AAD' }}>Time Slots</Link>
          <Link href="/admin/bagel-types" className="hover:underline" style={{ color: '#004AAD' }}>Bagel Types</Link>
          <Link href="/admin/add-ons" className="hover:underline" style={{ color: '#004AAD' }}>Add-Ons</Link>
          <Link href="/admin/pricing" className="hover:underline" style={{ color: '#004AAD' }}>Pricing</Link>
          <Link href="/admin/costs" className="hover:underline" style={{ color: '#004AAD' }}>Costs</Link>
          <Link href="/admin/financials" className="hover:underline" style={{ color: '#004AAD' }}>Financials</Link>
          <Link href="/admin/prep" className="hover:underline font-semibold" style={{ color: '#004AAD' }}>Prep</Link>
        </nav>
      </div>

      <h1 className="text-3xl font-bold mb-6">Baking Prep</h1>

      {days.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-400">
          No upcoming orders to prep for.
        </div>
      ) : (
        <div className="space-y-6">
          {days.map((day) => (
            <div key={day.date} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">{formatDate(day.date)}</h2>
                <span className="text-sm font-medium px-3 py-1 rounded-full" style={{ backgroundColor: '#E8F0FE', color: '#004AAD' }}>
                  {day.total_bagels} bagel{day.total_bagels !== 1 ? 's' : ''} total
                </span>
              </div>

              <div className="space-y-4">
                {day.slots.map((slot) => (
                  <div key={slot.id} className="border border-gray-100 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-medium">{formatTime(slot.time)}</span>
                      {slot.is_hangover && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
                          Hangover
                        </span>
                      )}
                      <span className="text-sm text-gray-500">
                        — {slot.total_bagels} bagel{slot.total_bagels !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {slot.bagels.map((bagel) => (
                        <div
                          key={bagel.name}
                          className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
                        >
                          <span className="text-sm">{bagel.name}</span>
                          <span className="text-sm font-bold ml-2">{bagel.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
