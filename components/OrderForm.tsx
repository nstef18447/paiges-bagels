'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { AddOnCounts, AddOnType, BagelCounts, BagelType, TimeSlotWithCapacity, Pricing } from '@/types';
import { calculateTotal, isValidTotal, calculateBundlePrice } from '@/lib/utils';
import BagelSelector from './BagelSelector';
import AddOnSelector from './AddOnSelector';
import TimeSlotSelector from './TimeSlotSelector';

export default function OrderForm() {
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [slotsResponse, typesResponse, pricingResponse, addOnsResponse] = await Promise.all([
        fetch('/api/slots'),
        fetch('/api/bagel-types'),
        fetch('/api/pricing'),
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

  // Calculate price using greedy bundle algorithm
  const calculatePrice = (total: number): number => {
    return calculateBundlePrice(total, pricing);
  };

  const addOnSubtotal = addOnTypes.reduce((sum, type) => {
    return sum + (addOnCounts[type.id] || 0) * type.price;
  }, 0);

  const price = calculatePrice(total) + addOnSubtotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedSlotId) {
      setError('Please select a pickup time');
      return;
    }

    if (!isValidTotal(total)) {
      setError('Please select between 1 and 6 bagels');
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

      // Redirect to confirmation page
      router.push(`/confirmation?orderId=${data.order.id}`);
    } catch (err) {
      setError('An error occurred. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen" style={{ backgroundColor: '#f6f4f0' }}>
        <div className="text-lg" style={{ color: '#4A4A4A' }}>Loading...</div>
      </div>
    );
  }

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
        <nav className="flex justify-center gap-8 mb-10">
          <Link
            href="/about"
            className="font-semibold tracking-widest transition-all hover:scale-105"
            style={{ color: '#004AAD' }}
          >
            ABOUT
          </Link>
          <Link
            href="/order"
            className="font-semibold tracking-widest transition-all"
            style={{ color: '#1A1A1A', borderBottom: '2px solid #004AAD' }}
          >
            ORDER
          </Link>
          <Link
            href="/contact"
            className="font-semibold tracking-widest transition-all hover:scale-105"
            style={{ color: '#004AAD' }}
          >
            CONTACT
          </Link>
        </nav>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Pickup Time Section */}
          <section>
            <h2
              className="text-2xl mb-4 pb-2"
              style={{
                color: '#1A1A1A',
                borderBottom: '2px solid #004AAD'
              }}
            >
              Select Pickup Time
            </h2>
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
              className="rounded-lg p-6"
              style={{
                backgroundColor: '#E8EDF5',
                border: '1px solid #D4DCE8'
              }}
            >
              <h2
                className="text-2xl mb-4 text-center"
                style={{ color: '#1A1A1A' }}
              >
                Our Pricing
              </h2>
              <div className="grid grid-cols-3 gap-4">
                {pricing.map((item) => (
                  <div
                    key={item.id}
                    className="text-center p-3 rounded-lg"
                    style={{ backgroundColor: 'rgba(255,255,255,0.7)' }}
                  >
                    <div
                      className="font-semibold text-sm mb-1"
                      style={{ color: '#4A4A4A' }}
                    >
                      {item.label || `${item.bagel_quantity} ${item.bagel_quantity === 1 ? 'Bagel' : 'Bagels'}`}
                    </div>
                    <div
                      className="text-2xl font-bold"
                      style={{ color: '#004AAD' }}
                    >
                      ${item.price.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Bagel Selection Section */}
          <section>
            <h2
              className="text-2xl mb-4 pb-2"
              style={{
                color: '#1A1A1A',
                borderBottom: '2px solid #004AAD'
              }}
            >
              Choose Your Bagels
            </h2>
            <BagelSelector
              bagelTypes={bagelTypes}
              counts={bagelCounts}
              onChange={setBagelCounts}
              maxTotal={6}
            />
          </section>

          {/* Add-Ons Section */}
          {addOnTypes.length > 0 && (
            <section>
              <h2
                className="text-2xl mb-4 pb-2"
                style={{
                  color: '#1A1A1A',
                  borderBottom: '2px solid #004AAD'
                }}
              >
                Add-Ons <span className="text-lg italic font-normal">(on the side)</span>
              </h2>
              <AddOnSelector
                addOnTypes={addOnTypes}
                counts={addOnCounts}
                onChange={setAddOnCounts}
              />
            </section>
          )}

          {/* Customer Information Section */}
          <section>
            <h2
              className="text-2xl mb-4 pb-2"
              style={{
                color: '#1A1A1A',
                borderBottom: '2px solid #004AAD'
              }}
            >
              Your Information
            </h2>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium mb-2"
                  style={{ color: '#4A4A4A' }}
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
                    border: '1px solid #E5E0DB',
                    backgroundColor: '#FFFFFF',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#004AAD'}
                  onBlur={(e) => e.target.style.borderColor = '#E5E0DB'}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium mb-2"
                  style={{ color: '#4A4A4A' }}
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
                    border: '1px solid #E5E0DB',
                    backgroundColor: '#FFFFFF',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#004AAD'}
                  onBlur={(e) => e.target.style.borderColor = '#E5E0DB'}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium mb-2"
                  style={{ color: '#4A4A4A' }}
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
                    border: '1px solid #E5E0DB',
                    backgroundColor: '#FFFFFF',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#004AAD'}
                  onBlur={(e) => e.target.style.borderColor = '#E5E0DB'}
                  required
                />
              </div>
            </div>
          </section>

          {/* Order Total */}
          {total > 0 && isValidTotal(total) && (
            <div
              className="p-5 rounded-lg"
              style={{
                backgroundColor: '#F0F7F1',
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
                  style={{ color: '#4A7C59' }}
                >
                  ${price.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div
              className="p-4 rounded-lg"
              style={{
                backgroundColor: '#FDF2F2',
                border: '1px solid #F5C6C6',
                color: '#C75050'
              }}
            >
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || !isValidTotal(total)}
            className="w-full py-4 px-6 font-semibold rounded-lg transition-all"
            style={{
              backgroundColor: submitting || !isValidTotal(total) ? '#D1D1D1' : '#004AAD',
              color: submitting || !isValidTotal(total) ? '#8A8A8A' : '#FFFFFF',
              cursor: submitting || !isValidTotal(total) ? 'not-allowed' : 'pointer'
            }}
            onMouseOver={(e) => {
              if (!submitting && isValidTotal(total)) {
                e.currentTarget.style.backgroundColor = '#003A8C';
              }
            }}
            onMouseOut={(e) => {
              if (!submitting && isValidTotal(total)) {
                e.currentTarget.style.backgroundColor = '#004AAD';
              }
            }}
          >
            {submitting ? 'Placing Order...' : 'Place Order'}
          </button>

        </form>
      </div>
    </div>
  );
}
