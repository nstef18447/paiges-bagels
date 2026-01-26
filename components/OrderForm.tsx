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
      <div className="flex justify-center items-center min-h-screen" style={{ backgroundColor: '#FAF5EF' }}>
        <div className="text-lg" style={{ color: '#4A4A4A' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF5EF' }}>
      <div className="max-w-xl mx-auto px-6 py-10">
        {/* Logo Section */}
        <div className="mb-10 flex flex-col items-center">
          <Image
            src="/logo.png"
            alt="Paige's Bagels"
            width={320}
            height={320}
            priority
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Pickup Time Section */}
          <section>
            <h2
              className="text-xl mb-4 pb-2"
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
                className="text-xl mb-4 text-center"
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
              className="text-xl mb-4 pb-2"
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

          {/* Customer Information Section */}
          <section>
            <h2
              className="text-xl mb-4 pb-2"
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

          {/* Instagram Link */}
          <div className="text-center pt-2">
            <a
              href="https://www.instagram.com/paigesbagels"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 transition-colors"
              style={{ color: '#6B6B6B' }}
              onMouseOver={(e) => e.currentTarget.style.color = '#004AAD'}
              onMouseOut={(e) => e.currentTarget.style.color = '#6B6B6B'}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
              </svg>
              Follow us on Instagram
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
