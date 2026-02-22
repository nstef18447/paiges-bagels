'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { OrderWithDetails } from '@/types';
import { formatDate, formatTime, generateVenmoLink } from '@/lib/utils';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const paid = searchParams.get('paid') === 'true';

  const [order, setOrder] = useState<OrderWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCardFee, setShowCardFee] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      const { data: orderData } = await supabase
        .from('orders')
        .select(`
          *,
          time_slot:time_slots(*),
          order_items(*, bagel_type:bagel_types(*)),
          order_add_ons(*, add_on_type:add_on_types(*))
        `)
        .eq('id', orderId)
        .single();

      if (orderData) {
        setOrder(orderData as unknown as OrderWithDetails);
      }

      setLoading(false);
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen" style={{ backgroundColor: '#f6f4f0' }}>
        <div className="text-lg" style={{ color: '#4A4A4A' }}>Loading...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f6f4f0' }}>
        <div className="max-w-2xl mx-auto p-6">
          <h1 className="text-2xl" style={{ color: '#C75050' }}>Order not found</h1>
        </div>
      </div>
    );
  }

  const venmoUsername = process.env.NEXT_PUBLIC_VENMO_USERNAME || 'paiges-bagels';
  const venmoLink = generateVenmoLink(venmoUsername, order.total_price, order.venmo_note);

  // Use order_items if available, otherwise fallback to old columns
  const bagelList = order.order_items && order.order_items.length > 0
    ? order.order_items.map(item => `${item.quantity} ${item.bagel_type.name}`)
    : [
        order.plain_count > 0 && `${order.plain_count} Plain`,
        order.everything_count > 0 && `${order.everything_count} Everything`,
        order.sesame_count > 0 && `${order.sesame_count} Sesame`,
      ].filter(Boolean) as string[];

  const ccFee = Math.round(order.total_price * 0.03 * 100) / 100;
  const totalWithFee = Math.round((order.total_price + ccFee) * 100) / 100;

  const handleCardPayment = async () => {
    setCheckoutLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/checkout`, { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to start checkout');
        setCheckoutLoading(false);
      }
    } catch {
      alert('Something went wrong. Please try again.');
      setCheckoutLoading(false);
    }
  };

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

        <div className="mb-8 flex flex-col items-center text-center">
          <h1 className="text-4xl mb-2" style={{ color: '#4A7C59' }}>
            {paid ? 'Payment Received!' : 'Order Placed!'}
          </h1>
          <p style={{ color: '#6B6B6B' }}>
            {paid ? 'Your order is confirmed — no further action needed' : 'Thank you for your order'}
          </p>
        </div>

        <div
          className="rounded-lg p-6 mb-6"
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E0DB'
          }}
        >
          <h2
            className="text-2xl mb-4 pb-2"
            style={{
              color: '#1A1A1A',
              borderBottom: '2px solid #004AAD'
            }}
          >
            Order Summary
          </h2>

          <div className="space-y-4">
            <div>
              <p className="text-sm uppercase tracking-wide" style={{ color: '#6B6B6B' }}>Pickup Time</p>
              <p className="font-semibold text-lg" style={{ color: '#1A1A1A' }}>
                {formatDate(order.time_slot.date)} at {formatTime(order.time_slot.time)}
              </p>
              <p className="text-sm mt-1" style={{ color: '#4A4A4A' }}>
                1881 Oak Avenue Apt 1510W, Evanston IL 60201. Bagels will be outside! Please use call box to call Paige Tuchner to be let upstairs if needed.
              </p>
            </div>

            <div>
              <p className="text-sm uppercase tracking-wide" style={{ color: '#6B6B6B' }}>Your Bagels</p>
              <ul className="font-semibold text-lg" style={{ color: '#1A1A1A' }}>
                {bagelList.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>

            {order.order_add_ons && order.order_add_ons.length > 0 && (
              <div>
                <p className="text-sm uppercase tracking-wide" style={{ color: '#6B6B6B' }}>Add-Ons <span className="normal-case italic tracking-normal">(on the side)</span></p>
                <ul className="font-semibold text-lg" style={{ color: '#1A1A1A' }}>
                  {order.order_add_ons.map((addOn, i) => (
                    <li key={i}>{addOn.quantity} {addOn.add_on_type.name}</li>
                  ))}
                </ul>
              </div>
            )}

            <div
              className="pt-4 mt-4"
              style={{ borderTop: '1px solid #E5E0DB' }}
            >
              {paid ? (
                <>
                  <div className="flex justify-between items-center text-sm mb-1" style={{ color: '#4A4A4A' }}>
                    <span>Subtotal</span>
                    <span>${order.total_price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm mb-2" style={{ color: '#4A4A4A' }}>
                    <span>Credit card fee (3%)</span>
                    <span>${ccFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold" style={{ color: '#4A4A4A' }}>Total Paid:</span>
                    <span className="text-3xl font-bold" style={{ color: '#4A7C59' }}>${totalWithFee.toFixed(2)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between items-center">
                  <span className="font-semibold" style={{ color: '#4A4A4A' }}>Total:</span>
                  <span className="text-3xl font-bold" style={{ color: '#4A7C59' }}>${order.total_price.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {paid ? (
          <div
            className="rounded-lg p-6 mb-6"
            style={{
              backgroundColor: '#E8F5E9',
              border: '1px solid #C8E6C9'
            }}
          >
            <h2
              className="text-2xl mb-4 pb-2"
              style={{
                color: '#1A1A1A',
                borderBottom: '2px solid #4A7C59'
              }}
            >
              What&apos;s Next
            </h2>

            <ol className="space-y-4">
              <li className="flex gap-3">
                <span
                  className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold"
                  style={{ backgroundColor: '#4A7C59', color: '#FFFFFF' }}
                >
                  1
                </span>
                <div>
                  <p className="font-semibold" style={{ color: '#1A1A1A' }}>Confirmation email on the way</p>
                  <p className="text-sm" style={{ color: '#6B6B6B' }}>
                    We&apos;ll send a confirmation to {order.customer_email} shortly
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span
                  className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold"
                  style={{ backgroundColor: '#4A7C59', color: '#FFFFFF' }}
                >
                  2
                </span>
                <div>
                  <p className="font-semibold" style={{ color: '#1A1A1A' }}>Pick up your bagels</p>
                  <p className="text-sm" style={{ color: '#6B6B6B' }}>
                    You&apos;ll receive another email when your order is ready for pickup
                  </p>
                </div>
              </li>
            </ol>
          </div>
        ) : (
          <>
            <div
              className="rounded-lg p-6 mb-6"
              style={{
                backgroundColor: '#E8EDF5',
                border: '1px solid #D4DCE8'
              }}
            >
              <h2
                className="text-2xl mb-4 pb-2"
                style={{
                  color: '#1A1A1A',
                  borderBottom: '2px solid #004AAD'
                }}
              >
                Next Steps
              </h2>

              <ol className="space-y-4">
                <li className="flex gap-3">
                  <span
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold"
                    style={{ backgroundColor: '#004AAD', color: '#FFFFFF' }}
                  >
                    1
                  </span>
                  <div>
                    <p className="font-semibold" style={{ color: '#1A1A1A' }}>Pay via Venmo or Credit Card</p>
                    <p className="text-sm" style={{ color: '#6B6B6B' }}>
                      Use one of the buttons below to pay ${order.total_price.toFixed(2)}
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold"
                    style={{ backgroundColor: '#004AAD', color: '#FFFFFF' }}
                  >
                    2
                  </span>
                  <div>
                    <p className="font-semibold" style={{ color: '#1A1A1A' }}>Wait for confirmation email</p>
                    <p className="text-sm" style={{ color: '#6B6B6B' }}>
                      {`We'll send a confirmation to ${order.customer_email} once payment is verified.`}
                      {' '}Venmo orders may take a few hours as we manually review each one. Credit card orders are confirmed instantly.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold"
                    style={{ backgroundColor: '#004AAD', color: '#FFFFFF' }}
                  >
                    3
                  </span>
                  <div>
                    <p className="font-semibold" style={{ color: '#1A1A1A' }}>Pick up your bagels</p>
                    <p className="text-sm" style={{ color: '#6B6B6B' }}>
                      You&apos;ll receive another email when your order is ready for pickup
                    </p>
                  </div>
                </li>
              </ol>
            </div>

            <a
              href={venmoLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-4 px-6 font-semibold rounded-lg text-center transition-all"
              style={{
                backgroundColor: '#004AAD',
                color: '#FFFFFF'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#003A8C'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#004AAD'}
            >
              Pay ${order.total_price.toFixed(2)} on Venmo
            </a>

            <div className="mt-3">
              {!showCardFee ? (
                <button
                  onClick={() => setShowCardFee(true)}
                  className="block w-full py-4 px-6 font-semibold rounded-lg text-center transition-all cursor-pointer"
                  style={{
                    backgroundColor: '#FFFFFF',
                    color: '#004AAD',
                    border: '2px solid #004AAD'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#E8EDF5';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                  }}
                >
                  Pay with Credit Card
                </button>
              ) : (
                <div
                  className="rounded-lg p-4"
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '2px solid #004AAD'
                  }}
                >
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm" style={{ color: '#4A4A4A' }}>
                      <span>Subtotal</span>
                      <span>${order.total_price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm" style={{ color: '#4A4A4A' }}>
                      <span>Credit card fee (3%)</span>
                      <span>${ccFee.toFixed(2)}</span>
                    </div>
                    <div
                      className="flex justify-between font-bold pt-2"
                      style={{ borderTop: '1px solid #E5E0DB', color: '#1A1A1A' }}
                    >
                      <span>Total</span>
                      <span>${totalWithFee.toFixed(2)}</span>
                    </div>
                  </div>
                  <button
                    onClick={handleCardPayment}
                    disabled={checkoutLoading}
                    className="block w-full py-4 px-6 font-semibold rounded-lg text-center transition-all cursor-pointer"
                    style={{
                      backgroundColor: checkoutLoading ? '#6B6B6B' : '#004AAD',
                      color: '#FFFFFF'
                    }}
                    onMouseOver={(e) => {
                      if (!checkoutLoading) e.currentTarget.style.backgroundColor = '#003A8C';
                    }}
                    onMouseOut={(e) => {
                      if (!checkoutLoading) e.currentTarget.style.backgroundColor = '#004AAD';
                    }}
                  >
                    {checkoutLoading ? 'Redirecting...' : `Proceed to Payment — $${totalWithFee.toFixed(2)}`}
                  </button>
                </div>
              )}
            </div>

            <p className="text-center text-sm mt-4" style={{ color: '#6B6B6B' }}>
              Please allow some time for confirmation as we personally review each order. Thank you for your patience!
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen" style={{ backgroundColor: '#f6f4f0' }}>
        <div className="text-lg" style={{ color: '#4A4A4A' }}>Loading...</div>
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  );
}
