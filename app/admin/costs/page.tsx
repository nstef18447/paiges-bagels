'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AddOnType, Ingredient } from '@/types';
import { supabase } from '@/lib/supabase';

interface OrderStats {
  totalOrders: number;
  avgBagels: number;
  avgRevenue: number;
  containerRate: number;
  quantityBreakdown: { quantity: number; count: number }[];
}

interface BiteStats {
  totalBiteOrders: number;
  packBreakdown: { packSize: number; count: number }[];
  avgRevenue: number;
  combined: { count: number; avgBagels: number; avgPackSize: number; avgRevenue: number } | null;
  biteOnly: { count: number; avgPackSize: number; avgRevenue: number } | null;
}

// ── Recipe constants ──────────────────────────────────────────────────────────
// Starter (100g) = 50g regular flour + 50g water. Water is free.
// Malt powder: recipe calls for 1 tsp ≈ 3g, purchased by oz.
const RECIPE = [
  { name: 'Bread Flour',           amount: 500, unit: 'g', note: undefined,            purchaseUnits: ['g', 'kg', 'lb', 'oz'] },
  { name: 'Regular Flour',         amount: 50,  unit: 'g', note: 'goes into starter',  purchaseUnits: ['g', 'kg', 'lb', 'oz'] },
  { name: 'Salt',                  amount: 10,  unit: 'g', note: undefined,            purchaseUnits: ['g', 'kg', 'lb', 'oz'] },
  { name: 'Sugar',                 amount: 10,  unit: 'g', note: undefined,            purchaseUnits: ['g', 'kg', 'lb', 'oz'] },
  { name: 'Diastatic Malt Powder', amount: 3,   unit: 'g', note: '≈1 tsp per batch',  purchaseUnits: ['oz', 'g', 'lb'] },
];

const BAGELS_PER_BATCH = 890 / 110; // ~8.09

const TO_BASE: Record<string, number> = {
  g: 1, kg: 1000, lb: 453.592, oz: 28.3495,
  tsp: 1, tbsp: 3,
};

interface Purchase { amount: string; unit: string; price: string; }
type Purchases = Record<string, Purchase>;

const LS_KEY = 'paiges-ingredient-purchases';
const LS_PKG_KEY = 'paiges-packaging-purchases';

function loadPurchases(): Purchases {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch { return {}; }
}
function savePurchases(p: Purchases) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LS_KEY, JSON.stringify(p));
}
function loadPackaging(): Purchases {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(LS_PKG_KEY) || '{}'); } catch { return {}; }
}
function savePackaging(p: Purchases) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LS_PKG_KEY, JSON.stringify(p));
}

const LS_ADDON_KEY = 'paiges-addon-ingredient-purchases';
function loadAddonIngredients(): Purchases {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(LS_ADDON_KEY) || '{}'); } catch { return {}; }
}
function saveAddonIngredients(p: Purchases) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LS_ADDON_KEY, JSON.stringify(p));
}

const ADDON_INGREDIENTS = [
  { name: 'Cream Cheese', purchaseUnits: ['g', 'kg', 'lb', 'oz'], addonMatch: 'schmear' },
  { name: 'Butter',       purchaseUnits: ['g', 'kg', 'lb', 'oz'], addonMatch: 'butter' },
];
const SERVING_G = 75;

const PACKAGING = [
  { name: 'Paper Bags',              type: 'per_bagel' as const,  label: 'per bagel' },
  { name: 'Schmear/Butter Container', type: 'per_addon' as const,  label: 'per schmear/butter sold' },
  { name: 'Stickers',                type: 'per_order' as const,  label: 'per order' },
];

// cost per batch for one recipe ingredient given purchase inputs
function costPerBatch(ing: typeof RECIPE[0], p: Purchase): number {
  const purchaseAmt = parseFloat(p.amount);
  const price = parseFloat(p.price);
  if (!purchaseAmt || !price) return 0;
  const purchaseInBase = purchaseAmt * (TO_BASE[p.unit] ?? 1);
  return (price / purchaseInBase) * ing.amount;
}

// ── Add-on / fixed cost types ─────────────────────────────────────────────────
interface EditableCost {
  id?: string;
  name: string;
  unit: string;
  cost_per_unit: string;
  units_per_bagel: string;
  cost_type: 'per_addon' | 'fixed';
  add_on_type_id: string | null;
  isNew?: boolean;
}

export default function AdminCostsPage() {
  const [purchases, setPurchases] = useState<Purchases>({});
  const [packaging, setPackaging] = useState<Purchases>({});
  const [addonIngredients, setAddonIngredients] = useState<Purchases>({});
  const [addOnTypes, setAddOnTypes] = useState<AddOnType[]>([]);
  const [otherCosts, setOtherCosts] = useState<{ [key: string]: EditableCost }>({});
  const [pricing, setPricing] = useState<{ bagel_quantity: number; price: number; label: string }[]>([]);
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null);
  const [biteStats, setBiteStats] = useState<BiteStats | null>(null);
  const [bitePricing, setBitePricing] = useState<{ pack_size: number; price: number; active: boolean }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPurchases(loadPurchases());
    setPackaging(loadPackaging());
    setAddonIngredients(loadAddonIngredients());
    Promise.all([fetchIngredients(), fetchAddOnTypes(), fetchPricing(), fetchOrderStats(), fetchBiteStats()]).then(() => setLoading(false));
  }, []);

  const fetchIngredients = async () => {
    const res = await fetch('/api/ingredients');
    const data: Ingredient[] = await res.json();
    const map: { [key: string]: EditableCost } = {};
    data
      .filter(i => i.cost_type !== 'per_bagel')
      .forEach(i => {
        map[i.id] = {
          id: i.id, name: i.name, unit: i.unit,
          cost_per_unit: i.cost_per_unit.toString(),
          units_per_bagel: i.units_per_bagel.toString(),
          cost_type: i.cost_type as 'per_addon' | 'fixed',
          add_on_type_id: i.add_on_type_id,
        };
      });
    setOtherCosts(map);
  };

  const fetchAddOnTypes = async () => {
    const res = await fetch('/api/add-on-types');
    setAddOnTypes(await res.json());
  };

  const fetchPricing = async () => {
    const res = await fetch('/api/pricing?type=regular');
    const data = await res.json();
    setPricing(data.filter((p: { pricing_type: string }) => p.pricing_type === 'regular' || !p.pricing_type));
  };

  const fetchOrderStats = async () => {
    const { data: orders } = await supabase
      .from('orders')
      .select('total_price, total_bagels, order_add_ons(add_on_type:add_on_types(name))')
      .in('status', ['confirmed', 'ready']);

    if (!orders || orders.length === 0) return;

    let totalBagels = 0;
    let totalRevenue = 0;
    let ordersWithContainer = 0;
    const qtyCounts: Record<number, number> = {};

    for (const o of orders) {
      const qty = o.total_bagels ?? 0;
      totalBagels += qty;
      totalRevenue += o.total_price ?? 0;
      qtyCounts[qty] = (qtyCounts[qty] ?? 0) + 1;
      const addOns = (o.order_add_ons as unknown as { add_on_type: { name: string } | null }[]) ?? [];
      const hasContainer = addOns.some(a => {
        const name = a.add_on_type?.name?.toLowerCase() ?? '';
        return name.includes('schmear') || name.includes('butter');
      });
      if (hasContainer) ordersWithContainer++;
    }

    const quantityBreakdown = Object.entries(qtyCounts)
      .map(([q, count]) => ({ quantity: Number(q), count }))
      .sort((a, b) => a.quantity - b.quantity);

    setOrderStats({
      totalOrders: orders.length,
      avgBagels: totalBagels / orders.length,
      avgRevenue: totalRevenue / orders.length,
      containerRate: ordersWithContainer / orders.length,
      quantityBreakdown,
    });
  };

  const fetchBiteStats = async () => {
    const [pricingRes, ordersRes] = await Promise.all([
      fetch('/api/bite-pricing').then(r => r.json()),
      supabase
        .from('orders')
        .select('bites, total_bagels, total_price')
        .in('status', ['confirmed', 'ready'])
        .not('bites', 'is', null),
    ]);

    setBitePricing(pricingRes);

    const orders = ordersRes.data ?? [];
    if (orders.length === 0) return;

    const packCounts: Record<number, number> = {};
    let totalRevenue = 0;
    const combinedOrders: { bagels: number; packSize: number; revenue: number }[] = [];
    const biteOnlyOrders: { packSize: number; revenue: number }[] = [];

    for (const o of orders) {
      const bite = o.bites as { pack_size?: number } | null;
      const packSize = bite?.pack_size ?? 0;
      if (!packSize) continue;

      packCounts[packSize] = (packCounts[packSize] ?? 0) + 1;
      totalRevenue += o.total_price ?? 0;

      if ((o.total_bagels ?? 0) > 0) {
        combinedOrders.push({ bagels: o.total_bagels, packSize, revenue: o.total_price });
      } else {
        biteOnlyOrders.push({ packSize, revenue: o.total_price });
      }
    }

    const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    setBiteStats({
      totalBiteOrders: orders.length,
      avgRevenue: totalRevenue / orders.length,
      packBreakdown: Object.entries(packCounts)
        .map(([ps, count]) => ({ packSize: Number(ps), count }))
        .sort((a, b) => a.packSize - b.packSize),
      combined: combinedOrders.length > 0 ? {
        count: combinedOrders.length,
        avgBagels: avg(combinedOrders.map(o => o.bagels)),
        avgPackSize: avg(combinedOrders.map(o => o.packSize)),
        avgRevenue: avg(combinedOrders.map(o => o.revenue)),
      } : null,
      biteOnly: biteOnlyOrders.length > 0 ? {
        count: biteOnlyOrders.length,
        avgPackSize: avg(biteOnlyOrders.map(o => o.packSize)),
        avgRevenue: avg(biteOnlyOrders.map(o => o.revenue)),
      } : null,
    });
  };

  // ── Purchase input handlers ───────────────────────────────────────────────
  const updatePurchase = (name: string, field: keyof Purchase, value: string) => {
    setPurchases(prev => {
      const updated = {
        ...prev,
        [name]: { ...{ amount: '', unit: RECIPE.find(r => r.name === name)?.purchaseUnits[0] ?? 'g', price: '' }, ...prev[name], [field]: value },
      };
      savePurchases(updated);
      return updated;
    });
  };

  const updateAddonIngredient = (name: string, field: keyof Purchase, value: string) => {
    setAddonIngredients(prev => {
      const defaultUnit = ADDON_INGREDIENTS.find(a => a.name === name)?.purchaseUnits[0] ?? 'g';
      const updated = { ...prev, [name]: { ...{ amount: '', unit: defaultUnit, price: '' }, ...prev[name], [field]: value } };
      saveAddonIngredients(updated);
      return updated;
    });
  };

  const updatePackaging = (name: string, field: keyof Purchase, value: string) => {
    setPackaging(prev => {
      const updated = { ...prev, [name]: { ...{ amount: '', unit: 'count', price: '' }, ...prev[name], [field]: value } };
      savePackaging(updated);
      return updated;
    });
  };

  // ── Add-on / fixed cost handlers ──────────────────────────────────────────
  const handleCostChange = (key: string, field: keyof EditableCost, value: string) => {
    setOtherCosts(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  };

  const addRow = (type: 'per_addon' | 'fixed') => {
    const tempId = `new-${Date.now()}`;
    setOtherCosts(prev => ({
      ...prev,
      [tempId]: { name: '', unit: '', cost_per_unit: '0', units_per_bagel: '0', cost_type: type, add_on_type_id: null, isNew: true },
    }));
  };

  const handleDelete = async (key: string) => {
    const item = otherCosts[key];
    if (item.isNew) {
      setOtherCosts(prev => { const c = { ...prev }; delete c[key]; return c; });
      return;
    }
    if (!confirm('Delete this cost entry?')) return;
    const res = await fetch(`/api/ingredients?id=${key}`, { method: 'DELETE' });
    if (res.ok) {
      setOtherCosts(prev => { const c = { ...prev }; delete c[key]; return c; });
    } else {
      alert('Failed to delete');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save recipe ingredient costs to DB (for financials)
      const existingRes = await fetch('/api/ingredients');
      const existingAll: Ingredient[] = await existingRes.json();
      const existingRecipe = existingAll.filter(i => i.cost_type === 'per_bagel');

      for (const ing of RECIPE) {
        const p = purchases[ing.name];
        const cpb = costPerBatch(ing, p || { amount: '', unit: ing.purchaseUnits[0], price: '' });
        const costPerUnit = cpb > 0 ? cpb / ing.amount : 0;
        const unitsPerBagel = ing.amount / BAGELS_PER_BATCH;
        const existing = existingRecipe.find(e => e.name === ing.name);

        const payload = {
          name: ing.name, unit: ing.unit,
          cost_per_unit: costPerUnit,
          units_per_bagel: unitsPerBagel,
          cost_type: 'per_bagel',
          add_on_type_id: null,
        };

        if (existing) {
          await fetch('/api/ingredients', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: existing.id, ...payload }),
          });
        } else {
          await fetch('/api/ingredients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        }
      }

      // Save add-on and fixed costs
      for (const [key, item] of Object.entries(otherCosts)) {
        if (!item.name.trim()) continue;
        const payload = {
          name: item.name.trim(), unit: item.unit.trim(),
          cost_per_unit: parseFloat(item.cost_per_unit) || 0,
          units_per_bagel: parseFloat(item.units_per_bagel) || 0,
          cost_type: item.cost_type,
          add_on_type_id: item.add_on_type_id || null,
        };
        if (item.isNew) {
          await fetch('/api/ingredients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        } else {
          await fetch('/api/ingredients', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: key, ...payload }) });
        }
      }

      await fetchIngredients();
      alert('Costs saved!');
    } catch (e) {
      console.error(e);
      alert('Error saving costs');
    } finally {
      setSaving(false);
    }
  };

  // ── Derived numbers ───────────────────────────────────────────────────────
  const ingredientCostPerBagel = RECIPE.reduce((sum, ing) => {
    const p = purchases[ing.name];
    return sum + costPerBatch(ing, p || { amount: '', unit: ing.purchaseUnits[0], price: '' }) / BAGELS_PER_BATCH;
  }, 0);

  function pkgCostPer(name: string): number {
    const p = packaging[name];
    if (!p?.amount || !p?.price) return 0;
    return parseFloat(p.price) / parseFloat(p.amount);
  }
  const bagCostPerBagel = pkgCostPer('Paper Bags');
  const stickerCostPerOrder = pkgCostPer('Stickers');

  function addonCostPerServing(name: string): number {
    const p = addonIngredients[name];
    if (!p?.amount || !p?.price) return 0;
    const purchaseInG = parseFloat(p.amount) * (TO_BASE[p.unit] ?? 1);
    return (parseFloat(p.price) / purchaseInG) * SERVING_G;
  }
  const creamCheeseCostPerServing = addonCostPerServing('Cream Cheese');
  const butterCostPerServing = addonCostPerServing('Butter');
  // Weighted avg ingredient cost per schmear/butter order (assume 50/50 split if both entered)
  const addonIngCosts = [creamCheeseCostPerServing, butterCostPerServing].filter(c => c > 0);
  const avgAddonIngCostPerServing = addonIngCosts.length > 0 ? addonIngCosts.reduce((a, b) => a + b, 0) / addonIngCosts.length : 0;

  // Same recipe, 50g per bite vs 110g per bagel
  const ingredientCostPerBite = ingredientCostPerBagel * (50 / 110);

  const byType = (type: string) => Object.entries(otherCosts).filter(([, i]) => i.cost_type === type);

  if (loading) return <div className="flex justify-center items-center min-h-screen"><div className="text-lg">Loading...</div></div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Nav */}
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
          <Link href="/admin/costs" className="hover:underline font-semibold" style={{ color: '#004AAD' }}>Costs</Link>
          <Link href="/admin/financials" className="hover:underline" style={{ color: '#004AAD' }}>Financials</Link>
          <Link href="/admin/prep" className="hover:underline" style={{ color: '#004AAD' }}>Prep</Link>
          <Link href="/admin/merch" className="hover:underline" style={{ color: '#004AAD' }}>Merch</Link>
          <Link href="/admin/recipe" className="hover:underline" style={{ color: '#004AAD' }}>Recipe</Link>
        </nav>
      </div>

      {/* ── Bagel Ingredients ────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <div className="mb-5">
          <h2 className="text-2xl font-bold">Bagel Ingredients</h2>
          <p className="text-sm text-gray-500 mt-1">Based on your recipe — enter what you paid and how much you bought.</p>
        </div>

        <div className="space-y-3">
          {RECIPE.map((ing) => {
            const p: Purchase = purchases[ing.name] ?? { amount: '', unit: ing.purchaseUnits[0], price: '' };
            const batchCost = costPerBatch(ing, p);
            const perBagel = batchCost / BAGELS_PER_BATCH;
            const hasInput = !!p.amount && !!p.price;

            return (
              <div
                key={ing.name}
                className="rounded-xl p-4"
                style={{ backgroundColor: '#F8FAFF', border: '1px solid #E8EDF8' }}
              >
                <div className="flex flex-wrap items-center gap-3">
                  {/* Ingredient name + recipe amount */}
                  <div className="w-52 flex-shrink-0">
                    <p className="font-semibold text-gray-800 text-sm">{ing.name}</p>
                    <p className="text-xs text-gray-400">{ing.amount}{ing.unit} per batch</p>
                    {ing.note && <p className="text-xs text-gray-400 italic">{ing.note}</p>}
                  </div>

                  {/* Purchase inputs */}
                  <div className="flex items-center gap-1.5 text-sm">
                    <span className="text-gray-500">I paid</span>
                    <span className="text-gray-400">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={p.price}
                      onChange={e => updatePurchase(ing.name, 'price', e.target.value)}
                      className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                    />
                    <span className="text-gray-500">for</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0"
                      value={p.amount}
                      onChange={e => updatePurchase(ing.name, 'amount', e.target.value)}
                      className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                    />
                    <select
                      value={p.unit}
                      onChange={e => updatePurchase(ing.name, 'unit', e.target.value)}
                      className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#004AAD] focus:border-transparent bg-white"
                    >
                      {ing.purchaseUnits.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>

                  {/* Computed cost */}
                  {hasInput && (
                    <div className="ml-auto text-right flex-shrink-0">
                      <p className="text-xs text-gray-400">${batchCost.toFixed(3)}/batch</p>
                      <p className="text-sm font-bold" style={{ color: '#004AAD' }}>${perBagel.toFixed(4)}/bagel</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {ingredientCostPerBagel > 0 && (
          <div className="mt-5 p-3 rounded-lg inline-block" style={{ backgroundColor: '#EBF2FF', border: '1px solid #C7D9F8' }}>
            <span className="text-sm font-medium" style={{ color: '#004AAD' }}>
              Total ingredient cost per bagel: <strong>${ingredientCostPerBagel.toFixed(4)}</strong>
            </span>
          </div>
        )}
      </div>

      {/* ── Packaging ───────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <div className="mb-5">
          <h2 className="text-2xl font-bold">Packaging</h2>
          <p className="text-sm text-gray-500 mt-1">Enter what you paid and how many you got.</p>
        </div>

        <div className="space-y-3">
          {PACKAGING.map(item => {
            const p: Purchase = packaging[item.name] ?? { amount: '', unit: 'count', price: '' };
            const costPer = pkgCostPer(item.name);
            const hasInput = !!p.amount && !!p.price;

            return (
              <div key={item.name} className="rounded-xl p-4" style={{ backgroundColor: '#F8FAFF', border: '1px solid #E8EDF8' }}>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="w-40 flex-shrink-0">
                    <p className="font-semibold text-gray-800 text-sm">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.label}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <span className="text-gray-500">I paid</span>
                    <span className="text-gray-400">$</span>
                    <input
                      type="number" min="0" step="0.01" placeholder="0.00" value={p.price}
                      onChange={e => updatePackaging(item.name, 'price', e.target.value)}
                      className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                    />
                    <span className="text-gray-500">for</span>
                    <input
                      type="number" min="0" step="1" placeholder="0" value={p.amount}
                      onChange={e => updatePackaging(item.name, 'amount', e.target.value)}
                      className="w-24 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                    />
                    <span className="text-gray-500">units</span>
                  </div>
                  {hasInput && (
                    <div className="ml-auto text-right flex-shrink-0">
                      <p className="text-sm font-bold" style={{ color: '#004AAD' }}>${costPer.toFixed(4)}/{item.label}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Schmear & Butter ────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <div className="mb-5">
          <h2 className="text-2xl font-bold">Schmear & Butter</h2>
          <p className="text-sm text-gray-500 mt-1">75g per serving. Enter tub size and price.</p>
        </div>
        <div className="space-y-3">
          {ADDON_INGREDIENTS.map(item => {
            const p: Purchase = addonIngredients[item.name] ?? { amount: '', unit: item.purchaseUnits[0], price: '' };
            const costPerServing = addonCostPerServing(item.name);
            const hasInput = !!p.amount && !!p.price;
            return (
              <div key={item.name} className="rounded-xl p-4" style={{ backgroundColor: '#F8FAFF', border: '1px solid #E8EDF8' }}>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="w-36 flex-shrink-0">
                    <p className="font-semibold text-gray-800 text-sm">{item.name}</p>
                    <p className="text-xs text-gray-400">75g per serving</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <span className="text-gray-500">I paid</span>
                    <span className="text-gray-400">$</span>
                    <input
                      type="number" min="0" step="0.01" placeholder="0.00" value={p.price}
                      onChange={e => updateAddonIngredient(item.name, 'price', e.target.value)}
                      className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                    />
                    <span className="text-gray-500">for</span>
                    <input
                      type="number" min="0" step="any" placeholder="0" value={p.amount}
                      onChange={e => updateAddonIngredient(item.name, 'amount', e.target.value)}
                      className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                    />
                    <select
                      value={p.unit}
                      onChange={e => updateAddonIngredient(item.name, 'unit', e.target.value)}
                      className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#004AAD] focus:border-transparent bg-white"
                    >
                      {item.purchaseUnits.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  {hasInput && (
                    <div className="ml-auto text-right flex-shrink-0">
                      <p className="text-sm font-bold" style={{ color: '#004AAD' }}>${costPerServing.toFixed(4)}/serving</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Margin per add-on */}
        {(creamCheeseCostPerServing > 0 || butterCostPerServing > 0) && (() => {
          const containerCost = pkgCostPer('Schmear/Butter Container');
          const rows = ADDON_INGREDIENTS.map(item => {
            const ingCost = addonCostPerServing(item.name);
            if (!ingCost) return null;
            const addOnType = addOnTypes.find(a => a.name.toLowerCase().includes(item.addonMatch));
            const sellPrice = addOnType?.price ?? 0;
            const totalCost = ingCost + containerCost;
            const margin = sellPrice - totalCost;
            const marginPct = sellPrice > 0 ? (margin / sellPrice) * 100 : 0;
            const isGood = marginPct >= 70;
            return { name: item.name, ingCost, containerCost, totalCost, sellPrice, margin, marginPct, isGood };
          }).filter(Boolean);

          if (rows.length === 0) return null;
          return (
            <div className="mt-5 pt-5 border-t border-gray-100">
              <h3 className="text-base font-bold mb-4">Margin per Add-On</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="py-2 px-3 font-semibold text-gray-600">Add-On</th>
                      <th className="py-2 px-3 font-semibold text-gray-600">Sell price</th>
                      <th className="py-2 px-3 font-semibold text-gray-600">Ingredient</th>
                      <th className="py-2 px-3 font-semibold text-gray-600">Container</th>
                      <th className="py-2 px-3 font-semibold text-gray-600">Total cost</th>
                      <th className="py-2 px-3 font-semibold text-gray-600">Margin</th>
                      <th className="py-2 px-3 font-semibold text-gray-600">Margin %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(row => row && (
                      <tr key={row.name} className="border-b border-gray-100">
                        <td className="py-3 px-3 font-medium">{row.name}</td>
                        <td className="py-3 px-3 text-gray-700">${row.sellPrice.toFixed(2)}</td>
                        <td className="py-3 px-3 text-gray-700">${row.ingCost.toFixed(4)}</td>
                        <td className="py-3 px-3 text-gray-700">${row.containerCost.toFixed(4)}</td>
                        <td className="py-3 px-3 text-gray-700">${row.totalCost.toFixed(4)}</td>
                        <td className="py-3 px-3 font-semibold" style={{ color: row.margin >= 0 ? '#15803D' : '#DC2626' }}>
                          ${row.margin.toFixed(4)}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold"
                            style={{ backgroundColor: row.isGood ? '#DCFCE7' : '#FEF9C3', color: row.isGood ? '#15803D' : '#92400E' }}>
                            {row.marginPct.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── Margin Summary ───────────────────────────────────────────────── */}
      {ingredientCostPerBagel > 0 && pricing.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded" style={{ backgroundColor: '#E8F0FE', color: '#004AAD' }}>Bagels</span>
            <h2 className="text-2xl font-bold">Margin by Pricing Tier</h2>
          </div>
          <p className="text-sm text-gray-500 mb-5">Ingredients + packaging. Does not include labor.</p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-2 px-3 font-semibold text-gray-600">Tier</th>
                  <th className="py-2 px-3 font-semibold text-gray-600">Revenue/bagel</th>
                  <th className="py-2 px-3 font-semibold text-gray-600">Cost/bagel</th>
                  <th className="py-2 px-3 font-semibold text-gray-600">Gross margin</th>
                  <th className="py-2 px-3 font-semibold text-gray-600">Margin %</th>
                </tr>
              </thead>
              <tbody>
                {pricing
                  .filter((p, i, arr) => arr.findIndex(x => x.bagel_quantity === p.bagel_quantity) === i)
                  .sort((a, b) => a.bagel_quantity - b.bagel_quantity)
                  .map(tier => {
                    const revenuePerBagel = tier.price / tier.bagel_quantity;
                    const packagingPerBagel = bagCostPerBagel + (stickerCostPerOrder / tier.bagel_quantity);
                    const totalCostPerBagel = ingredientCostPerBagel + packagingPerBagel;
                    const grossMargin = revenuePerBagel - totalCostPerBagel;
                    const marginPct = (grossMargin / revenuePerBagel) * 100;
                    const isGood = marginPct >= 70;

                    return (
                      <tr key={tier.bagel_quantity} className="border-b border-gray-100">
                        <td className="py-3 px-3 font-medium">{tier.label}</td>
                        <td className="py-3 px-3 text-gray-700">${revenuePerBagel.toFixed(2)}</td>
                        <td className="py-3 px-3 text-gray-500">
                          <span className="text-gray-700">${totalCostPerBagel.toFixed(4)}</span>
                          {packagingPerBagel > 0 && (
                            <span className="text-xs text-gray-400 ml-1">
                              (ing ${ingredientCostPerBagel.toFixed(3)} + pkg ${packagingPerBagel.toFixed(3)})
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-semibold" style={{ color: grossMargin >= 0 ? '#15803D' : '#DC2626' }}>
                          ${grossMargin.toFixed(4)}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className="px-2.5 py-1 rounded-full text-xs font-bold"
                            style={{
                              backgroundColor: isGood ? '#DCFCE7' : '#FEF9C3',
                              color: isGood ? '#15803D' : '#92400E',
                            }}
                          >
                            {marginPct.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* Based on actual orders */}
          {orderStats && orderStats.totalOrders >= 3 && (
            <div className="mt-6 pt-5 border-t border-gray-100">
              <h3 className="text-base font-bold mb-1" style={{ color: '#004AAD' }}>
                Based on Your {orderStats.totalOrders} Orders
              </h3>
              <p className="text-xs text-gray-400 mb-4">
                Avg {orderStats.avgBagels.toFixed(1)} bagels/order &middot; {(orderStats.containerRate * 100).toFixed(0)}% include schmear/butter
              </p>

              {/* Order quantity breakdown */}
              <div className="flex flex-wrap gap-2 mb-5">
                {orderStats.quantityBreakdown.filter(({ quantity }) => quantity > 0 && quantity <= 13).map(({ quantity, count }) => {
                  const pct = (count / orderStats.totalOrders) * 100;
                  return (
                    <div key={quantity} className="rounded-lg px-3 py-2 text-center min-w-[72px]" style={{ backgroundColor: '#F8FAFF', border: '1px solid #E8EDF8' }}>
                      <p className="text-base font-bold" style={{ color: '#004AAD' }}>{count}</p>
                      <p className="text-xs text-gray-500">{quantity === 1 ? '1 bagel' : `${quantity} bagels`}</p>
                      <p className="text-[0.68rem] text-gray-400">{pct.toFixed(0)}%</p>
                    </div>
                  );
                })}
              </div>

              {(() => {
                const avgBags = orderStats.avgBagels;
                const ingCost = ingredientCostPerBagel * avgBags;
                const bagCost = bagCostPerBagel * avgBags;
                const containerCost = pkgCostPer('Schmear/Butter Container') * orderStats.containerRate;
                const addonIngCost = avgAddonIngCostPerServing * orderStats.containerRate;
                const stickerCost = stickerCostPerOrder;
                const totalCost = ingCost + bagCost + containerCost + addonIngCost + stickerCost;
                const grossMargin = orderStats.avgRevenue - totalCost;
                const marginPct = (grossMargin / orderStats.avgRevenue) * 100;
                const isGood = marginPct >= 70;

                return (
                  <div className="rounded-xl p-4" style={{ backgroundColor: isGood ? '#F0FDF4' : '#FEFCE8', border: `1px solid ${isGood ? '#86EFAC' : '#FDE047'}` }}>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Avg revenue/order</p>
                        <p className="text-lg font-bold text-gray-800">${orderStats.avgRevenue.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Avg cost/order</p>
                        <p className="text-lg font-bold text-gray-800">${totalCost.toFixed(2)}</p>
                        <p className="text-[0.65rem] text-gray-400 leading-tight mt-0.5">
                          ing ${ingCost.toFixed(2)} · bags ${bagCost.toFixed(2)} · schmear/butter ${(containerCost + addonIngCost).toFixed(2)} · sticker ${stickerCost.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Gross margin/order</p>
                        <p className="text-lg font-bold" style={{ color: grossMargin >= 0 ? '#15803D' : '#DC2626' }}>${grossMargin.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Margin %</p>
                        <p className="text-lg font-bold" style={{ color: isGood ? '#15803D' : '#92400E' }}>{marginPct.toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {orderStats && orderStats.totalOrders < 3 && (
            <p className="text-xs text-gray-400 mt-4">Not enough order history yet for actual margin calculation.</p>
          )}
        </div>
      )}

      {/* ── Bites Margin ────────────────────────────────────────────────── */}
      {ingredientCostPerBite > 0 && bitePricing.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded" style={{ backgroundColor: '#E0F2FE', color: '#0369A1' }}>Bites</span>
            <h2 className="text-2xl font-bold">Margin by Pack Size</h2>
          </div>
          <p className="text-sm text-gray-500 mb-5">Same recipe, 50g dough per bite. Sticker cost split across pack size.</p>

          {/* Margin by pack size */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-2 px-3 font-semibold text-gray-600">Pack</th>
                  <th className="py-2 px-3 font-semibold text-gray-600">Price</th>
                  <th className="py-2 px-3 font-semibold text-gray-600">Revenue/bite</th>
                  <th className="py-2 px-3 font-semibold text-gray-600">Cost/bite</th>
                  <th className="py-2 px-3 font-semibold text-gray-600">Margin/pack</th>
                  <th className="py-2 px-3 font-semibold text-gray-600">Margin %</th>
                </tr>
              </thead>
              <tbody>
                {bitePricing.filter(p => p.active !== false).sort((a, b) => a.pack_size - b.pack_size).map(tier => {
                  const revenuePerBite = tier.price / tier.pack_size;
                  const stickerPerBite = stickerCostPerOrder / tier.pack_size;
                  const totalCostPerBite = ingredientCostPerBite + stickerPerBite;
                  const marginPerPack = tier.price - totalCostPerBite * tier.pack_size;
                  const marginPct = (marginPerPack / tier.price) * 100;
                  const isGood = marginPct >= 70;
                  return (
                    <tr key={tier.pack_size} className="border-b border-gray-100">
                      <td className="py-3 px-3 font-medium">{tier.pack_size} bites</td>
                      <td className="py-3 px-3 text-gray-700">${tier.price.toFixed(2)}</td>
                      <td className="py-3 px-3 text-gray-700">${revenuePerBite.toFixed(3)}</td>
                      <td className="py-3 px-3 text-gray-500">
                        <span className="text-gray-700">${totalCostPerBite.toFixed(4)}</span>
                        {stickerPerBite > 0 && <span className="text-xs text-gray-400 ml-1">(ing ${ingredientCostPerBite.toFixed(3)} + sticker ${stickerPerBite.toFixed(3)})</span>}
                      </td>
                      <td className="py-3 px-3 font-semibold" style={{ color: marginPerPack >= 0 ? '#15803D' : '#DC2626' }}>
                        ${marginPerPack.toFixed(3)}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold"
                          style={{ backgroundColor: isGood ? '#DCFCE7' : '#FEF9C3', color: isGood ? '#15803D' : '#92400E' }}>
                          {marginPct.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Bite order stats */}
          {biteStats && biteStats.totalBiteOrders >= 3 && (
            <div className="pt-5 border-t border-gray-100 space-y-5">
              <div>
                <h3 className="text-base font-bold mb-1" style={{ color: '#004AAD' }}>
                  Based on Your {biteStats.totalBiteOrders} Bite Orders
                </h3>
                <p className="text-xs text-gray-400 mb-3">Avg revenue/bite order: <strong className="text-gray-600">${biteStats.avgRevenue.toFixed(2)}</strong></p>

                {/* Pack size breakdown */}
                <div className="flex flex-wrap gap-2">
                  {biteStats.packBreakdown.map(({ packSize, count }) => {
                    const pct = (count / biteStats.totalBiteOrders) * 100;
                    return (
                      <div key={packSize} className="rounded-lg px-3 py-2 text-center min-w-[72px]" style={{ backgroundColor: '#F8FAFF', border: '1px solid #E8EDF8' }}>
                        <p className="text-base font-bold" style={{ color: '#004AAD' }}>{count}</p>
                        <p className="text-xs text-gray-500">{packSize} bites</p>
                        <p className="text-[0.68rem] text-gray-400">{pct.toFixed(0)}%</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bagels + bites combined */}
              {biteStats.combined && (() => {
                const ingCost = ingredientCostPerBagel * biteStats.combined.avgBagels + ingredientCostPerBite * biteStats.combined.avgPackSize;
                const schmearRate = orderStats?.containerRate ?? 0;
                const pkgCost = bagCostPerBagel * biteStats.combined.avgBagels + (pkgCostPer('Schmear/Butter Container') + avgAddonIngCostPerServing) * schmearRate + stickerCostPerOrder;
                const totalCost = ingCost + pkgCost;
                const margin = biteStats.combined.avgRevenue - totalCost;
                const pct = (margin / biteStats.combined.avgRevenue) * 100;
                const isGood = pct >= 70;
                return (
                  <div className="rounded-xl p-4" style={{ backgroundColor: '#F0F9FF', border: '1px solid #BAE6FD' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded" style={{ backgroundColor: '#E8F0FE', color: '#004AAD' }}>Bagels</span>
                      <span className="text-xs text-gray-400">+</span>
                      <span className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded" style={{ backgroundColor: '#E0F2FE', color: '#0369A1' }}>Bites</span>
                      <span className="text-xs text-gray-500 ml-1">{biteStats.combined.count} orders</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center mb-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Avg bagels</p>
                        <p className="text-lg font-bold text-gray-800">{biteStats.combined.avgBagels.toFixed(1)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Avg bites</p>
                        <p className="text-lg font-bold text-gray-800">{biteStats.combined.avgPackSize.toFixed(1)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Avg revenue</p>
                        <p className="text-lg font-bold text-gray-800">${biteStats.combined.avgRevenue.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Avg cost</p>
                        <p className="text-lg font-bold text-gray-800">${totalCost.toFixed(2)}</p>
                        <p className="text-[0.65rem] text-gray-400 leading-tight mt-0.5">ing ${ingCost.toFixed(2)} · bags+sticker+schmear(×{(schmearRate*100).toFixed(0)}%) ${pkgCost.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex gap-4 justify-center">
                      <span className="text-sm font-semibold" style={{ color: margin >= 0 ? '#15803D' : '#DC2626' }}>${margin.toFixed(2)} margin/order</span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                        style={{ backgroundColor: isGood ? '#DCFCE7' : '#FEF9C3', color: isGood ? '#15803D' : '#92400E' }}>
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Bites only */}
              {biteStats.biteOnly && (() => {
                const ingCost = ingredientCostPerBite * biteStats.biteOnly.avgPackSize;
                const pkgCost = stickerCostPerOrder;
                const totalCost = ingCost + pkgCost;
                const margin = biteStats.biteOnly.avgRevenue - totalCost;
                const pct = (margin / biteStats.biteOnly.avgRevenue) * 100;
                const isGood = pct >= 70;
                return (
                  <div className="rounded-xl p-4" style={{ backgroundColor: '#F8FAFF', border: '1px solid #E8EDF8' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded" style={{ backgroundColor: '#E0F2FE', color: '#0369A1' }}>Bites Only</span>
                      <span className="text-xs text-gray-500 ml-1">{biteStats.biteOnly.count} orders</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center mb-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Avg pack size</p>
                        <p className="text-lg font-bold text-gray-800">{biteStats.biteOnly.avgPackSize.toFixed(1)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Avg revenue</p>
                        <p className="text-lg font-bold text-gray-800">${biteStats.biteOnly.avgRevenue.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Avg cost</p>
                        <p className="text-lg font-bold text-gray-800">${totalCost.toFixed(2)}</p>
                        <p className="text-[0.65rem] text-gray-400 leading-tight mt-0.5">ing ${ingCost.toFixed(2)} · sticker ${pkgCost.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex gap-4 justify-center">
                      <span className="text-sm font-semibold" style={{ color: margin >= 0 ? '#15803D' : '#DC2626' }}>${margin.toFixed(2)} margin/order</span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                        style={{ backgroundColor: isGood ? '#DCFCE7' : '#FEF9C3', color: isGood ? '#15803D' : '#92400E' }}>
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* ── Add-On Costs ─────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold">Add-On Costs</h2>
            <p className="text-sm text-gray-500">Cost per unit sold (e.g., schmear, butter)</p>
          </div>
          <button onClick={() => addRow('per_addon')} className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm">
            + Add Cost
          </button>
        </div>

        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-2 px-2 font-semibold text-gray-600">Name</th>
              <th className="py-2 px-2 font-semibold text-gray-600">Add-On</th>
              <th className="py-2 px-2 font-semibold text-gray-600">Cost per unit ($)</th>
              <th className="py-2 px-2"></th>
            </tr>
          </thead>
          <tbody>
            {byType('per_addon').map(([key, item]) => (
              <tr key={key} className="border-b border-gray-100">
                <td className="py-2 px-2">
                  <input type="text" value={item.name} onChange={e => handleCostChange(key, 'name', e.target.value)}
                    placeholder="e.g., Cream Cheese" className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-[#004AAD]" />
                </td>
                <td className="py-2 px-2">
                  <select value={item.add_on_type_id || ''} onChange={e => handleCostChange(key, 'add_on_type_id', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-[#004AAD] bg-white">
                    <option value="">Select add-on...</option>
                    {addOnTypes.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </td>
                <td className="py-2 px-2">
                  <input type="number" step="0.01" min="0" value={item.cost_per_unit}
                    onChange={e => handleCostChange(key, 'cost_per_unit', e.target.value)}
                    className="w-28 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-[#004AAD]" />
                </td>
                <td className="py-2 px-2">
                  <button onClick={() => handleDelete(key)} className="text-red-500 hover:text-red-700 text-sm">Delete</button>
                </td>
              </tr>
            ))}
            {byType('per_addon').length === 0 && (
              <tr><td colSpan={4} className="py-6 text-center text-gray-400">No add-on costs yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Fixed Costs ──────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold">Fixed Costs</h2>
            <p className="text-sm text-gray-500">One-time or recurring costs amortized across all bagels</p>
          </div>
          <button onClick={() => addRow('fixed')} className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm">
            + Add Fixed Cost
          </button>
        </div>

        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-2 px-2 font-semibold text-gray-600">Name</th>
              <th className="py-2 px-2 font-semibold text-gray-600">Total Cost ($)</th>
              <th className="py-2 px-2"></th>
            </tr>
          </thead>
          <tbody>
            {byType('fixed').map(([key, item]) => (
              <tr key={key} className="border-b border-gray-100">
                <td className="py-2 px-2">
                  <input type="text" value={item.name} onChange={e => handleCostChange(key, 'name', e.target.value)}
                    placeholder="e.g., Packaging, Equipment" className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-[#004AAD]" />
                </td>
                <td className="py-2 px-2">
                  <input type="number" step="0.01" min="0" value={item.cost_per_unit}
                    onChange={e => handleCostChange(key, 'cost_per_unit', e.target.value)}
                    className="w-36 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-[#004AAD]" />
                </td>
                <td className="py-2 px-2">
                  <button onClick={() => handleDelete(key)} className="text-red-500 hover:text-red-700 text-sm">Delete</button>
                </td>
              </tr>
            ))}
            {byType('fixed').length === 0 && (
              <tr><td colSpan={3} className="py-6 text-center text-gray-400">No fixed costs yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 px-6 font-semibold rounded-xl text-white disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        style={{ backgroundColor: saving ? undefined : '#004AAD' }}
      >
        {saving ? 'Saving...' : 'Save All Costs'}
      </button>
    </div>
  );
}
