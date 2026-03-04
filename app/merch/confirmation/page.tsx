'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { MerchOrder } from '@/types';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [order, setOrder] = useState<MerchOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [pollCount, setPollCount] = useState(0);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const res = await fetch('/api/merch/orders');
        const orders: MerchOrder[] = await res.json();
        const found = orders.find(o => o.stripe_session_id === sessionId);
        if (found) {
          setOrder(found);
          // If still pending, poll a few more times
          if (found.status === 'pending_payment' && pollCount < 10) {
            setTimeout(() => setPollCount(c => c + 1), 2000);
          } else {
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      } catch {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [sessionId, pollCount]);

  // Stop loading once we have a non-pending order
  useEffect(() => {
    if (order && order.status !== 'pending_payment') {
      setLoading(false);
    }
  }, [order]);

  if (!sessionId) {
    return (
      <div className="text-center py-10">
        <p className="text-lg" style={{ color: '#4A4A4A' }}>No session found.</p>
        <Link href="/merch" className="mt-4 inline-block font-semibold" style={{ color: '#004AAD' }}>
          Back to Merch
        </Link>
      </div>
    );
  }

  if (loading && !order) {
    return (
      <div className="text-center py-10">
        <p className="text-lg" style={{ color: '#4A4A4A' }}>Loading your order...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-10">
        <p className="text-lg" style={{ color: '#4A4A4A' }}>Order not found.</p>
        <Link href="/merch" className="mt-4 inline-block font-semibold" style={{ color: '#004AAD' }}>
          Back to Merch
        </Link>
      </div>
    );
  }

  return (
    <div>
      {order.status === 'pending_payment' ? (
        <div className="text-center py-6">
          <p className="text-lg" style={{ color: '#F59E0B' }}>Processing your payment...</p>
        </div>
      ) : (
        <div
          className="rounded-lg p-6 mb-6"
          style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E0DB' }}
        >
          <div className="text-center mb-6">
            <span className="text-5xl">🎉</span>
            <h2 className="text-2xl font-bold mt-2" style={{ color: '#1A1A1A' }}>
              Order Confirmed!
            </h2>
            <p className="mt-2" style={{ color: '#4A4A4A' }}>
              Thanks for your order, {order.customer_name}!
            </p>
            <p style={{ color: '#6B6B6B' }}>
              We&apos;ll ship your merch soon!
            </p>
          </div>

          <div className="mb-4">
            <h3 className="font-bold mb-2" style={{ color: '#1A1A1A' }}>Items Ordered</h3>
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm mb-1" style={{ color: '#4A4A4A' }}>
                <span>{item.name}{item.size ? ` (${item.size})` : ''} x{item.quantity}</span>
                <span>${(item.unit_price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="mb-4 pt-3" style={{ borderTop: '1px solid #E5E0DB' }}>
            <h3 className="font-bold mb-2" style={{ color: '#1A1A1A' }}>Shipping To</h3>
            <p className="text-sm" style={{ color: '#4A4A4A' }}>
              {order.shipping_address}<br />
              {order.shipping_city}, {order.shipping_state} {order.shipping_zip}
            </p>
          </div>

          <div className="pt-3" style={{ borderTop: '1px solid #E5E0DB' }}>
            <div className="flex justify-between text-sm mb-1" style={{ color: '#4A4A4A' }}>
              <span>Shipping</span>
              <span>${order.shipping_cost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg" style={{ color: '#1A1A1A' }}>
              <span>Total</span>
              <span>${order.total_price.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      <Link
        href="/merch"
        className="block w-full py-4 px-6 font-semibold rounded-lg text-center transition-all text-white"
        style={{ backgroundColor: '#004AAD' }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#003A8C'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#004AAD'}
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
        {/* Logo Section */}
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

        {/* Navigation */}
        <nav className="flex overflow-x-auto gap-6 justify-center scrollbar-hide mb-8">
          <Link href="/about" className="whitespace-nowrap font-semibold tracking-widest transition-all hover:scale-105" style={{ color: '#004AAD' }}>
            ABOUT
          </Link>
          <Link href="/menu" className="whitespace-nowrap font-semibold tracking-widest transition-all hover:scale-105" style={{ color: '#004AAD' }}>
            MENU
          </Link>
          <Link href="/order" className="whitespace-nowrap font-semibold tracking-widest transition-all hover:scale-105" style={{ color: '#004AAD' }}>
            ORDER NOW
          </Link>
          <Link href="/merch" className="whitespace-nowrap font-semibold tracking-widest transition-all" style={{ color: '#1A1A1A', borderBottom: '2px solid #004AAD' }}>
            MERCH
          </Link>
          <Link href="/contact" className="whitespace-nowrap font-semibold tracking-widest transition-all hover:scale-105" style={{ color: '#004AAD' }}>
            CONTACT
          </Link>
        </nav>

        <Suspense fallback={
          <div className="text-center py-10">
            <p className="text-lg" style={{ color: '#4A4A4A' }}>Loading...</p>
          </div>
        }>
          <ConfirmationContent />
        </Suspense>
      </div>
    </div>
  );
}
