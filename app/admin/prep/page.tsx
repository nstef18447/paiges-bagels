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

interface BiteCount {
  name: string;
  quantity: number;
}

interface PrepOrder {
  customer_name: string;
  total_price: number;
  status: string;
  bagels: BagelCount[];
  add_ons: AddOnCount[];
  bites: BiteCount[];
  total_bagels: number;
}

interface SlotPrep {
  id: string;
  time: string;
  is_hangover: boolean;
  bagels: BagelCount[];
  add_ons: AddOnCount[];
  bites: BiteCount[];
  total_bagels: number;
  total_bites: number;
  orders: PrepOrder[];
}

interface DayPrep {
  date: string;
  slots: SlotPrep[];
  total_bagels: number;
}

// --- Oven Plan ---
const BIG_BAGEL_CAP = 12;
const SMALL_BAGEL_CAP = 6;
const BIG_BITE_CAP = 20;
const SMALL_BITE_CAP = 15;

// --- Cook Schedule ---
const COOK_BOIL_MINS = 2;
const COOK_TRANSFER_MINS = 5;
const COOK_BAKE_MINS = 26;
const COOK_COOL_MINS = 30;
const COOK_BAG_MINS = 10;

interface OvenFlavor { name: string; qty: number; }
interface OvenItem { label: string; flavors: OvenFlavor[]; qty: number; }
interface OvenSection { items: OvenItem[]; total: number; }
interface OvenLoad { bagels?: OvenSection; bites?: OvenSection; }
interface OvenRound { big: OvenLoad | null; small: OvenLoad | null; }

interface RoundTiming {
  roundNum: number;
  loads: number;
  readyBy: Date;    // oven must finish by this time (= pickupTime - cool - bag)
  pickupTime: Date; // actual pickup time for display
  prepStart: Date;
  ovenIn: Date;
  ovenOut: Date;
}

function takeFrom(queue: OvenItem[], capacity: number): OvenItem[] {
  const taken: OvenItem[] = [];
  let remaining = capacity;
  while (remaining > 0 && queue.length > 0) {
    const slot = queue[0];
    const takenItem: OvenItem = { label: slot.label, flavors: [], qty: 0 };
    while (remaining > 0 && slot.flavors.length > 0) {
      const f = slot.flavors[0];
      const take = Math.min(f.qty, remaining);
      takenItem.flavors.push({ name: f.name, qty: take });
      takenItem.qty += take;
      f.qty -= take;
      remaining -= take;
      if (f.qty === 0) slot.flavors.shift();
    }
    slot.qty = slot.flavors.reduce((s, f) => s + f.qty, 0);
    if (takenItem.qty > 0) taken.push(takenItem);
    if (slot.flavors.length === 0) queue.shift();
  }
  return taken;
}

function computeOvenPlan(slots: SlotPrep[]): OvenRound[] {
  const bagels: OvenItem[] = [];
  const bites: OvenItem[] = [];
  for (const slot of slots) {
    if (slot.total_bagels > 0) bagels.push({ label: slot.time, qty: slot.total_bagels, flavors: slot.bagels.map(b => ({ name: b.name, qty: b.quantity })) });
    if ((slot.total_bites || 0) > 0) bites.push({ label: slot.time, qty: slot.total_bites, flavors: (slot.bites || []).map(b => ({ name: b.name, qty: b.quantity })) });
  }

  const rounds: OvenRound[] = [];
  while (bagels.length > 0 || bites.length > 0) {
    const round: OvenRound = { big: null, small: null };

    // Big oven: bagels first, then fill remaining space with bites
    const bigLoad: OvenLoad = {};
    let bigFillPct = 0;
    if (bagels.length > 0) {
      const items = takeFrom(bagels, BIG_BAGEL_CAP);
      const total = items.reduce((s, i) => s + i.qty, 0);
      bigLoad.bagels = { items, total };
      bigFillPct = total / BIG_BAGEL_CAP;
    }
    const bigRemainingBites = Math.floor((1 - bigFillPct) * BIG_BITE_CAP);
    if (bigRemainingBites > 0 && bites.length > 0) {
      const items = takeFrom(bites, bigRemainingBites);
      bigLoad.bites = { items, total: items.reduce((s, i) => s + i.qty, 0) };
    }
    round.big = (bigLoad.bagels || bigLoad.bites) ? bigLoad : null;

    // Small oven: BITES first (same-slot priority), then fill remaining space with bagels
    if (bagels.length > 0 || bites.length > 0) {
      const smallLoad: OvenLoad = {};
      let smallFillPct = 0;
      if (bites.length > 0) {
        const items = takeFrom(bites, SMALL_BITE_CAP);
        const total = items.reduce((s, i) => s + i.qty, 0);
        smallLoad.bites = { items, total };
        smallFillPct = total / SMALL_BITE_CAP;
      }
      const smallRemainingBagels = Math.floor((1 - smallFillPct) * SMALL_BAGEL_CAP);
      if (smallRemainingBagels > 0 && bagels.length > 0) {
        const items = takeFrom(bagels, smallRemainingBagels);
        smallLoad.bagels = { items, total: items.reduce((s, i) => s + i.qty, 0) };
      }
      round.small = (smallLoad.bagels || smallLoad.bites) ? smallLoad : null;
    }

    rounds.push(round);
  }
  return rounds;
}

function getRoundReadyBy(round: OvenRound, date: string): Date {
  const times: string[] = [];
  round.big?.bagels?.items.forEach(i => times.push(i.label));
  round.big?.bites?.items.forEach(i => times.push(i.label));
  round.small?.bagels?.items.forEach(i => times.push(i.label));
  round.small?.bites?.items.forEach(i => times.push(i.label));
  const latest = [...times].sort().at(-1) ?? '23:59:00';
  return new Date(`${date}T${latest}`);
}

function computeDaySchedule(slots: SlotPrep[], date: string): RoundTiming[] {
  const rounds = computeOvenPlan(slots);
  if (rounds.length === 0) return [];

  // Pre-compute per-round constants
  const meta = rounds.map((round, i) => {
    const pickupTime = getRoundReadyBy(round, date);
    const readyBy = new Date(pickupTime.getTime() - (COOK_COOL_MINS + COOK_BAG_MINS) * 60000);
    const loads = (round.big ? 1 : 0) + (round.small ? 1 : 0);
    const prepMins = loads * (COOK_BOIL_MINS + COOK_TRANSFER_MINS);
    return { roundNum: i + 1, loads, readyBy, pickupTime, prepMins };
  });

  // Backward cascade: each round's ovenOut is the earlier of its own deadline
  // and the next round's prepStart, so earlier rounds shift left automatically.
  const schedule: RoundTiming[] = new Array(meta.length);
  for (let i = meta.length - 1; i >= 0; i--) {
    const { roundNum, loads, readyBy, pickupTime, prepMins } = meta[i];
    const ovenOut = i < meta.length - 1
      ? new Date(Math.min(readyBy.getTime(), schedule[i + 1].prepStart.getTime()))
      : new Date(readyBy);
    const ovenIn = new Date(ovenOut.getTime() - COOK_BAKE_MINS * 60000);
    const prepStart = new Date(ovenIn.getTime() - prepMins * 60000);
    schedule[i] = { roundNum, loads, readyBy, pickupTime, prepStart, ovenIn, ovenOut };
  }

  return schedule;
}

function fmtScheduleTime(d: Date): string {
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Chicago',
  });
}

function OvenSection({ section, color }: { section: OvenSection; color: string }) {
  return (
    <div className="space-y-0.5">
      {section.items.map((item, idx) => (
        <div key={idx} className="text-xs" style={{ color }}>
          <span className="font-semibold mr-1">{formatTime(item.label)} pickup:</span>
          {item.flavors.map(f => `${f.qty} ${f.name}`).join(', ')}
        </div>
      ))}
    </div>
  );
}

function OvenLoadRow({ ovenLabel, load }: { ovenLabel: string; load: OvenLoad }) {
  const isBig = ovenLabel === 'Big Oven';
  const bagelColor = '#004AAD';
  const biteColor = '#0369A1';
  const hasBoth = !!(load.bagels && load.bites);
  const bg = isBig ? '#FFF7ED' : '#F0FDF4';
  const border = isBig ? '#FDBA74' : '#86EFAC';
  const labelColor = isBig ? '#C2410C' : '#15803D';

  return (
    <div className="rounded-lg px-4 py-3 space-y-3" style={{ backgroundColor: bg, border: `1px solid ${border}` }}>
      <div className="text-xs font-bold uppercase tracking-widest" style={{ color: labelColor }}>{ovenLabel}</div>
      <div className="flex items-center gap-2">
        {load.bagels && (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: '#E8F0FE', color: bagelColor }}>
            {load.bagels.total}/{ovenLabel === 'Big Oven' ? BIG_BAGEL_CAP : SMALL_BAGEL_CAP} bagels
          </span>
        )}
        {load.bites && (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: '#E0F2FE', color: biteColor }}>
            {load.bites.total}/{ovenLabel === 'Big Oven' ? BIG_BITE_CAP : SMALL_BITE_CAP} bites
          </span>
        )}
      </div>
      {load.bagels && (
        <div className="pl-2">
          {hasBoth && <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: bagelColor }}>Bagels</div>}
          <OvenSection section={load.bagels} color={bagelColor} />
        </div>
      )}
      {load.bites && (
        <div className="pl-2">
          {hasBoth && <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: biteColor }}>Bites</div>}
          <OvenSection section={load.bites} color={biteColor} />
        </div>
      )}
    </div>
  );
}

export default function AdminPrepPage() {
  const [days, setDays] = useState<DayPrep[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPast, setShowPast] = useState(false);
  const [expandedSlots, setExpandedSlots] = useState<Set<string>>(new Set());
  const [markingReady, setMarkingReady] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'orders' | 'oven' | 'schedule'>('orders');

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

  const upcomingDays = days
    .filter((d) => d.date >= today)
    .map((d) => ({
      ...d,
      slots: d.slots.filter((s) => s.orders.some((o) => o.status === 'confirmed' || o.status === 'ready')),
    }))
    .filter((d) => d.slots.length > 0);

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
          <Link href="/admin/recipe" className="hover:underline" style={{ color: '#004AAD' }}>Recipe</Link>
        </nav>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Baking Prep</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('orders')}
            className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
            style={{
              backgroundColor: activeTab === 'orders' ? '#004AAD' : '#F3F4F6',
              color: activeTab === 'orders' ? 'white' : '#374151',
            }}
          >
            Orders
          </button>
          <button
            onClick={() => setActiveTab('oven')}
            className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
            style={{
              backgroundColor: activeTab === 'oven' ? '#004AAD' : '#F3F4F6',
              color: activeTab === 'oven' ? 'white' : '#374151',
            }}
          >
            Oven Plan
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
            style={{
              backgroundColor: activeTab === 'schedule' ? '#004AAD' : '#F3F4F6',
              color: activeTab === 'schedule' ? 'white' : '#374151',
            }}
          >
            Cook Schedule
          </button>
        </div>
      </div>

      {upcomingDays.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-400">
          No upcoming orders to prep for.
        </div>
      ) : activeTab === 'orders' ? (
        <div className="space-y-6">
          {upcomingDays.map((day) => (
            <div key={day.date} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">{formatDate(day.date)}</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium px-3 py-1 rounded-full" style={{ backgroundColor: '#E8F0FE', color: '#004AAD' }}>
                    {day.total_bagels} bagel{day.total_bagels !== 1 ? 's' : ''} total
                  </span>
                  {day.slots.reduce((sum, s) => sum + (s.total_bites || 0), 0) > 0 && (
                    <span className="text-sm font-medium px-3 py-1 rounded-full" style={{ backgroundColor: '#E0F2FE', color: '#0369A1' }}>
                      {day.slots.reduce((sum, s) => sum + (s.total_bites || 0), 0)} bite{day.slots.reduce((sum, s) => sum + (s.total_bites || 0), 0) !== 1 ? 's' : ''} total
                    </span>
                  )}
                </div>
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
                        — {slot.total_bagels} bagel{slot.total_bagels !== 1 ? 's' : ''}{slot.total_bites > 0 ? `, ${slot.total_bites} bite${slot.total_bites !== 1 ? 's' : ''}` : ''}
                      </span>
                    </div>

                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Bagels ({slot.total_bagels} total)
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-1">
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

                    {slot.bites && slot.bites.length > 0 && (
                      <div className="mt-3">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Bites ({slot.total_bites} total)
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-1">
                          {slot.bites.map((bite) => (
                            <div
                              key={bite.name}
                              className="flex items-center justify-between rounded-lg px-3 py-2"
                              style={{ backgroundColor: '#E0F2FE' }}
                            >
                              <span className="text-sm">{bite.name}</span>
                              <span className="text-sm font-bold ml-2">{bite.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

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
                                  {order.bites && order.bites.length > 0 && (
                                    <span style={{ color: '#0369A1' }}>
                                      {' + Bites: '}
                                      {order.bites.map((b) => `${b.quantity} ${b.name}`).join(', ')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {confirmedCount > 0 && (
                          <button
                            onClick={() => markAllReady(slot.id)}
                            disabled={markingReady.has(slot.id)}
                            className="mt-3 text-sm font-medium px-5 py-2 rounded-full text-white disabled:opacity-50"
                            style={{ backgroundColor: '#DC2626' }}
                          >
                            {markingReady.has(slot.id) ? 'Marking...' : `Mark All Ready (${confirmedCount})`}
                          </button>
                        )}
                      </div>
                      );
                    })()}
                  </div>
                ))}
              </div>

              {/* Day Totals */}
              {(() => {
                const bagelTotals = Object.entries(
                  day.slots.reduce<Record<string, number>>((acc, slot) => {
                    slot.bagels.forEach((b) => { acc[b.name] = (acc[b.name] || 0) + b.quantity; });
                    return acc;
                  }, {})
                ).sort(([a], [b]) => a.localeCompare(b));

                const biteTotals = Object.entries(
                  day.slots.reduce<Record<string, number>>((acc, slot) => {
                    (slot.bites || []).forEach((b) => { acc[b.name] = (acc[b.name] || 0) + b.quantity; });
                    return acc;
                  }, {})
                ).sort(([a], [b]) => a.localeCompare(b));

                const addOnTotals = day.slots.reduce<Record<string, number>>((acc, slot) => {
                  slot.add_ons.forEach((a) => { acc[a.name] = (acc[a.name] || 0) + a.quantity; });
                  return acc;
                }, {});

                const grandTotalBagels = bagelTotals.reduce((sum, [, qty]) => sum + qty, 0);
                const grandTotalBites = biteTotals.reduce((sum, [, qty]) => sum + qty, 0);

                return (
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                    <span className="text-sm font-semibold uppercase tracking-wide" style={{ color: '#004AAD' }}>Day Totals</span>

                    {bagelTotals.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Bagels</span>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#E8F0FE', color: '#004AAD' }}>
                            {grandTotalBagels} total
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {bagelTotals.map(([name, quantity]) => (
                            <div key={name} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ backgroundColor: '#E8F0FE' }}>
                              <span className="text-sm font-medium">{name}</span>
                              <span className="text-sm font-bold ml-2">{quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {biteTotals.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#0369A1' }}>Bites</span>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#E0F2FE', color: '#0369A1' }}>
                            {grandTotalBites} total
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {biteTotals.map(([name, quantity]) => (
                            <div key={name} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ backgroundColor: '#E0F2FE' }}>
                              <span className="text-sm font-medium">{name}</span>
                              <span className="text-sm font-bold ml-2">{quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(addOnTotals['Butter'] || addOnTotals['Schmear']) && (
                      <div className="pt-3 border-t border-gray-100 flex gap-3">
                        {addOnTotals['Butter'] && (
                          <div className="flex items-center justify-between rounded-lg px-3 py-2 flex-1" style={{ backgroundColor: '#FEF3C7' }}>
                            <span className="text-sm font-medium">Butter</span>
                            <span className="text-sm font-bold ml-2">{addOnTotals['Butter']}</span>
                          </div>
                        )}
                        {addOnTotals['Schmear'] && (
                          <div className="flex items-center justify-between rounded-lg px-3 py-2 flex-1" style={{ backgroundColor: '#FEF3C7' }}>
                            <span className="text-sm font-medium">Schmear</span>
                            <span className="text-sm font-bold ml-2">{addOnTotals['Schmear']}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          ))}
        </div>
      ) : activeTab === 'oven' ? (
        /* Oven Plan Tab */
        <div className="space-y-6">
          {/* Capacity legend */}
          <div className="flex flex-wrap gap-3 text-xs text-gray-500">
            <span className="px-3 py-1 rounded-full bg-gray-100">Big oven: <strong>12 bagels</strong> or <strong>20 bites</strong></span>
            <span className="px-3 py-1 rounded-full bg-gray-100">Small oven: <strong>6 bagels</strong> or <strong>15 bites</strong></span>
          </div>

          {upcomingDays.map((day) => {
            const rounds = computeOvenPlan(day.slots);
            return (
              <div key={day.date} className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-semibold">{formatDate(day.date)}</h2>
                  <span className="text-sm text-gray-500">{rounds.length} round{rounds.length !== 1 ? 's' : ''}</span>
                </div>

                <div className="space-y-5">
                  {rounds.map((round, i) => (
                    <div key={i}>
                      <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                        Round {i + 1}
                      </div>
                      <div className="space-y-2">
                        {round.big && <OvenLoadRow ovenLabel="Big Oven" load={round.big} />}
                        {round.small && <OvenLoadRow ovenLabel="Small Oven" load={round.small} />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Cook Schedule Tab */
        <div className="space-y-6">
          <div className="flex flex-wrap gap-3 text-xs text-gray-500">
            <span className="px-3 py-1 rounded-full bg-gray-100">Boil: <strong>{COOK_BOIL_MINS} min/load</strong></span>
            <span className="px-3 py-1 rounded-full bg-gray-100">Transfer &amp; seed: <strong>{COOK_TRANSFER_MINS} min/load</strong></span>
            <span className="px-3 py-1 rounded-full bg-gray-100">Bake: <strong>{COOK_BAKE_MINS} min</strong></span>
            <span className="px-3 py-1 rounded-full bg-gray-100">Cool: <strong>{COOK_COOL_MINS} min</strong></span>
            <span className="px-3 py-1 rounded-full bg-gray-100">Bag: <strong>{COOK_BAG_MINS} min</strong></span>
          </div>

          {upcomingDays.map((day) => {
            const schedule = computeDaySchedule(day.slots, day.date);
            if (schedule.length === 0) return null;
            const startTime = schedule[0].prepStart;
            const totalBites = day.slots.reduce((s, sl) => s + (sl.total_bites || 0), 0);

            return (
              <div key={day.date} className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">{formatDate(day.date)}</h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {day.total_bagels} bagel{day.total_bagels !== 1 ? 's' : ''}
                      {totalBites > 0 && ` · ${totalBites} bite${totalBites !== 1 ? 's' : ''}`}
                      {' · '}{schedule.length} oven round{schedule.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Start cooking by</div>
                    <div className="text-3xl font-black" style={{ color: '#004AAD' }}>{fmtScheduleTime(startTime)}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  {schedule.map((r) => {
                    const isLate = r.ovenOut > r.readyBy;
                    const lateMins = isLate ? Math.round((r.ovenOut.getTime() - r.readyBy.getTime()) / 60000) : 0;
                    const prepMins = r.loads * (COOK_BOIL_MINS + COOK_TRANSFER_MINS);
                    return (
                      <div
                        key={r.roundNum}
                        className="rounded-lg px-4 py-3"
                        style={{ backgroundColor: '#F8FAFF', border: '1px solid #E8EDF8' }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs font-bold uppercase tracking-widest text-gray-400">
                            Round {r.roundNum}
                            <span className="normal-case font-normal ml-1">
                              ({r.loads === 2 ? 'big + small oven' : 'one oven'})
                            </span>
                          </div>
                          {isLate && (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
                              ⚠ {lateMins} min late — won&apos;t cool in time
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                          <span className="font-bold" style={{ color: '#004AAD' }}>{fmtScheduleTime(r.prepStart)}</span>
                          <span className="text-gray-400 text-xs">boil &amp; prep ({prepMins} min)</span>
                          <span className="text-gray-300 font-bold">→</span>
                          <span className="font-bold" style={{ color: '#004AAD' }}>{fmtScheduleTime(r.ovenIn)}</span>
                          <span className="text-gray-400 text-xs">into oven ({COOK_BAKE_MINS} min)</span>
                          <span className="text-gray-300 font-bold">→</span>
                          <span className="font-bold" style={{ color: isLate ? '#DC2626' : '#004AAD' }}>
                            {fmtScheduleTime(r.ovenOut)}
                          </span>
                          <span className="text-xs text-gray-400">out of oven</span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Cool + bag chain for the final batch */}
                  {(() => {
                    const last = schedule[schedule.length - 1];
                    const coolEnd = new Date(last.ovenOut.getTime() + COOK_COOL_MINS * 60000);
                    const bagEnd = new Date(coolEnd.getTime() + COOK_BAG_MINS * 60000);
                    const onTime = bagEnd <= last.pickupTime;
                    return (
                      <div
                        className="rounded-lg px-4 py-3"
                        style={{ backgroundColor: onTime ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${onTime ? '#86EFAC' : '#FECACA'}` }}
                      >
                        <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: onTime ? '#15803D' : '#991B1B' }}>
                          After baking
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                          <span className="font-bold" style={{ color: onTime ? '#15803D' : '#DC2626' }}>{fmtScheduleTime(last.ovenOut)}</span>
                          <span className="text-gray-400 text-xs">cool ({COOK_COOL_MINS} min)</span>
                          <span className="text-gray-300 font-bold">→</span>
                          <span className="font-bold" style={{ color: onTime ? '#15803D' : '#DC2626' }}>{fmtScheduleTime(coolEnd)}</span>
                          <span className="text-gray-400 text-xs">bag ({COOK_BAG_MINS} min)</span>
                          <span className="text-gray-300 font-bold">→</span>
                          <span className="font-bold" style={{ color: onTime ? '#15803D' : '#DC2626' }}>{fmtScheduleTime(bagEnd)}</span>
                          <span className="text-xs font-medium" style={{ color: onTime ? '#15803D' : '#DC2626' }}>
                            {onTime
                              ? `✓ ready for ${fmtScheduleTime(last.pickupTime)} pickup`
                              : `⚠ ${Math.round((bagEnd.getTime() - last.pickupTime.getTime()) / 60000)} min late for ${fmtScheduleTime(last.pickupTime)} pickup`}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            );
          })}
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
