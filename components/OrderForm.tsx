'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { AddOnCounts, AddOnType, BagelCounts, BagelType, TimeSlotWithCapacity, Pricing } from '@/types';
import NavBar from './NavBar';
import { calculateTotal, isValidTotal, calculateBundlePrice } from '@/lib/utils';
import BagelSelector from './BagelSelector';
import AddOnSelector from './AddOnSelector';
import TimeSlotSelector from './TimeSlotSelector';

interface OrderFormProps {
  mode?: 'regular' | 'hangover';
}

function StepIndicator({ currentStep }: { currentStep: number }) {
  const steps = [
    { num: 1, label: 'Time' },
    { num: 2, label: 'Bagels' },
    { num: 3, label: 'Checkout' },
  ];

  return (
    <div
      className="sticky z-30 flex items-center justify-center gap-0 py-3 -mx-5 md:-mx-10 px-5 md:px-10"
      style={{
        top: '68px',
        backgroundColor: 'var(--bg)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {steps.map((step, i) => {
        const isActive = step.num === currentStep;
        const isCompleted = step.num < currentStep;
        return (
          <div key={step.num} className="contents">
            {i > 0 && (
              <div
                className="w-10 md:w-[60px] h-0.5 mx-3"
                style={{ backgroundColor: isCompleted ? 'var(--green)' : 'var(--border)' }}
              />
            )}
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={{
                  backgroundColor: isActive ? 'var(--blue)' : isCompleted ? 'var(--green)' : 'transparent',
                  borderColor: isActive ? 'var(--blue)' : isCompleted ? 'var(--green)' : 'var(--border)',
                  border: '2px solid',
                  color: isActive || isCompleted ? '#fff' : 'var(--text-secondary)',
                }}
              >
                {isCompleted ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                  </svg>
                ) : (
                  step.num
                )}
              </div>
              <span
                className="text-xs font-semibold uppercase tracking-[0.05em]"
                style={{
                  color: isActive ? 'var(--blue)' : isCompleted ? 'var(--green)' : 'var(--text-secondary)',
                }}
              >
                {step.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function OrderForm({ mode = 'regular' }: OrderFormProps) {
  const router = useRouter();
  const [slots, setSlots] = useState<TimeSlotWithCapacity[]>([]);
  const [bagelTypes, setBagelTypes] = useState<BagelType[]>([]);
  const [addOnTypes, setAddOnTypes] = useState<AddOnType[]>([]);
  const [pricing, setPricing] = useState<Pricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [bagelCounts, setBagelCounts] = useState<BagelCounts>({});
  const [addOnCounts, setAddOnCounts] = useState<AddOnCounts>({});
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [error, setError] = useState('');

  const bagelsRef = useRef<HTMLElement>(null);
  const checkoutRef = useRef<HTMLElement>(null);

  const isHangover = mode === 'hangover';

  // Colors by mode
  const accent = isHangover ? '#F59E0B' : 'var(--blue)';
  const buttonColor = isHangover ? '#EA580C' : 'var(--blue)';
  const buttonHover = isHangover ? '#C2410C' : 'var(--blue-hover)';
  const bgColor = isHangover ? '#FFFBF5' : 'var(--bg)';
  const focusBorder = isHangover ? '#F59E0B' : 'var(--blue)';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const slotsUrl = isHangover ? '/api/slots?hangover=true' : '/api/slots?hangover=false';
      const pricingUrl = isHangover ? '/api/pricing?type=hangover' : '/api/pricing?type=regular';

      const [slotsResponse, typesResponse, pricingResponse, addOnsResponse] = await Promise.all([
        fetch(slotsUrl),
        fetch('/api/bagel-types'),
        fetch(pricingUrl),
        fetch('/api/add-on-types'),
      ]);

      const slotsData = await slotsResponse.json();
      const typesData = await typesResponse.json();
      const pricingData = await pricingResponse.json();
      const addOnsData = await addOnsResponse.json();

      setSlots(slotsData);
      setBagelTypes(typesData);
      setPricing(pricingData);
      setAddOnTypes(Array.isArray(addOnsData) ? addOnsData : []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const total = calculateTotal(bagelCounts);

  const calculatePrice = (total: number): number => {
    return calculateBundlePrice(total, pricing);
  };

  const addOnSubtotal = addOnTypes.reduce((sum, type) => {
    return sum + (addOnCounts[type.id] || 0) * type.price;
  }, 0);

  const price = calculatePrice(total) + addOnSubtotal;

  // Determine current step based on what's been filled
  const currentStep = !selectedSlotId ? 1 : !isValidTotal(total) ? 2 : 3;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedSlotId) {
      setError('Please select a pickup time');
      return;
    }

    if (!isValidTotal(total)) {
      setError('Please select between 1 and 13 bagels');
      return;
    }

    if (!customerName || !customerEmail || !customerPhone) {
      setError('Please fill in all customer information');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeSlotId: selectedSlotId,
          customerName,
          customerEmail,
          customerPhone,
          bagelCounts,
          addOnCounts,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create order');
        setSubmitting(false);
        return;
      }

      router.push(`/confirmation?orderId=${data.order.id}`);
    } catch (err) {
      setError('An error occurred. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen" style={{ backgroundColor: bgColor }}>
        <div className="text-lg" style={{ color: 'var(--text-medium)' }}>Loading...</div>
      </div>
    );
  }

  // Hangover empty state
  if (isHangover && slots.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ backgroundColor: bgColor }}>
        <Link href="/">
          <Image
            src="/logo.svg"
            alt="Paige's Bagels"
            width={200}
            height={200}
            unoptimized
            className="w-auto h-auto max-w-[250px] cursor-pointer mb-4"
            priority
          />
        </Link>
        <h1
          className="text-3xl font-bold mb-3 text-center"
          style={{ color: '#92400E' }}
        >
          No Hangover Bagels Right Now
        </h1>
        <p
          className="text-lg text-center mb-8"
          style={{ color: '#B45309' }}
        >
          Check back soon — or order ahead for the next pickup!
        </p>
        <Link
          href="/order"
          className="px-8 py-3 font-semibold rounded-lg transition-all text-white"
          style={{ backgroundColor: 'var(--blue)' }}
        >
          Order Ahead
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: bgColor }}>
      {/* Hangover hero banner */}
      {isHangover && (
        <div
          className="w-full py-10 text-center"
          style={{ backgroundColor: '#F59E0B' }}
        >
          <Link href="/">
            <Image
              src="/logo-transparent.svg"
              alt="Paige's Bagels"
              width={350}
              height={350}
              unoptimized
              className="w-auto h-auto max-w-[350px] cursor-pointer mx-auto mb-2"
              priority
            />
          </Link>
          <h1
            className="text-6xl font-black tracking-tight text-center mb-3 uppercase"
            style={{ color: '#FFFFFF', letterSpacing: '-0.02em' }}
          >
            HANGOVER BAGELS
          </h1>
          <p
            className="text-xl font-medium text-center mb-1"
            style={{ color: '#FFFBEB' }}
          >
            Need bagels NOW? We got you.
          </p>
          <p
            className="text-base text-center mb-5"
            style={{ color: '#FEF3C7' }}
          >
            Fresh sourdough ready in 1 hour. Order now, thank us later.
          </p>
          <Link
            href="/order"
            className="text-sm font-medium transition-all hover:underline"
            style={{ color: '#FFFFFF' }}
          >
            or order ahead &rarr;
          </Link>
        </div>
      )}

      {/* NavBar for regular mode */}
      {!isHangover && <NavBar />}

      {/* Page Header */}
      <div
        className="text-center px-5 py-8 md:py-12"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <h1
          className="text-[2rem] md:text-[2.5rem] font-black mb-2"
          style={{ color: 'var(--blue)', fontFamily: 'var(--font-playfair)' }}
        >
          {isHangover ? 'Order Now' : 'Place Your Order'}
        </h1>
        <p className="text-[0.92rem]" style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Select a pickup time and we&apos;ll have your bagels ready.
        </p>
      </div>

      {/* Order container */}
      <div className="max-w-[640px] mx-auto px-5 md:px-10 pb-20 md:pb-24">
        {/* Step indicator */}
        {!isHangover && <StepIndicator currentStep={currentStep} />}

        <form onSubmit={handleSubmit}>
          {/* Step 1: Pickup Time */}
          <section className="mt-8">
            <TimeSlotSelector
              slots={slots}
              selectedSlotId={selectedSlotId}
              onChange={setSelectedSlotId}
              requiredCapacity={total}
            />
          </section>

          {/* Pricing Section */}
          {pricing.length > 0 && (
            <section
              ref={bagelsRef}
              className="rounded-lg p-6 mt-10"
              style={{
                backgroundColor: isHangover ? '#FFF7ED' : 'var(--blue-light)',
                border: isHangover ? '1px solid #FED7AA' : '1px solid var(--border)'
              }}
            >
              <h2
                className="text-2xl mb-4 text-center"
                style={{ color: 'var(--text-dark)', fontFamily: 'var(--font-playfair)' }}
              >
                {isHangover ? 'Hangover Pricing' : 'Our Pricing'}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {pricing.map((item) => (
                  <div
                    key={item.id}
                    className="text-center p-3 rounded-lg"
                    style={{ backgroundColor: 'rgba(255,255,255,0.7)' }}
                  >
                    <div
                      className="font-semibold text-sm mb-1"
                      style={{ color: 'var(--text-medium)' }}
                    >
                      {(() => {
                        const label = item.label || `${item.bagel_quantity} ${item.bagel_quantity === 1 ? 'Bagel' : 'Bagels'}`;
                        const match = label.match(/^(.+?)\s*(\(.+\))$/);
                        if (match) {
                          return <>{match[1]}<br /><span className="text-xs font-normal">{match[2]}</span></>;
                        }
                        return label;
                      })()}
                    </div>
                    <div
                      className="text-2xl font-bold"
                      style={{ color: accent }}
                    >
                      ${item.price.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
              {isHangover && (
                <p
                  className="text-xs text-center mt-3"
                  style={{ color: '#92400E' }}
                >
                  Convenience pricing — order ahead and save!
                </p>
              )}
            </section>
          )}

          {/* Step 2: Bagel Selection */}
          <section className="mt-10">
            <h2
              className="text-lg font-bold mb-4 pb-2"
              style={{
                color: 'var(--blue)',
                fontFamily: 'var(--font-playfair)',
                borderBottom: `2px solid ${accent}`
              }}
            >
              Choose Your Bagels
            </h2>
            <BagelSelector
              bagelTypes={bagelTypes}
              counts={bagelCounts}
              onChange={setBagelCounts}
              maxTotal={13}
            />
          </section>

          {/* Add-Ons */}
          {addOnTypes.length > 0 && (
            <section className="mt-10">
              <h2
                className="text-lg font-bold mb-4 pb-2"
                style={{
                  color: 'var(--blue)',
                  fontFamily: 'var(--font-playfair)',
                  borderBottom: `2px solid ${accent}`
                }}
              >
                Add-Ons <span className="text-base italic font-normal">(on the side)</span>
              </h2>
              <AddOnSelector
                addOnTypes={addOnTypes}
                counts={addOnCounts}
                onChange={setAddOnCounts}
              />
            </section>
          )}

          {/* Step 3: Customer Information */}
          <section ref={checkoutRef} className="mt-10">
            <h2
              className="text-lg font-bold mb-4 pb-2"
              style={{
                color: 'var(--blue)',
                fontFamily: 'var(--font-playfair)',
                borderBottom: `2px solid ${accent}`
              }}
            >
              Your Information
            </h2>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--text-medium)' }}
                >
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg transition-all"
                  style={{
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg-card)',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = focusBorder}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--text-medium)' }}
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg transition-all"
                  style={{
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg-card)',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = focusBorder}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--text-medium)' }}
                >
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg transition-all"
                  style={{
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg-card)',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = focusBorder}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                  required
                />
              </div>
            </div>
          </section>

          {/* Order Total */}
          {total > 0 && isValidTotal(total) && (
            <div
              className="p-5 rounded-lg mt-10"
              style={{
                backgroundColor: 'var(--green-bg)',
                border: '1px solid #C8DFC9'
              }}
            >
              <div className="flex justify-between items-center">
                <span
                  className="text-lg"
                  style={{ color: '#2D5A3D' }}
                >
                  Order Total
                </span>
                <span
                  className="text-3xl font-bold"
                  style={{ color: 'var(--success)' }}
                >
                  ${price.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              className="p-4 rounded-lg mt-6"
              style={{
                backgroundColor: 'var(--red-bg)',
                border: '1px solid #F5C6C6',
                color: 'var(--error)'
              }}
            >
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || !isValidTotal(total)}
            className="w-full py-4 px-6 font-semibold text-[0.9rem] uppercase tracking-[0.06em] transition-all mt-8"
            style={{
              backgroundColor: submitting || !isValidTotal(total) ? '#D1D1D1' : buttonColor,
              color: submitting || !isValidTotal(total) ? '#8A8A8A' : '#FFFFFF',
              cursor: submitting || !isValidTotal(total) ? 'not-allowed' : 'pointer'
            }}
            onMouseOver={(e) => {
              if (!submitting && isValidTotal(total)) {
                e.currentTarget.style.backgroundColor = buttonHover;
              }
            }}
            onMouseOut={(e) => {
              if (!submitting && isValidTotal(total)) {
                e.currentTarget.style.backgroundColor = buttonColor;
              }
            }}
          >
            {submitting
              ? 'Placing Order...'
              : isHangover
                ? 'I Need These Bagels!'
                : 'Place Order'}
          </button>
        </form>
      </div>

      {/* Sticky continue bar — visible when slot selected but bagels not yet chosen */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 flex justify-center border-t transition-transform duration-300"
        style={{
          backgroundColor: 'var(--bg)',
          borderColor: 'var(--border)',
          padding: '16px 20px',
          paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
          transform: selectedSlotId && !isValidTotal(total) ? 'translateY(0)' : 'translateY(100%)',
        }}
      >
        <button
          type="button"
          onClick={() => bagelsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          className="w-full max-w-[640px] py-4 font-semibold text-[0.9rem] uppercase tracking-[0.06em] flex items-center justify-center gap-2 transition-all cursor-pointer"
          style={{ backgroundColor: 'var(--blue)', color: '#fff' }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--blue-hover)'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--blue)'}
        >
          Continue to Bagels
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
            <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
