'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MerchItem } from '@/types';

export default function ProductCard({ item }: { item: MerchItem }) {
  const soldOut = item.stock !== null && item.stock <= 0;

  return (
    <Link
      href={soldOut ? '#' : `/products/${item.id}`}
      className="product-card rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 block"
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border)',
        cursor: soldOut ? 'default' : 'pointer',
        opacity: soldOut ? 0.5 : 1,
        pointerEvents: soldOut ? 'none' : 'auto',
      }}
      onMouseEnter={e => {
        if (!soldOut) e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,74,173,0.08)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Image */}
      <div className="w-full overflow-hidden" style={{ aspectRatio: '5/6', background: '#eae7e1' }}>
        {item.image_url ? (
          <Image
            src={item.image_url.startsWith('/') ? item.image_url : `/${item.image_url}`}
            alt={item.name}
            width={400}
            height={480}
            className="w-full h-full object-cover transition-transform duration-400 hover:scale-[1.04]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl">🛍️</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3.5 md:p-4">
        <h3
          className="text-[0.95rem] font-bold mb-1"
          style={{ fontFamily: 'var(--font-playfair)', color: 'var(--blue)' }}
        >
          {item.name}
        </h3>
        <p className="font-semibold text-[0.88rem]" style={{ color: 'var(--brown)' }}>
          {soldOut ? 'Sold Out' : `$${item.price.toFixed(2)}`}
        </p>
      </div>
    </Link>
  );
}
