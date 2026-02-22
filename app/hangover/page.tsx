'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import NavBar from '@/components/NavBar';
import { BagelCounts, BagelType, Pricing, TimeSlotWithCapacity } from '@/types';
import { calculateTotal, calculateBundlePrice, isValidTotal, formatDate, formatTime } from '@/lib/utils';

// export const metadata kept as static export won't work in client component —
// move to layout or use generateMetadata if needed later

function getAvailableSlot(slots: TimeSlotWithCapacity[]): TimeSlotWithCapacity | null {
  const now = new Date();
  return (
    slots.find((slot) => {
      if (slot.remaining <= 0) return false;
      if (slot.cutoff_time && new Date(slot.cutoff_time) < now) return false;
      const slotDate = new Date(`${slot.date}T${slot.time}`);
      if (slotDate < now) return false;
      return true;
    }) ?? null
  );
}

function useCountdown(cutoffIso: string | null) {
  const [timeLeft, setTimeLeft] = useState('');
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!cutoffIso) return;
    const tick = () => {
      const diff = new Date(cutoffIso).getTime() - Date.now();
      if (diff <= 0) {
        setExpired(true);
        setTimeLeft('00:00');
        return;
      }
      const m = String(Math.floor(diff / 60000)).padStart(2, '0');
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
      setTimeLeft(`${m}:${s}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [cutoffIso]);

  return { timeLeft, expired };
}

function HangoverContent() {
  const router = useRouter();

  // Data
  const [slots, setSlots] = useState<TimeSlotWithCapacity[]>([]);
  const [bagelTypes, setBagelTypes] = useState<BagelType[]>([]);
  const [pricing, setPricing] = useState<Pricing[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [bagelCounts, setBagelCounts] = useState<BagelCounts>({});
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const checkoutRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/slots?hangover=true').then((r) => r.json()),
      fetch('/api/bagel-types').then((r) => r.json()),
      fetch('/api/pricing?type=hangover').then((r) => r.json()),
    ]).then(([slotsData, typesData, pricingData]) => {
      setSlots(slotsData);
      setBagelTypes(typesData);
      setPricing(pricingData);
      setLoading(false);
    });
  }, []);

  const availableSlot = getAvailableSlot(slots);
  const { timeLeft, expired } = useCountdown(availableSlot?.cutoff_time ?? null);

  const total = calculateTotal(bagelCounts);
  const price = calculateBundlePrice(total, pricing);
  const validTotal = isValidTotal(total);

  const updateCount = (id: string, delta: number) => {
    setBagelCounts((prev) => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      const newCounts = { ...prev, [id]: next };
      const newTotal = calculateTotal(newCounts);
      if (newTotal > 13) return prev;
      return newCounts;
    });
  };

  const handleSubmit = async () => {
    if (!availableSlot) return;
    if (!customerName.trim() || !customerEmail.trim() || !customerPhone.trim()) {
      setError('Please fill in all fields');
      return;
    }
    if (!validTotal || total === 0) {
      setError('Please select at least 1 bagel');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeSlotId: availableSlot.id,
          customerName,
          customerEmail,
          customerPhone,
          bagelCounts,
          addOnCounts: {},
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to create order');
        setSubmitting(false);
        return;
      }
      router.push(`/confirmation?orderId=${data.order.id}`);
    } catch {
      setError('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  // ── Loading ──
  if (loading) {
    return (
      <>
        <NavBar />
        <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
          <div
            className="w-8 h-8 border-4 rounded-full animate-spin"
            style={{ borderColor: 'var(--blue)', borderTopColor: 'transparent' }}
          />
        </div>
      </>
    );
  }

  // ── Empty state: no hangover slots ──
  if (!availableSlot || expired) {
    return (
      <>
        <NavBar />
        <div
          className="flex flex-col items-center justify-center text-center px-5"
          style={{ minHeight: 'calc(100vh - 68px)' }}
        >
          <h1
            className="text-3xl md:text-4xl font-bold mb-3"
            style={{ fontFamily: 'var(--font-playfair)', color: 'var(--blue)' }}
          >
            No Hangover Bagels Right Now
          </h1>
          <p className="mb-6" style={{ color: 'var(--text-secondary)', maxWidth: 400 }}>
            Hangover Bagels are available on weekends for a limited window. Check back next Saturday or Sunday morning!
          </p>
          <Link
            href="/order"
            className="px-8 py-3 font-semibold text-sm uppercase tracking-wider"
            style={{ backgroundColor: 'var(--blue)', color: '#fff' }}
          >
            Order Ahead &rarr;
          </Link>
        </div>
      </>
    );
  }

  // ── Main page ──
  const lineItems = bagelTypes.filter((bt) => (bagelCounts[bt.id] || 0) > 0);

  return (
    <>
      <NavBar />

      {/* ── Section 1: Blue Hero ── */}
      <section
        className="relative overflow-hidden px-5 py-16 md:py-24 text-center"
        style={{ backgroundColor: 'var(--blue)' }}
      >
        {/* Decorative circles */}
        <div
          className="absolute rounded-full"
          style={{
            width: 300,
            height: 300,
            top: -80,
            right: -60,
            backgroundColor: 'rgba(255,255,255,0.06)',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 200,
            height: 200,
            bottom: -40,
            left: -40,
            backgroundColor: 'rgba(255,255,255,0.04)',
          }}
        />

        <div className="relative z-10 max-w-lg mx-auto">
          {/* Limited Drop badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
            </span>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.9)' }}>
              Limited Drop
            </span>
          </div>

          <h1
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ fontFamily: 'var(--font-playfair)', color: '#fff' }}
          >
            Hangover<br />
            <em>Bagels.</em>
          </h1>

          <p className="text-base mb-8" style={{ color: 'rgba(255,255,255,0.65)' }}>
            Fresh sourdough ready in 1 hour. Order now, thank us later.
          </p>

          {/* Countdown */}
          <div className="inline-flex items-center gap-2 text-lg font-semibold" style={{ color: '#fbbf24' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Window closes in {timeLeft}
          </div>
        </div>
      </section>

      {/* ── Section 2: How It Works ── */}
      <section className="py-12 px-5">
        <div className="max-w-xl mx-auto flex items-start justify-center gap-0">
          {[
            { num: 1, label: 'Pick Your Bagels' },
            { num: 2, label: 'Checkout' },
            { num: 3, label: 'Pick Up in 1 Hr' },
          ].map((step, i) => (
            <div key={step.num} className="contents">
              {i > 0 && (
                <div className="flex-1 h-0.5 mt-5" style={{ backgroundColor: 'var(--border)' }} />
              )}
              <div className="flex flex-col items-center text-center" style={{ width: 120 }}>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mb-2"
                  style={{ backgroundColor: 'var(--blue-light)', color: 'var(--blue)' }}
                >
                  {step.num}
                </div>
                <span className="text-xs font-semibold" style={{ color: 'var(--text-dark)' }}>
                  {step.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 3: Availability Banner ── */}
      <section className="px-5 mb-8">
        <div
          className="max-w-2xl mx-auto flex items-center gap-3 px-5 py-4 rounded-lg"
          style={{ backgroundColor: 'var(--green-bg)', border: '1px solid rgba(21,128,61,0.2)' }}
        >
          <span className="relative flex h-3 w-3 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: 'var(--green)' }} />
            <span className="relative inline-flex rounded-full h-3 w-3" style={{ backgroundColor: 'var(--green)' }} />
          </span>
          <div>
            <p className="font-bold text-sm" style={{ color: 'var(--green)' }}>
              Hangover Window Open
            </p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {formatDate(availableSlot.date)} &middot; Pickup at {formatTime(availableSlot.time)}
            </p>
          </div>
        </div>
      </section>

      {/* ── Section 4: Bagel Selection ── */}
      <section className="px-5 mb-8">
        <div className="max-w-2xl mx-auto">
          <h2
            className="text-2xl font-bold mb-6"
            style={{ fontFamily: 'var(--font-playfair)', color: 'var(--blue)' }}
          >
            Choose Your Bagels
          </h2>

          <div className="flex flex-col gap-3">
            {bagelTypes.map((bt) => {
              const qty = bagelCounts[bt.id] || 0;
              const isActive = qty > 0;
              return (
                <div
                  key={bt.id}
                  className="flex items-center gap-4 p-4 rounded-lg transition-all"
                  style={{
                    backgroundColor: isActive ? 'var(--blue-light)' : 'var(--bg-card)',
                    border: isActive ? '2px solid var(--blue)' : '2px solid var(--border)',
                  }}
                >
                  {bt.image_url && (
                    <img
                      src={bt.image_url}
                      alt={bt.name}
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-bold text-base"
                      style={{ fontFamily: 'var(--font-playfair)', color: 'var(--text-dark)' }}
                    >
                      {bt.name}
                    </p>
                    {pricing.length > 0 && (
                      <p className="text-sm" style={{ color: 'var(--brown)' }}>
                        from ${pricing[pricing.length - 1]?.price?.toFixed(2)}/ea
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <button
                      onClick={() => updateCount(bt.id, -1)}
                      disabled={qty === 0}
                      className="w-9 h-9 rounded-full flex items-center justify-center text-lg font-bold transition-colors"
                      style={{
                        backgroundColor: qty === 0 ? 'var(--border)' : 'var(--blue)',
                        color: qty === 0 ? 'var(--text-secondary)' : '#fff',
                        cursor: qty === 0 ? 'not-allowed' : 'pointer',
                        border: 'none',
                      }}
                    >
                      &minus;
                    </button>
                    <span
                      className="w-6 text-center font-bold text-lg"
                      style={{ color: 'var(--text-dark)' }}
                    >
                      {qty}
                    </span>
                    <button
                      onClick={() => updateCount(bt.id, 1)}
                      disabled={total >= 13}
                      className="w-9 h-9 rounded-full flex items-center justify-center text-lg font-bold transition-colors"
                      style={{
                        backgroundColor: total >= 13 ? 'var(--border)' : 'var(--blue)',
                        color: total >= 13 ? 'var(--text-secondary)' : '#fff',
                        cursor: total >= 13 ? 'not-allowed' : 'pointer',
                        border: 'none',
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {total > 0 && (
            <p className="text-sm mt-3 text-right" style={{ color: 'var(--text-secondary)' }}>
              {total}/13 bagels selected
            </p>
          )}
        </div>
      </section>

      {/* ── Section 5: Order Summary ── */}
      {lineItems.length > 0 && (
        <section className="px-5 mb-8">
          <div
            className="max-w-2xl mx-auto p-5 rounded-lg"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <h3
              className="text-lg font-bold mb-4"
              style={{ fontFamily: 'var(--font-playfair)', color: 'var(--text-dark)' }}
            >
              Order Summary
            </h3>
            {lineItems.map((bt) => (
              <div key={bt.id} className="flex justify-between py-1.5">
                <span style={{ color: 'var(--text-dark)' }}>
                  {bt.name} &times; {bagelCounts[bt.id]}
                </span>
              </div>
            ))}
            <div
              className="flex justify-between pt-3 mt-3 font-bold"
              style={{ borderTop: '1px solid var(--border)', color: 'var(--text-dark)' }}
            >
              <span>Total ({total} bagels)</span>
              <span>${price.toFixed(2)}</span>
            </div>
          </div>
        </section>
      )}

      {/* ── Section 6: Customer Info ── */}
      <section className="px-5 mb-32" ref={checkoutRef}>
        <div className="max-w-2xl mx-auto">
          <h2
            className="text-2xl font-bold mb-6"
            style={{ fontFamily: 'var(--font-playfair)', color: 'var(--blue)' }}
          >
            Your Info
          </h2>

          <div className="flex flex-col gap-4">
            {[
              { label: 'Name', value: customerName, setter: setCustomerName, type: 'text', placeholder: 'Your name' },
              { label: 'Email', value: customerEmail, setter: setCustomerEmail, type: 'email', placeholder: 'you@example.com' },
              { label: 'Phone', value: customerPhone, setter: setCustomerPhone, type: 'tel', placeholder: '(555) 123-4567' },
            ].map((field) => (
              <div key={field.label}>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-dark)' }}>
                  {field.label}
                </label>
                <input
                  type={field.type}
                  value={field.value}
                  onChange={(e) => field.setter(e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full px-4 py-3 rounded-lg text-base outline-none transition-all"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '2px solid var(--border)',
                    color: 'var(--text-dark)',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--blue)')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                />
              </div>
            ))}
          </div>

          {error && (
            <p className="mt-4 text-sm font-medium" style={{ color: '#dc2626' }}>
              {error}
            </p>
          )}
        </div>
      </section>

      {/* ── Section 7: Sticky Checkout Bar ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 px-5 py-4"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderTop: '1px solid var(--border)',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
          paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
        }}
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <span className="font-bold" style={{ color: 'var(--text-dark)' }}>
            {total > 0 ? `${total} bagel${total !== 1 ? 's' : ''} · $${price.toFixed(2)}` : 'No bagels selected'}
          </span>
          <button
            onClick={handleSubmit}
            disabled={total === 0 || submitting}
            className="px-8 py-3 font-semibold text-sm uppercase tracking-wider transition-colors"
            style={{
              backgroundColor: total === 0 || submitting ? 'var(--border)' : 'var(--blue)',
              color: total === 0 || submitting ? 'var(--text-secondary)' : '#fff',
              cursor: total === 0 || submitting ? 'not-allowed' : 'pointer',
              border: 'none',
              borderRadius: 4,
            }}
          >
            {submitting ? 'Placing Order...' : 'Checkout →'}
          </button>
        </div>
      </div>
    </>
  );
}

export default function HangoverPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center" style={{ minHeight: '100vh' }}>
          <div
            className="w-8 h-8 border-4 rounded-full animate-spin"
            style={{ borderColor: 'var(--blue)', borderTopColor: 'transparent' }}
          />
        </div>
      }
    >
      <HangoverContent />
    </Suspense>
  );
}
