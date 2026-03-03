'use client';

import { useState, useEffect } from 'react';
import NavBar from '@/components/NavBar';
import ProductCard from '@/app/components/ProductCard';
import { useCart } from '@/app/components/CartProvider';
import { MerchItem } from '@/types';

export default function MerchPage() {
  const { cartCount, openDrawer } = useCart();

  /* ── Data ── */
  const [items, setItems] = useState<MerchItem[]>([]);
  const [loading, setLoading] = useState(true);

  /* ── UI state ── */
  const [activeCategory, setActiveCategory] = useState('All');

  /* ── Fetch data ── */
  useEffect(() => {
    fetch('/api/merch/items')
      .then(r => r.json())
      .then(data => {
        setItems(data);
        setLoading(false);
      });
  }, []);

  /* ── Derived ── */
  const categories = ['All', ...Array.from(new Set(
    items.map(i => {
      const n = i.name.toLowerCase();
      if (n.includes('hat') || n.includes('cap') || n.includes('beanie')) return 'Hats';
      if (n.includes('hoodie') || n.includes('crew') || n.includes('sweat') || n.includes('tee') || n.includes('shirt') || n.includes('tank')) return 'Tops';
      return 'Other';
    })
  ))];

  function getCategory(item: MerchItem): string {
    const n = item.name.toLowerCase();
    if (n.includes('hat') || n.includes('cap') || n.includes('beanie')) return 'Hats';
    if (n.includes('hoodie') || n.includes('crew') || n.includes('sweat') || n.includes('tee') || n.includes('shirt') || n.includes('tank')) return 'Tops';
    return 'Other';
  }

  const filteredItems = activeCategory === 'All'
    ? items
    : items.filter(i => getCategory(i) === activeCategory);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      <NavBar />

      {/* ── Page Header ── */}
      <div className="text-center" style={{ padding: '36px 20px 16px' }}>
        <p
          className="text-xs font-semibold uppercase tracking-[0.22em] mb-2"
          style={{ color: 'var(--brown)' }}
        >
          Seriously Sourdough
        </p>
        <h1
          className="text-[2.2rem] md:text-[2.8rem] font-black mb-2"
          style={{ fontFamily: 'var(--font-playfair)', color: 'var(--blue)' }}
        >
          Merch
        </h1>
        <p className="text-[0.95rem] max-w-[400px] mx-auto" style={{ color: '#6b7280' }}>
          Rep the brand. Look good doing it.
        </p>
      </div>

      {/* ── Category Tabs ── */}
      {categories.length > 1 && (
        <div className="flex justify-center gap-1 px-5 pb-8 max-w-[500px] mx-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="flex-1 py-2.5 text-center font-semibold text-[0.82rem] uppercase tracking-[0.06em] rounded-full transition-all"
              style={{
                background: activeCategory === cat ? 'var(--blue)' : 'none',
                color: activeCategory === cat ? '#fff' : '#6b7280',
                border: activeCategory === cat ? '1.5px solid var(--blue)' : '1.5px solid var(--border)',
                cursor: 'pointer',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* ── Product Grid ── */}
      <div className="max-w-[960px] mx-auto px-5 pb-12" style={{ paddingBottom: cartCount > 0 ? 80 : 48 }}>
        {loading ? (
          <div className="flex justify-center py-16">
            <div
              className="w-8 h-8 border-4 rounded-full animate-spin"
              style={{ borderColor: 'var(--blue)', borderTopColor: 'transparent' }}
            />
          </div>
        ) : filteredItems.length === 0 ? (
          <p className="text-center py-16" style={{ color: '#6b7280' }}>
            No items available yet. Check back soon!
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
            {filteredItems.map(item => (
              <ProductCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* ── Persistent Cart Bar ── */}
      {cartCount > 0 && (
        <div
          className="fixed bottom-0 left-0 right-0 z-[150] flex items-center justify-between px-5 py-3.5 text-white"
          style={{
            background: 'var(--blue)',
            paddingBottom: 'max(14px, env(safe-area-inset-bottom))',
          }}
        >
          <div className="flex items-center gap-3">
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-[0.82rem]"
              style={{ background: 'rgba(255,255,255,0.2)' }}
            >
              {cartCount}
            </span>
            <span className="font-medium text-[0.88rem]">
              {cartCount === 1 ? 'item in bag' : 'items in bag'}
            </span>
          </div>
          <button
            onClick={openDrawer}
            className="px-6 py-2.5 font-semibold text-[0.82rem] uppercase tracking-[0.06em] transition-all"
            style={{
              background: '#fff',
              color: 'var(--blue)',
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Checkout
          </button>
        </div>
      )}
    </div>
  );
}
