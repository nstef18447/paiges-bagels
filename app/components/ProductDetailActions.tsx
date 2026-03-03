'use client';

import { useState } from 'react';
import { MerchItem } from '@/types';
import { useCart } from './CartProvider';

export default function ProductDetailActions({ item }: { item: MerchItem }) {
  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState<string | null>(
    item.needs_size && item.sizes.length > 0 ? item.sizes[0] : null
  );
  const [qty, setQty] = useState(1);

  const soldOut = item.stock !== null && item.stock <= 0;
  const canAdd = !soldOut && (!item.needs_size || selectedSize);

  function handleAdd() {
    if (!canAdd) return;
    addToCart({
      productId: item.id,
      name: item.name,
      size: selectedSize,
      quantity: qty,
      price: item.price,
      imageUrl: item.image_url,
    });
  }

  return (
    <div>
      {/* Size picker */}
      {item.needs_size && item.sizes.length > 0 && (
        <div className="mb-5">
          <span
            className="block font-semibold text-[0.82rem] uppercase tracking-[0.05em] mb-2.5"
            style={{ color: 'var(--blue)' }}
          >
            Size
          </span>
          <div className="flex gap-2 flex-wrap">
            {item.sizes.map(size => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className="min-w-[52px] px-4 py-2.5 font-semibold text-[0.85rem] transition-all"
                style={{
                  borderRadius: 10,
                  background: selectedSize === size ? 'var(--blue)' : 'var(--bg-card)',
                  color: selectedSize === size ? '#fff' : 'var(--blue)',
                  border: selectedSize === size ? '1.5px solid var(--blue)' : '1.5px solid var(--border)',
                  cursor: 'pointer',
                }}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity */}
      <div className="flex items-center gap-0 mb-6">
        <button
          onClick={() => setQty(q => Math.max(1, q - 1))}
          className="w-11 h-11 rounded-full flex items-center justify-center text-xl font-semibold transition-all"
          style={{
            border: '1.5px solid var(--border)',
            background: 'var(--bg-card)',
            color: 'var(--blue)',
            cursor: 'pointer',
          }}
        >
          −
        </button>
        <span className="w-14 text-center font-bold text-[1.1rem]" style={{ color: 'var(--blue)' }}>
          {qty}
        </span>
        <button
          onClick={() => setQty(q => q + 1)}
          className="w-11 h-11 rounded-full flex items-center justify-center text-xl font-semibold transition-all"
          style={{
            border: '1.5px solid var(--border)',
            background: 'var(--bg-card)',
            color: 'var(--blue)',
            cursor: 'pointer',
          }}
        >
          +
        </button>
      </div>

      {/* Add to Cart */}
      <button
        onClick={handleAdd}
        disabled={!canAdd}
        className="w-full py-4 font-semibold text-[0.9rem] uppercase tracking-[0.06em] text-white flex items-center justify-center gap-2 transition-colors"
        style={{
          background: canAdd ? 'var(--blue)' : 'var(--border)',
          cursor: canAdd ? 'pointer' : 'not-allowed',
          opacity: canAdd ? 1 : 0.4,
          border: 'none',
          borderRadius: 0,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
          <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1.003 1.003 0 0 0 20 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
        </svg>
        {soldOut ? 'Sold Out' : `Add to Bag — $${(item.price * qty).toFixed(2)}`}
      </button>
    </div>
  );
}
