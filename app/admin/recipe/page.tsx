'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const FLOUR_G_PER_BATCH = 500;
const G_PER_LB = 453.592;

const BASE_RECIPE = [
  { name: 'Active Sourdough Starter', amount: 100, unit: 'g' },
  { name: 'Bread Flour', amount: 500, unit: 'g' },
  { name: 'Water', amount: 270, unit: 'g' },
  { name: 'Salt', amount: 10, unit: 'g' },
  { name: 'Sugar', amount: 10, unit: 'g' },
  { name: 'Diastatic Malt Powder', amount: 1, unit: 'tsp' },
];

const BASE_DOUGH_WEIGHT = 890;
const BAGEL_DOUGH_G = 110;
const BITE_DOUGH_G = 50;

interface DayPlan {
  date: string;
  bagels: number;
  bites: number;
  totalDough: number;
  multiplier: number;
}

function formatAmount(amount: number, unit: string): string {
  if (unit === 'tsp') {
    if (amount >= 3) {
      const tbsp = amount / 3;
      return `${Number.isInteger(tbsp) ? tbsp : tbsp.toFixed(1)} tbsp`;
    }
    if (amount === 0.5) return '½ tsp';
    return `${amount} tsp`;
  }
  return `${Number.isInteger(amount) ? amount : amount}g`;
}

function formatDate(dateString: string): string {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export default function RecipePage() {
  const [multiplier, setMultiplier] = useState(1);
  const [dayPlans, setDayPlans] = useState<DayPlan[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);

  useEffect(() => {
    fetch('/api/slots')
      .then(r => r.json())
      .then((slots: Array<{
        date: string;
        capacity: number;
        remaining: number;
        bite_capacity: number;
        bite_remaining: number;
      }>) => {
        const today = new Date().toISOString().split('T')[0];
        const byDate: Record<string, { bagels: number; bites: number }> = {};

        for (const slot of slots) {
          if (slot.date < today) continue;
          if (!byDate[slot.date]) byDate[slot.date] = { bagels: 0, bites: 0 };
          byDate[slot.date].bagels += slot.capacity - slot.remaining;
          byDate[slot.date].bites += (slot.bite_capacity || 0) - Math.max(0, slot.bite_remaining || 0);
        }

        const plans: DayPlan[] = Object.entries(byDate)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, { bagels, bites }]) => {
            const totalDough = bagels * BAGEL_DOUGH_G + bites * BITE_DOUGH_G;
            // Round up to nearest half-batch (0.5 increments)
            const multiplier = Math.ceil((totalDough / BASE_DOUGH_WEIGHT) * 2) / 2;
            return { date, bagels, bites, totalDough, multiplier };
          });

        setDayPlans(plans);
      })
      .catch(console.error)
      .finally(() => setLoadingSlots(false));
  }, []);

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
          <Link href="/admin/pricing" className="hover:underline" style={{ color: '#004AAD' }}>Pricing</Link>
          <Link href="/admin/costs" className="hover:underline" style={{ color: '#004AAD' }}>Costs</Link>
          <Link href="/admin/financials" className="hover:underline" style={{ color: '#004AAD' }}>Financials</Link>
          <Link href="/admin/prep" className="hover:underline" style={{ color: '#004AAD' }}>Prep</Link>
          <Link href="/admin/merch" className="hover:underline" style={{ color: '#004AAD' }}>Merch</Link>
          <Link href="/admin/recipe" className="hover:underline font-semibold" style={{ color: '#004AAD' }}>Recipe</Link>
        </nav>
      </div>

      {/* Recipe card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Bagel Recipe</h2>
          <div className="flex gap-2">
            {[0.5, 1, 2, 3].map((x) => (
              <button
                key={x}
                onClick={() => setMultiplier(x)}
                className="w-12 h-10 rounded-lg font-semibold text-sm transition-all"
                style={{
                  backgroundColor: multiplier === x ? '#004AAD' : '#F3F4F6',
                  color: multiplier === x ? '#fff' : '#374151',
                  border: multiplier === x ? '2px solid #004AAD' : '2px solid #E5E7EB',
                }}
              >
                {x === 0.5 ? '½×' : `${x}×`}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {BASE_RECIPE.map((ingredient) => {
            const scaled = ingredient.amount * multiplier;
            return (
              <div
                key={ingredient.name}
                className="flex items-center justify-between py-3 px-4 rounded-lg"
                style={{ backgroundColor: '#F8FAFF', border: '1px solid #E8EDF8' }}
              >
                <span className="font-medium text-gray-800">{ingredient.name}</span>
                <span className="font-bold text-lg" style={{ color: '#004AAD' }}>
                  {formatAmount(scaled, ingredient.unit)}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Total dough weight: <span className="font-semibold text-gray-700">{(100 + 500 + 270 + 10 + 10) * multiplier}g</span>
          </p>
        </div>
      </div>

      {/* Dough calculator */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-1">Dough by Baking Day</h2>
        <p className="text-sm text-gray-500 mb-6">Based on current orders — {BAGEL_DOUGH_G}g per bagel, {BITE_DOUGH_G}g per bite</p>

        {loadingSlots && (
          <p className="text-gray-400 text-sm">Loading...</p>
        )}

        {!loadingSlots && dayPlans.length === 0 && (
          <p className="text-gray-400 text-sm">No upcoming baking days with orders.</p>
        )}

        {!loadingSlots && dayPlans.length > 0 && (
          <div className="space-y-4">
            {(() => {
              const totalFlourLbs = dayPlans.reduce((sum, d) => sum + d.multiplier * FLOUR_G_PER_BATCH, 0) / G_PER_LB;
              return (
                <div className="rounded-xl px-5 py-4 flex items-center justify-between" style={{ backgroundColor: '#EFF6FF', border: '1.5px solid #BFDBFE' }}>
                  <span className="text-sm font-semibold text-gray-700">Total bread flour needed</span>
                  <span className="text-lg font-black" style={{ color: '#004AAD' }}>{totalFlourLbs.toFixed(1)} lbs</span>
                </div>
              );
            })()}
            {dayPlans.map((day) => (
              <div
                key={day.date}
                className="rounded-xl p-5"
                style={{ backgroundColor: '#F8FAFF', border: '1px solid #E8EDF8' }}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-bold text-gray-800 text-lg">{formatDate(day.date)}</p>
                    <div className="flex gap-4 mt-2 text-sm text-gray-600">
                      <span>{day.bagels} bagel{day.bagels !== 1 ? 's' : ''}</span>
                      {day.bites > 0 && <span>{day.bites} bite{day.bites !== 1 ? 's' : ''}</span>}
                      <span className="text-gray-400">{day.totalDough}g dough</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className="inline-flex items-center justify-center min-w-16 h-16 px-3 rounded-xl text-2xl font-black text-white"
                      style={{ backgroundColor: '#004AAD' }}
                    >
                      {day.multiplier}×
                    </span>
                    <p className="text-xs text-gray-400 mt-1">batch size</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#6B7280"><path d="M20 6h-2.18c.07-.44.18-.88.18-1.36C18 2.06 15.96 0 13.64 0c-1.26 0-2.37.57-3.14 1.47L10 2l-.5-.53C8.73.57 7.62 0 6.36 0 4.04 0 2 2.06 2 4.64c0 .48.11.92.18 1.36H0v2h20V6zm-9.14-1.26c.35-.43.87-.74 1.78-.74C13.96 4 15 5.02 15 6H9.94l.92-1.26zM4.64 4C4.64 3.12 5.34 2 6.36 2c.91 0 1.43.31 1.78.74L9.06 4H4.64zm-2.64 4h20v12H2V8zm9 5V9H9v4H7l5 5 5-5h-2v-4z"/></svg>
                  <span className="text-sm font-semibold text-gray-700">
                    Bread flour: <span style={{ color: '#004AAD' }}>{(day.multiplier * FLOUR_G_PER_BATCH / G_PER_LB).toFixed(1)} lbs</span>
                  </span>
                  <span className="text-xs text-gray-400">({day.multiplier * FLOUR_G_PER_BATCH}g)</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
