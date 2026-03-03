'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useCart } from './CartProvider';
import EmbeddedCheckoutForm from './EmbeddedCheckoutForm';

export default function CartDrawer() {
  const { cart, cartCount, cartTotal, drawerOpen, closeDrawer, removeCartItem, clearCart } = useCart();

  /* ── Shipping form ── */
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formApt, setFormApt] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formState, setFormState] = useState('');
  const [formZip, setFormZip] = useState('');
  const [formPhone, setFormPhone] = useState('');

  /* ── Checkout state ── */
  const [shippingCost, setShippingCost] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  /* ── Fetch shipping cost ── */
  useEffect(() => {
    fetch('/api/merch/settings')
      .then(r => r.json())
      .then(data => { if (data?.shipping_cost) setShippingCost(data.shipping_cost); })
      .catch(() => {});
  }, []);

  /* ── Lock body scroll when open ── */
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  /* ── Reset checkout when drawer closes ── */
  useEffect(() => {
    if (!drawerOpen) {
      setClientSecret(null);
      setCheckoutError('');
    }
  }, [drawerOpen]);

  async function handleCheckout() {
    if (!formName || !formEmail || !formAddress || !formCity || !formState || !formZip) {
      setCheckoutError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    setCheckoutError('');

    try {
      const res = await fetch('/api/merch/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(c => ({ id: c.productId, quantity: c.quantity, size: c.size })),
          customerName: formName,
          customerEmail: formEmail,
          shippingAddress: formApt ? `${formAddress}, ${formApt}` : formAddress,
          shippingCity: formCity,
          shippingState: formState,
          shippingZip: formZip,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setCheckoutError(data.error || 'Checkout failed');
        setSubmitting(false);
        return;
      }

      setClientSecret(data.clientSecret);
      setSubmitting(false);
    } catch {
      setCheckoutError('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  function handleBackToCart() {
    setClientSecret(null);
    setCheckoutError('');
  }

  if (!drawerOpen) return null;

  const isCheckoutMode = !!clientSecret;

  return (
    <div
      className="fixed inset-0 z-[300] flex justify-end"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={e => { if (e.target === e.currentTarget) closeDrawer(); }}
    >
      <div
        className={`h-full overflow-y-auto ${isCheckoutMode ? 'cart-drawer-wide' : ''}`}
        style={{
          width: isCheckoutMode ? 480 : 400,
          maxWidth: '100vw',
          background: 'var(--bg)',
          animation: 'slideInRight 0.3s ease',
        }}
      >
        {/* Header */}
        <div
          className="flex justify-between items-center px-5 py-4 sticky top-0 z-10"
          style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}
        >
          <h2
            className="text-[1.3rem] font-black"
            style={{ fontFamily: 'var(--font-playfair)', color: 'var(--blue)' }}
          >
            {isCheckoutMode ? 'Checkout' : 'Your Bag'}
          </h2>
          <button
            onClick={closeDrawer}
            className="text-[1.5rem] p-2"
            style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {isCheckoutMode ? (
          /* ── Embedded Stripe Checkout ── */
          <div className="px-5 py-6">
            <button
              onClick={handleBackToCart}
              className="cart-back-btn flex items-center gap-1.5 text-[0.85rem] font-semibold mb-4"
              style={{ color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
              </svg>
              Back to Cart
            </button>
            <EmbeddedCheckoutForm clientSecret={clientSecret} />
          </div>
        ) : (
          /* ── Cart contents + shipping form ── */
          <div className="px-5">
            {cart.length === 0 ? (
              <p className="text-center py-16" style={{ color: '#6b7280' }}>
                Your bag is empty.
              </p>
            ) : (
              <>
                {/* Cart items */}
                <div className="mt-2">
                  {cart.map((item, i) => (
                    <div
                      key={`${item.productId}-${item.size}-${i}`}
                      className="flex items-center gap-3.5 py-3.5"
                      style={{ borderBottom: '1px solid var(--border)' }}
                    >
                      <div
                        className="w-14 h-14 rounded-[10px] overflow-hidden flex-shrink-0"
                        style={{ background: '#eae7e1' }}
                      >
                        {item.imageUrl && (
                          <Image
                            src={item.imageUrl.startsWith('/') ? item.imageUrl : `/${item.imageUrl}`}
                            alt={item.name}
                            width={56}
                            height={56}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-[0.9rem]" style={{ color: 'var(--blue)' }}>
                          {item.name}
                        </h4>
                        <p className="text-[0.78rem]" style={{ color: '#6b7280' }}>
                          {[item.size, `Qty ${item.quantity}`].filter(Boolean).join(' · ')}
                        </p>
                        <button
                          onClick={() => removeCartItem(i)}
                          className="text-[0.78rem] font-semibold mt-0.5"
                          style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        >
                          Remove
                        </button>
                      </div>
                      <span className="font-bold text-[0.92rem]" style={{ color: 'var(--blue)' }}>
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Shipping form */}
                <div className="mt-6">
                  <h3
                    className="text-[1.1rem] font-bold mb-4"
                    style={{ fontFamily: 'var(--font-playfair)', color: 'var(--blue)' }}
                  >
                    Shipping Address
                  </h3>

                  <div className="grid gap-3">
                    <input
                      type="text"
                      placeholder="Full Name *"
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                      className="w-full px-4 py-3.5 text-[0.88rem] outline-none transition-all"
                      style={{ border: '1.5px solid var(--border)', borderRadius: 10, background: 'var(--bg-card)', color: 'var(--blue)' }}
                      onFocus={e => e.currentTarget.style.borderColor = 'var(--blue)'}
                      onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
                    />
                    <input
                      type="email"
                      placeholder="Email *"
                      value={formEmail}
                      onChange={e => setFormEmail(e.target.value)}
                      className="w-full px-4 py-3.5 text-[0.88rem] outline-none transition-all"
                      style={{ border: '1.5px solid var(--border)', borderRadius: 10, background: 'var(--bg-card)', color: 'var(--blue)' }}
                      onFocus={e => e.currentTarget.style.borderColor = 'var(--blue)'}
                      onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
                    />
                    <input
                      type="text"
                      placeholder="Street Address *"
                      value={formAddress}
                      onChange={e => setFormAddress(e.target.value)}
                      className="w-full px-4 py-3.5 text-[0.88rem] outline-none transition-all"
                      style={{ border: '1.5px solid var(--border)', borderRadius: 10, background: 'var(--bg-card)', color: 'var(--blue)' }}
                      onFocus={e => e.currentTarget.style.borderColor = 'var(--blue)'}
                      onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
                    />
                    <input
                      type="text"
                      placeholder="Apt, Suite, etc."
                      value={formApt}
                      onChange={e => setFormApt(e.target.value)}
                      className="w-full px-4 py-3.5 text-[0.88rem] outline-none transition-all"
                      style={{ border: '1.5px solid var(--border)', borderRadius: 10, background: 'var(--bg-card)', color: 'var(--blue)' }}
                      onFocus={e => e.currentTarget.style.borderColor = 'var(--blue)'}
                      onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="City *"
                        value={formCity}
                        onChange={e => setFormCity(e.target.value)}
                        className="w-full px-4 py-3.5 text-[0.88rem] outline-none transition-all"
                        style={{ border: '1.5px solid var(--border)', borderRadius: 10, background: 'var(--bg-card)', color: 'var(--blue)' }}
                        onFocus={e => e.currentTarget.style.borderColor = 'var(--blue)'}
                        onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
                      />
                      <input
                        type="text"
                        placeholder="State *"
                        value={formState}
                        onChange={e => setFormState(e.target.value)}
                        className="w-full px-4 py-3.5 text-[0.88rem] outline-none transition-all"
                        style={{ border: '1.5px solid var(--border)', borderRadius: 10, background: 'var(--bg-card)', color: 'var(--blue)' }}
                        onFocus={e => e.currentTarget.style.borderColor = 'var(--blue)'}
                        onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="ZIP Code *"
                        value={formZip}
                        onChange={e => setFormZip(e.target.value)}
                        className="w-full px-4 py-3.5 text-[0.88rem] outline-none transition-all"
                        style={{ border: '1.5px solid var(--border)', borderRadius: 10, background: 'var(--bg-card)', color: 'var(--blue)' }}
                        onFocus={e => e.currentTarget.style.borderColor = 'var(--blue)'}
                        onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
                      />
                      <input
                        type="tel"
                        placeholder="Phone"
                        value={formPhone}
                        onChange={e => setFormPhone(e.target.value)}
                        className="w-full px-4 py-3.5 text-[0.88rem] outline-none transition-all"
                        style={{ border: '1.5px solid var(--border)', borderRadius: 10, background: 'var(--bg-card)', color: 'var(--blue)' }}
                        onFocus={e => e.currentTarget.style.borderColor = 'var(--blue)'}
                        onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
                      />
                    </div>
                  </div>
                </div>

                {/* Order total */}
                <div
                  className="flex justify-between items-center py-5 mt-4 font-bold text-[1.05rem]"
                  style={{ borderTop: '1px solid var(--border)', color: 'var(--blue)' }}
                >
                  <span>Total</span>
                  <span>${(cartTotal + shippingCost).toFixed(2)}</span>
                </div>
                <p className="text-[0.78rem] -mt-3 mb-4" style={{ color: '#6b7280' }}>
                  Includes ${shippingCost.toFixed(2)} shipping
                </p>

                {checkoutError && (
                  <p className="text-[0.85rem] font-medium mb-3" style={{ color: '#dc2626' }}>
                    {checkoutError}
                  </p>
                )}

                {/* Pay button */}
                <button
                  onClick={handleCheckout}
                  disabled={submitting}
                  className="w-full py-4 font-semibold text-[0.9rem] uppercase tracking-[0.06em] text-white transition-colors mb-6"
                  style={{
                    background: submitting ? 'var(--border)' : 'var(--blue)',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    border: 'none',
                    borderRadius: 0,
                  }}
                >
                  {submitting ? 'Processing...' : 'Proceed to Payment'}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Slide-in animation */}
      <style jsx>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
