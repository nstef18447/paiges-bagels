'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { MerchOrder } from '@/types';
import { generateVenmoLink, generateVenmoNote } from '@/lib/utils';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [order, setOrder] = useState<MerchOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) { setLoading(false); return; }

    fetch(`/api/merch/orders/${orderId}`)
      .then(r => r.json())
      .then(data => { setOrder(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [orderId]);

  if (!orderId) {
    return (
      <div className="text-center py-10">
        <p style={{ color: '#4A4A4A' }}>No order found.</p>
        <Link href="/merch" className="mt-4 inline-block font-semibold" style={{ color: '#004AAD' }}>
          Back to Merch
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-10">
        <p style={{ color: '#4A4A4A' }}>Loading your order...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-10">
        <p style={{ color: '#4A4A4A' }}>Order not found.</p>
        <Link href="/merch" className="mt-4 inline-block font-semibold" style={{ color: '#004AAD' }}>
          Back to Merch
        </Link>
      </div>
    );
  }

  const venmoUsername = process.env.NEXT_PUBLIC_VENMO_USERNAME || 'paiges-bagels';
  const venmoNote = generateVenmoNote(order.id);
  const venmoLink = generateVenmoLink(venmoUsername, order.total_price, venmoNote);

  return (
    <div>
      {/* Success header */}
      <div className="text-center mb-8">
        <div
          className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center"
          style={{ backgroundColor: 'var(--blue-light)' }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="var(--blue)">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        <h1
          className="text-[2rem] font-black mb-2"
          style={{ color: 'var(--blue)', fontFamily: 'var(--font-playfair)' }}
        >
          Order Placed!
        </h1>
        <p className="text-[0.95rem]" style={{ color: 'var(--text-secondary)' }}>
          Thanks, {order.customer_name}! Pay below to confirm your order.
        </p>
      </div>

      {/* Order summary */}
      <div
        className="rounded-2xl overflow-hidden mb-8"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        {/* Items */}
        <div className="px-6 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <h3
            className="text-[0.72rem] font-semibold uppercase tracking-[0.15em] mb-3"
            style={{ color: 'var(--text-secondary)' }}
          >
            Items Ordered
          </h3>
          <ul className="space-y-2">
            {order.items.map((item, i) => (
              <li key={i} className="flex justify-between text-[0.9rem]">
                <span style={{ color: 'var(--text-dark)' }}>
                  {item.name}{item.size ? ` (${item.size})` : ''} ×{item.quantity}
                </span>
                <span className="font-semibold" style={{ color: 'var(--blue)' }}>
                  ${(item.unit_price * item.quantity).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Total */}
        <div className="px-6 py-5">
          <div className="flex justify-between text-[0.85rem] mb-1.5" style={{ color: '#6b7280' }}>
            <span>Service fee</span>
            <span>${order.shipping_cost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold" style={{ color: 'var(--text-dark)' }}>Total</span>
            <span className="text-2xl font-bold" style={{ color: 'var(--success)' }}>
              ${order.total_price.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Next steps */}
      <div
        className="rounded-2xl p-6 mb-6"
        style={{ backgroundColor: 'var(--blue-light)', border: '1px solid var(--border)' }}
      >
        <h2
          className="text-lg font-bold mb-4"
          style={{ color: 'var(--blue)', fontFamily: 'var(--font-playfair)' }}
        >
          Next Steps
        </h2>
        <ol className="space-y-4">
          <li className="flex gap-3">
            <span
              className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ backgroundColor: 'var(--blue)' }}
            >
              1
            </span>
            <div>
              <p className="text-[0.92rem] font-semibold" style={{ color: 'var(--text-dark)' }}>Pay via Venmo</p>
              <p className="text-[0.82rem]" style={{ color: 'var(--text-secondary)' }}>
                Use the button below to pay ${order.total_price.toFixed(2)}
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <span
              className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ backgroundColor: 'var(--blue)' }}
            >
              2
            </span>
            <div>
              <p className="text-[0.92rem] font-semibold" style={{ color: 'var(--text-dark)' }}>Wait for confirmation</p>
              <p className="text-[0.82rem]" style={{ color: 'var(--text-secondary)' }}>
                {`We'll reach out to ${order.customer_email} to arrange pickup once payment is verified.`}
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <span
              className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ backgroundColor: 'var(--blue)' }}
            >
              3
            </span>
            <div>
              <p className="text-[0.92rem] font-semibold" style={{ color: 'var(--text-dark)' }}>Pick up your order</p>
              <p className="text-[0.82rem]" style={{ color: 'var(--text-secondary)' }}>
                Paige will reach out to coordinate a pickup time!
              </p>
            </div>
          </li>
        </ol>
      </div>

      {/* Venmo button */}
      <a
        href={venmoLink}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full py-4 px-6 font-semibold text-[0.88rem] uppercase tracking-[0.06em] text-center text-white transition-all mb-4"
        style={{ backgroundColor: 'var(--blue)' }}
        onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--blue-hover)'}
        onMouseOut={e => e.currentTarget.style.backgroundColor = 'var(--blue)'}
      >
        Pay ${order.total_price.toFixed(2)} on Venmo
      </a>

      <p className="text-center text-[0.82rem] mb-8" style={{ color: 'var(--text-secondary)' }}>
        Please allow some time for confirmation as we personally review each order. Thank you!
      </p>

      <Link
        href="/merch"
        className="block w-full py-4 px-6 font-semibold text-[0.88rem] uppercase tracking-[0.06em] text-center transition-all"
        style={{ color: 'var(--blue)', border: '1.5px solid var(--blue)', backgroundColor: 'transparent' }}
        onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--blue-light)'}
        onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        Back to Merch
      </Link>
    </div>
  );
}

export default function MerchConfirmationPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f6f4f0' }}>
      <div className="max-w-xl mx-auto px-6 pb-10">
        <div className="flex flex-col items-center overflow-hidden" style={{ marginBottom: '-30px' }}>
          <Link href="/">
            <Image
              src="/logo.svg"
              alt="Paige's Bagels"
              width={375}
              height={375}
              unoptimized
              className="w-auto h-auto max-w-[450px] cursor-pointer"
              style={{ marginTop: '-50px', marginBottom: '-70px' }}
              priority
            />
          </Link>
        </div>
        <nav className="flex overflow-x-auto gap-6 justify-center scrollbar-hide mb-8">
          <Link href="/about" className="whitespace-nowrap font-semibold tracking-widest transition-all hover:scale-105" style={{ color: '#004AAD' }}>ABOUT</Link>
          <Link href="/menu" className="whitespace-nowrap font-semibold tracking-widest transition-all hover:scale-105" style={{ color: '#004AAD' }}>MENU</Link>
          <Link href="/order" className="whitespace-nowrap font-semibold tracking-widest transition-all hover:scale-105" style={{ color: '#004AAD' }}>ORDER NOW</Link>
          <Link href="/merch" className="whitespace-nowrap font-semibold tracking-widest transition-all" style={{ color: '#1A1A1A', borderBottom: '2px solid #004AAD' }}>MERCH</Link>
          <Link href="/contact" className="whitespace-nowrap font-semibold tracking-widest transition-all hover:scale-105" style={{ color: '#004AAD' }}>CONTACT</Link>
        </nav>
        <Suspense fallback={<div className="text-center py-10"><p style={{ color: '#4A4A4A' }}>Loading...</p></div>}>
          <ConfirmationContent />
        </Suspense>
      </div>
    </div>
  );
}
