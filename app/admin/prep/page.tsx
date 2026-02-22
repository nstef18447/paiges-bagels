'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDate, formatTime } from '@/lib/utils';

interface BagelCount {
  name: string;
  quantity: number;
}

interface AddOnCount {
  name: string;
  quantity: number;
}

interface PrepOrder {
  customer_name: string;
  total_price: number;
  status: string;
  bagels: BagelCount[];
  add_ons: AddOnCount[];
  total_bagels: number;
}

interface SlotPrep {
  id: string;
  time: string;
  is_hangover: boolean;
  bagels: BagelCount[];
  add_ons: AddOnCount[];
  total_bagels: number;
  orders: PrepOrder[];
}

interface DayPrep {
  date: string;
  slots: SlotPrep[];
  total_bagels: number;
}

export default function AdminPrepPage() {
  const [days, setDays] = useState<DayPrep[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPast, setShowPast] = useState(false);
  const [expandedSlots, setExpandedSlots] = useState<Set<string>>(new Set());
  const [markingReady, setMarkingReady] = useState<Set<string>>(new Set());

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

  const markAllReady = async (slotId: string) => {
    setMarkingReady((prev) => new Set(prev).add(slotId));
    try {
      const response = await fetch(`/api/slots/${slotId}/mark-ready`, { method: 'POST' });
      const result = await response.json();
      if (result.success) {
        await fetchPrep();
      }
    } catch (error) {
      console.error('Failed to mark all ready:', error);
    } finally {
      setMarkingReady((prev) => {
        const next = new Set(prev);
        next.delete(slotId);
        return next;
      });
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const upcomingDays = days.filter((d) => d.date >= today);
  const pastDays = days.filter((d) => d.date < today);

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
          <Link href="/admin/merch" className="hover:underline" style={{ color: '#004AAD' }}>Merch</Link>
        </nav>
      </div>

      <h1 className="text-3xl font-bold mb-6">Baking Prep</h1>

      {upcomingDays.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-400">
          No upcoming orders to prep for.
        </div>
      ) : (
        <div className="space-y-6">
          {upcomingDays.map((day) => (
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

                    {slot.add_ons.length > 0 && (
                      <div className="mt-3">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Add-ons</span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-1">
                          {slot.add_ons.map((addOn) => (
                            <div
                              key={addOn.name}
                              className="flex items-center justify-between rounded-lg px-3 py-2"
                              style={{ backgroundColor: '#FEF3C7' }}
                            >
                              <span className="text-sm">{addOn.name}</span>
                              <span className="text-sm font-bold ml-2">{addOn.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {slot.orders && slot.orders.length > 0 && (() => {
                      const confirmedCount = slot.orders.filter((o) => o.status === 'confirmed').length;
                      return (
                      <div className="mt-3">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              setExpandedSlots((prev) => {
                                const next = new Set(prev);
                                if (next.has(slot.id)) {
                                  next.delete(slot.id);
                                } else {
                                  next.add(slot.id);
                                }
                                return next;
                              });
                            }}
                            className="flex items-center gap-2 text-sm font-medium hover:underline"
                            style={{ color: '#004AAD' }}
                          >
                            <span style={{ transform: expandedSlots.has(slot.id) ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', display: 'inline-block' }}>
                              ▶
                            </span>
                            Orders ({slot.orders.length})
                          </button>
                          {confirmedCount > 0 && (
                            <button
                              onClick={() => markAllReady(slot.id)}
                              disabled={markingReady.has(slot.id)}
                              className="text-xs font-medium px-3 py-1 rounded-full text-white disabled:opacity-50"
                              style={{ backgroundColor: '#004AAD' }}
                            >
                              {markingReady.has(slot.id) ? 'Marking...' : `Mark All Ready (${confirmedCount})`}
                            </button>
                          )}
                        </div>

                        {expandedSlots.has(slot.id) && (
                          <div className="mt-2 space-y-2">
                            {slot.orders.map((order, idx) => (
                              <div key={idx} className="bg-gray-50 rounded-lg px-3 py-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-bold">{order.customer_name}</span>
                                  <span className="text-sm text-gray-600">
                                    {order.total_bagels} bagel{order.total_bagels !== 1 ? 's' : ''} &middot; ${order.total_price.toFixed(2)}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {order.bagels.map((b) => `${b.quantity} ${b.name}`).join(', ')}
                                  {order.add_ons.length > 0 && (
                                    <span style={{ color: '#92400E' }}>
                                      {' + '}
                                      {order.add_ons.map((a) => `${a.quantity} ${a.name}`).join(', ')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      );
                    })()}
                  </div>
                ))}
              </div>

              {/* Day Totals */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <span className="text-sm font-semibold uppercase tracking-wide" style={{ color: '#004AAD' }}>Day Totals</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-2">
                  {Object.entries(
                    day.slots.reduce<Record<string, number>>((acc, slot) => {
                      slot.bagels.forEach((b) => { acc[b.name] = (acc[b.name] || 0) + b.quantity; });
                      return acc;
                    }, {})
                  )
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([name, quantity]) => (
                      <div key={name} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ backgroundColor: '#E8F0FE' }}>
                        <span className="text-sm font-medium">{name}</span>
                        <span className="text-sm font-bold ml-2">{quantity}</span>
                      </div>
                    ))}
                </div>
                {day.slots.some((s) => s.add_ons.length > 0) && (
                  <div className="mt-2">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {Object.entries(
                        day.slots.reduce<Record<string, number>>((acc, slot) => {
                          slot.add_ons.forEach((a) => { acc[a.name] = (acc[a.name] || 0) + a.quantity; });
                          return acc;
                        }, {})
                      )
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([name, quantity]) => (
                          <div key={name} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ backgroundColor: '#FEF3C7' }}>
                            <span className="text-sm font-medium">{name}</span>
                            <span className="text-sm font-bold ml-2">{quantity}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Past Orders */}
      {pastDays.length > 0 && (
        <div className="mt-8">
          <button
            onClick={() => setShowPast(!showPast)}
            className="flex items-center gap-2 text-sm font-medium hover:underline"
            style={{ color: '#004AAD' }}
          >
            <span style={{ transform: showPast ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', display: 'inline-block' }}>
              ▶
            </span>
            Past Orders ({pastDays.length} day{pastDays.length !== 1 ? 's' : ''})
          </button>

          {showPast && (
            <div className="space-y-3 mt-3">
              {pastDays.map((day) => (
                <div key={day.date} className="bg-white border border-gray-200 rounded-lg p-4 italic text-gray-500">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{formatDate(day.date)}</span>
                    <span className="text-sm">
                      {day.total_bagels} bagel{day.total_bagels !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="mt-2 space-y-2">
                    {day.slots.map((slot) => (
                      <div key={slot.id} className="text-sm flex flex-wrap gap-x-4 gap-y-1">
                        <span>{formatTime(slot.time)}:</span>
                        {slot.bagels.map((bagel) => (
                          <span key={bagel.name}>{bagel.name} x{bagel.quantity}</span>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
