'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { OrderWithDetails } from '@/types';
import { formatDate, formatTime, generateVenmoLink } from '@/lib/utils';
import NavBar from '@/components/NavBar';

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
      <div className="flex justify-center items-center min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
        <div className="text-lg" style={{ color: 'var(--text-medium)' }}>Loading...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
        <NavBar />
        <div className="max-w-lg mx-auto px-5 py-16 text-center">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--error)', fontFamily: 'var(--font-playfair)' }}>
            Order not found
          </h1>
          <Link
            href="/order"
            className="inline-block mt-6 px-8 py-3 font-semibold text-sm uppercase tracking-[0.06em] text-white"
            style={{ backgroundColor: 'var(--blue)' }}
          >
            Place an Order
          </Link>
        </div>
      </div>
    );
  }

  const venmoUsername = process.env.NEXT_PUBLIC_VENMO_USERNAME || 'paiges-bagels';
  const venmoLink = generateVenmoLink(venmoUsername, order.total_price, order.venmo_note);

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
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      <NavBar />

      <div className="max-w-lg mx-auto px-5 py-10 md:py-14">
        {/* Success Icon + Header */}
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
            {paid ? 'Order Confirmed!' : 'Order Placed!'}
          </h1>
          <p className="text-[0.95rem]" style={{ color: 'var(--text-secondary)' }}>
            {paid
              ? 'Your payment has been received — we\'ll have your bagels ready for you.'
              : 'We\'ll have your bagels ready for you.'}
          </p>
        </div>

        {/* Order Summary Card */}
        <div
          className="rounded-2xl overflow-hidden mb-8"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          {/* Pickup */}
          <div className="px-6 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
            <h3
              className="text-[0.72rem] font-semibold uppercase tracking-[0.15em] mb-2"
              style={{ color: 'var(--text-secondary)' }}
            >
              Pickup Time
            </h3>
            <p
              className="text-[1.05rem] font-bold"
              style={{ color: 'var(--blue)', fontFamily: 'var(--font-playfair)' }}
            >
              {formatDate(order.time_slot.date)} at {formatTime(order.time_slot.time)}
            </p>
            <p className="text-[0.82rem] mt-1.5" style={{ color: 'var(--text-secondary)' }}>
              1881 Oak Avenue Apt 1510W, Evanston IL 60201. Bagels will be outside! Please use call box to call Paige Tuchner to be let upstairs if needed.
            </p>
          </div>

          {/* Items */}
          <div className="px-6 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
            <h3
              className="text-[0.72rem] font-semibold uppercase tracking-[0.15em] mb-2"
              style={{ color: 'var(--text-secondary)' }}
            >
              Your Bagels
            </h3>
            <ul className="space-y-1">
              {bagelList.map((item, i) => (
                <li key={i} className="text-[0.95rem] font-semibold" style={{ color: 'var(--text-dark)' }}>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Add-Ons */}
          {order.order_add_ons && order.order_add_ons.length > 0 && (
            <div className="px-6 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
              <h3
                className="text-[0.72rem] font-semibold uppercase tracking-[0.15em] mb-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                Add-Ons <span className="normal-case italic tracking-normal font-normal">(on the side)</span>
              </h3>
              <ul className="space-y-1">
                {order.order_add_ons.map((addOn, i) => (
                  <li key={i} className="text-[0.95rem] font-semibold" style={{ color: 'var(--text-dark)' }}>
                    {addOn.quantity} {addOn.add_on_type.name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Total */}
          <div className="px-6 py-5">
            {paid ? (
              <>
                <div className="flex justify-between items-center text-[0.88rem] mb-1" style={{ color: 'var(--text-secondary)' }}>
                  <span>Subtotal</span>
                  <span>${order.total_price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-[0.88rem] mb-3" style={{ color: 'var(--text-secondary)' }}>
                  <span>Credit card fee (3%)</span>
                  <span>${ccFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                  <span className="font-semibold" style={{ color: 'var(--text-dark)' }}>Total Paid</span>
                  <span className="text-2xl font-bold" style={{ color: 'var(--success)' }}>${totalWithFee.toFixed(2)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between items-center">
                <span className="font-semibold" style={{ color: 'var(--text-dark)' }}>Total</span>
                <span className="text-2xl font-bold" style={{ color: 'var(--success)' }}>${order.total_price.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>

        {/* What's Next / Payment Section */}
        {paid ? (
          <>
            {/* What's Next */}
            <div className="mb-8 space-y-4">
              <div className="flex gap-3 items-start">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'var(--blue-light)' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--blue)">
                    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-[0.92rem] font-semibold" style={{ color: 'var(--text-dark)' }}>
                    Confirmation email on the way
                  </p>
                  <p className="text-[0.82rem]" style={{ color: 'var(--text-secondary)' }}>
                    We&apos;ll send a confirmation to {order.customer_email} shortly
                  </p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'var(--blue-light)' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--blue)">
                    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-[0.92rem] font-semibold" style={{ color: 'var(--text-dark)' }}>
                    Show this page at pickup
                  </p>
                  <p className="text-[0.82rem]" style={{ color: 'var(--text-secondary)' }}>
                    You&apos;ll receive another email when your order is ready for pickup
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Payment Steps */}
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
                    <p className="text-[0.92rem] font-semibold" style={{ color: 'var(--text-dark)' }}>Pay via Venmo or Credit Card</p>
                    <p className="text-[0.82rem]" style={{ color: 'var(--text-secondary)' }}>
                      Use one of the buttons below to pay ${order.total_price.toFixed(2)}
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
                    <p className="text-[0.92rem] font-semibold" style={{ color: 'var(--text-dark)' }}>Wait for confirmation email</p>
                    <p className="text-[0.82rem]" style={{ color: 'var(--text-secondary)' }}>
                      {`We'll send a confirmation to ${order.customer_email} once payment is verified.`}
                      {' '}Venmo orders may take a few hours as we manually review each one. Credit card orders are confirmed instantly.
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
                    <p className="text-[0.92rem] font-semibold" style={{ color: 'var(--text-dark)' }}>Pick up your bagels</p>
                    <p className="text-[0.82rem]" style={{ color: 'var(--text-secondary)' }}>
                      You&apos;ll receive another email when your order is ready for pickup
                    </p>
                  </div>
                </li>
              </ol>
            </div>

            {/* Venmo Button */}
            <a
              href={venmoLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-4 px-6 font-semibold text-[0.88rem] uppercase tracking-[0.06em] text-center text-white transition-all"
              style={{ backgroundColor: 'var(--blue)' }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--blue-hover)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--blue)'}
            >
              Pay ${order.total_price.toFixed(2)} on Venmo
            </a>

            {/* Credit Card Button */}
            <div className="mt-3">
              {!showCardFee ? (
                <button
                  onClick={() => setShowCardFee(true)}
                  className="block w-full py-4 px-6 font-semibold text-[0.88rem] uppercase tracking-[0.06em] text-center transition-all cursor-pointer"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    color: 'var(--blue)',
                    border: '1.5px solid var(--blue)',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--blue-light)'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card)'}
                >
                  Pay with Credit Card
                </button>
              ) : (
                <div
                  className="rounded-2xl p-5"
                  style={{ backgroundColor: 'var(--bg-card)', border: '1.5px solid var(--blue)' }}
                >
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-[0.88rem]" style={{ color: 'var(--text-secondary)' }}>
                      <span>Subtotal</span>
                      <span>${order.total_price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[0.88rem]" style={{ color: 'var(--text-secondary)' }}>
                      <span>Credit card fee (3%)</span>
                      <span>${ccFee.toFixed(2)}</span>
                    </div>
                    <div
                      className="flex justify-between font-bold pt-3"
                      style={{ borderTop: '1px solid var(--border)', color: 'var(--text-dark)' }}
                    >
                      <span>Total</span>
                      <span>${totalWithFee.toFixed(2)}</span>
                    </div>
                  </div>
                  <button
                    onClick={handleCardPayment}
                    disabled={checkoutLoading}
                    className="block w-full py-4 px-6 font-semibold text-[0.88rem] uppercase tracking-[0.06em] text-center text-white transition-all cursor-pointer"
                    style={{
                      backgroundColor: checkoutLoading ? 'var(--text-secondary)' : 'var(--blue)',
                    }}
                    onMouseOver={(e) => {
                      if (!checkoutLoading) e.currentTarget.style.backgroundColor = 'var(--blue-hover)';
                    }}
                    onMouseOut={(e) => {
                      if (!checkoutLoading) e.currentTarget.style.backgroundColor = 'var(--blue)';
                    }}
                  >
                    {checkoutLoading ? 'Redirecting...' : `Proceed to Payment — $${totalWithFee.toFixed(2)}`}
                  </button>
                </div>
              )}
            </div>

            <p className="text-center text-[0.82rem] mt-4" style={{ color: 'var(--text-secondary)' }}>
              Please allow some time for confirmation as we personally review each order. Thank you for your patience!
            </p>
          </>
        )}

        {/* Bottom Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-10">
          <Link
            href="/order"
            className="flex-1 py-4 px-6 font-semibold text-[0.88rem] uppercase tracking-[0.06em] text-center text-white transition-all"
            style={{ backgroundColor: 'var(--blue)' }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--blue-hover)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--blue)'}
          >
            Place Another Order
          </Link>
          <Link
            href="/"
            className="flex-1 py-4 px-6 font-semibold text-[0.88rem] uppercase tracking-[0.06em] text-center transition-all"
            style={{
              color: 'var(--blue)',
              border: '1.5px solid var(--blue)',
              backgroundColor: 'transparent',
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--blue-light)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
        <div className="text-lg" style={{ color: 'var(--text-medium)' }}>Loading...</div>
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  );
}
