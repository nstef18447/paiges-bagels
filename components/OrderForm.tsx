'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { BagelCounts, BagelType, TimeSlotWithCapacity, Pricing } from '@/types';
import { calculateTotal, isValidTotal } from '@/lib/utils';
import BagelSelector from './BagelSelector';
import TimeSlotSelector from './TimeSlotSelector';

export default function OrderForm() {
  const router = useRouter();
  const [slots, setSlots] = useState<TimeSlotWithCapacity[]>([]);
  const [bagelTypes, setBagelTypes] = useState<BagelType[]>([]);
  const [pricing, setPricing] = useState<Pricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [bagelCounts, setBagelCounts] = useState<BagelCounts>({});
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [slotsResponse, typesResponse, pricingResponse] = await Promise.all([
        fetch('/api/slots'),
        fetch('/api/bagel-types'),
        fetch('/api/pricing'),
      ]);

      const slotsData = await slotsResponse.json();
      const typesData = await typesResponse.json();
      const pricingData = await pricingResponse.json();

      setSlots(slotsData);
      setBagelTypes(typesData);
      setPricing(pricingData);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const total = calculateTotal(bagelCounts);

  // Calculate price from pricing table
  const calculatePrice = (total: number): number => {
    const priceEntry = pricing.find((p) => p.bagel_quantity === total);
    return priceEntry ? priceEntry.price : 0;
  };

  const price = calculatePrice(total);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedSlotId) {
      setError('Please select a pickup time');
      return;
    }

    if (!isValidTotal(total)) {
      setError('Please select exactly 1, 3, or 6 bagels');
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
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8 flex flex-col items-center">
        <Image
          src="/logo.png"
          alt="Paige's Bagels"
          width={400}
          height={400}
          priority
        />
      </div>

      {pricing.length > 0 && (
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-3 text-center">Pricing</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            {pricing.map((item) => (
              <div key={item.id}>
                <div className="font-bold text-lg">
                  {item.label || `${item.bagel_quantity} ${item.bagel_quantity === 1 ? 'Bagel' : 'Bagels'}`}
                </div>
                <div className="text-2xl font-bold text-blue-600">${item.price.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <TimeSlotSelector
          slots={slots}
          selectedSlotId={selectedSlotId}
          onChange={setSelectedSlotId}
          requiredCapacity={total}
        />

        <BagelSelector
          bagelTypes={bagelTypes}
          counts={bagelCounts}
          onChange={setBagelCounts}
          maxTotal={6}
        />

        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Your Information</h3>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              id="name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              id="phone"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        {total > 0 && isValidTotal(total) && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-lg">Total Price:</span>
              <span className="text-2xl font-bold text-green-600">${price}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !isValidTotal(total)}
          className="w-full py-3 px-6 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? 'Placing Order...' : 'Place Order'}
        </button>
      </form>
    </div>
  );
}
