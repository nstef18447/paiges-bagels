'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { AddOnCounts, AddOnType, BagelCounts, BagelType, BiteFlavor, BiteFlavorCounts, BitePricing, TimeSlotWithCapacity, Pricing } from '@/types';
import NavBar from './NavBar';
import { calculateTotal, isValidTotal, calculateBundlePrice } from '@/lib/utils';
import BagelSelector from './BagelSelector';
import BiteSelector from './BiteSelector';
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
  const [biteFlavors, setBiteFlavors] = useState<BiteFlavor[]>([]);
  const [bitePricing, setBitePricing] = useState<BitePricing[]>([]);
  const [pricing, setPricing] = useState<Pricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [bagelCounts, setBagelCounts] = useState<BagelCounts>({});
  const [selectedBitePackSize, setSelectedBitePackSize] = useState<number | null>(null);
  const [biteFlavorCounts, setBiteFlavorCounts] = useState<BiteFlavorCounts>({});
  const [addOnCounts, setAddOnCounts] = useState<AddOnCounts>({});
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isDelivery, setIsDelivery] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [error, setError] = useState('');

  const DELIVERY_FEE = 20;

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

      const [slotsResponse, typesResponse, pricingResponse, addOnsResponse, biteFlavorsResponse, bitePricingResponse] = await Promise.all([
        fetch(slotsUrl),
        fetch('/api/bagel-types'),
        fetch(pricingUrl),
        fetch('/api/add-on-types'),
        fetch('/api/bite-flavors'),
        fetch('/api/bite-pricing'),
      ]);

      const slotsData = await slotsResponse.json();
      const typesData = await typesResponse.json();
      const pricingData = await pricingResponse.json();
      const addOnsData = await addOnsResponse.json();
      const biteFlavorsData = await biteFlavorsResponse.json();
      const bitePricingData = await bitePricingResponse.json();

      setSlots(slotsData);
      setBagelTypes(typesData);
      setPricing(pricingData);
      setAddOnTypes(Array.isArray(addOnsData) ? addOnsData : []);
      setBiteFlavors(Array.isArray(biteFlavorsData) ? biteFlavorsData : []);
      setBitePricing(Array.isArray(bitePricingData) ? bitePricingData : []);
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

  const biteTotalSelected = Object.values(biteFlavorCounts).reduce((sum, n) => sum + n, 0);
  const activePackSizes = bitePricing.filter((p) => p.active).map((p) => p.pack_size);
  const biteMatchedPack = bitePricing.find((p) => p.active && p.pack_size === biteTotalSelected);
  const biteSubtotal = biteMatchedPack?.price || 0;
  const bitesStarted = biteTotalSelected > 0;
  const bitesValid = !bitesStarted || activePackSizes.includes(biteTotalSelected);

  const deliveryFee = isDelivery ? DELIVERY_FEE : 0;
  const price = calculatePrice(total) + addOnSubtotal + biteSubtotal + deliveryFee;

  // Order is valid if they have bagels, valid bites, or both
  const hasBagels = total > 0 && isValidTotal(total);
  const hasValidBites = bitesStarted && bitesValid;
  const hasValidItems = hasBagels || hasValidBites;
  // Bagels at invalid count (1-13 range violated) only blocks if they started adding bagels
  const bagelsInvalid = total > 0 && !isValidTotal(total);

  // Determine current step based on what's been filled
  const currentStep = !selectedSlotId ? 1 : !hasValidItems ? 2 : 3;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedSlotId) {
      setError('Please select a pickup time');
      return;
    }

    if (bagelsInvalid) {
      setError('Please select between 1 and 13 bagels');
      return;
    }

    if (!hasValidItems) {
      setError('Please select some bagels or a pack of bites');
      return;
    }

    if (!customerName || !customerEmail || !customerPhone) {
      setError('Please fill in all customer information');
      return;
    }

    if (isDelivery && !deliveryAddress.trim()) {
      setError('Please enter your delivery address');
      return;
    }

    if (!bitesValid) {
      setError(`Please select exactly ${selectedBitePackSize} bites to complete your bite pack`);
      return;
    }

    setSubmitting(true);

    // Build bites payload if bites were selected
    let bitesPayload = null;
    if (bitesValid && biteTotalSelected > 0 && biteMatchedPack) {
      const flavorMap: { [slug: string]: number } = {};
      const flavorNames: { [slug: string]: string } = {};
      for (const flavor of biteFlavors) {
        flavorMap[flavor.slug] = biteFlavorCounts[flavor.id] || 0;
        flavorNames[flavor.slug] = flavor.name;
      }
      bitesPayload = {
        pack_size: biteMatchedPack.pack_size,
        price: biteMatchedPack.price,
        flavors: flavorMap,
        flavor_names: flavorNames,
      };
    }

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
          bites: bitesPayload,
          delivery: isDelivery ? { address: deliveryAddress.trim(), fee: DELIVERY_FEE } : null,
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
              requiredBites={bitesValid ? biteTotalSelected : 0}
            />
          </section>

          {/* Step 2: Bagel Selection */}
          <section ref={bagelsRef} className="mt-10">
            <h2
              className="text-lg font-bold mb-4 pb-2"
              style={{
                color: 'var(--blue)',
                fontFamily: 'var(--font-playfair)',
                borderBottom: `2px solid ${accent}`
              }}
            >
              {isHangover ? 'Hangover Bagels' : "Paige\u2019s Bagels"}
            </h2>

            {/* Pricing cards */}
            {pricing.length > 0 && (
              <div className={`grid gap-3 mb-4 ${pricing.length <= 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'}`}>
                {pricing.map((item) => {
                  const label = item.label || `${item.bagel_quantity} ${item.bagel_quantity === 1 ? 'Bagel' : 'Bagels'}`;
                  const mainLabel = label.replace(/\s*\(.+\)$/, '');
                  return (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg text-center"
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: '2px solid #E5E0DB',
                      }}
                    >
                      <div
                        className="text-lg font-bold"
                        style={{ color: '#1A1A1A' }}
                      >
                        {mainLabel}
                      </div>
                      <div
                        className="text-base font-semibold"
                        style={{ color: '#6B6B6B' }}
                      >
                        ${item.price.toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <BagelSelector
              bagelTypes={bagelTypes}
              counts={bagelCounts}
              onChange={setBagelCounts}
              maxTotal={13}
            />
          </section>

          {/* Paige's Bites */}
          {biteFlavors.length > 0 && bitePricing.filter((p) => p.active).length > 0 && (
            <section className="mt-10">
              <h2
                className="text-lg font-bold mb-4 pb-2"
                style={{
                  color: 'var(--blue)',
                  fontFamily: 'var(--font-playfair)',
                  borderBottom: `2px solid ${accent}`
                }}
              >
                Paige&apos;s Bites
              </h2>
              <BiteSelector
                biteFlavors={biteFlavors}
                bitePricing={bitePricing}
                selectedPackSize={selectedBitePackSize}
                onPackSizeChange={setSelectedBitePackSize}
                flavorCounts={biteFlavorCounts}
                onFlavorCountsChange={setBiteFlavorCounts}
              />
            </section>
          )}

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

          {/* Delivery Option */}
          <section className="mt-10">
            <h2
              className="text-lg font-bold mb-4 pb-2"
              style={{
                color: 'var(--blue)',
                fontFamily: 'var(--font-playfair)',
                borderBottom: `2px solid ${accent}`
              }}
            >
              Delivery
            </h2>

            <button
              type="button"
              onClick={() => { setIsDelivery(!isDelivery); setDeliveryAddress(''); }}
              className="w-full text-left rounded-[10px] p-4 md:p-5 transition-all duration-200 cursor-pointer active:scale-[0.98]"
              style={{
                background: isDelivery ? 'var(--blue-light)' : 'var(--bg-card)',
                border: isDelivery ? '1.5px solid var(--blue)' : '1.5px solid var(--border)',
                boxShadow: isDelivery ? '0 0 0 3px rgba(0, 74, 173, 0.12)' : 'none',
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[1.05rem] font-bold" style={{ color: 'var(--blue)' }}>
                    Delivery
                  </div>
                  <div className="text-[0.82rem] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    We&apos;ll get your bagels right to your door · from $20.00
                  </div>
                </div>
                {isDelivery ? (
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: 'var(--blue)' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                    </svg>
                  </span>
                ) : (
                  <span
                    className="w-5 h-5 rounded-full flex-shrink-0"
                    style={{ border: '2px solid var(--border)' }}
                  />
                )}
              </div>
            </button>

            {isDelivery && (
              <div className="mt-4">
                <label
                  htmlFor="deliveryAddress"
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--text-medium)' }}
                >
                  Delivery Address
                </label>
                <input
                  type="text"
                  id="deliveryAddress"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="123 W 4th St, Apt 2, New York, NY 10012"
                  className="w-full px-4 py-3 rounded-lg transition-all"
                  style={{
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg-card)',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = focusBorder}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                />
                <p className="text-[0.78rem] mt-2" style={{ color: 'var(--text-secondary)' }}>
                  Delivery starts at $20.00. Paige will confirm the final delivery price with you based on your address.
                </p>
              </div>
            )}
          </section>

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
          {hasValidItems && (
            <div
              className="p-5 rounded-lg mt-10"
              style={{
                backgroundColor: 'var(--green-bg)',
                border: '1px solid #C8DFC9'
              }}
            >
              {isDelivery && (
                <div className="flex justify-between items-center mb-2 pb-2" style={{ borderBottom: '1px solid #C8DFC9' }}>
                  <span className="text-sm" style={{ color: '#2D5A3D' }}>Delivery (from)</span>
                  <span className="text-sm font-semibold" style={{ color: '#2D5A3D' }}>+$20.00</span>
                </div>
              )}
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
            disabled={submitting || !hasValidItems || bagelsInvalid || !bitesValid}
            className="w-full py-4 px-6 font-semibold text-[0.9rem] uppercase tracking-[0.06em] transition-all mt-8"
            style={{
              backgroundColor: submitting || !hasValidItems || bagelsInvalid || !bitesValid ? '#D1D1D1' : buttonColor,
              color: submitting || !hasValidItems || bagelsInvalid || !bitesValid ? '#8A8A8A' : '#FFFFFF',
              cursor: submitting || !hasValidItems || bagelsInvalid || !bitesValid ? 'not-allowed' : 'pointer'
            }}
            onMouseOver={(e) => {
              if (!submitting && hasValidItems && !bagelsInvalid && bitesValid) {
                e.currentTarget.style.backgroundColor = buttonHover;
              }
            }}
            onMouseOut={(e) => {
              if (!submitting && hasValidItems && !bagelsInvalid && bitesValid) {
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
          transform: selectedSlotId && !hasValidItems ? 'translateY(0)' : 'translateY(100%)',
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
