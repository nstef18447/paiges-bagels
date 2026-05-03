'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from './CartProvider';

export default function CartDrawer() {
  const router = useRouter();
  const { cart, cartTotal, drawerOpen, closeDrawer, removeCartItem } = useCart();

  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');

  const [pickupFee, setPickupFee] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  useEffect(() => {
    fetch('/api/merch/settings')
      .then(r => r.json())
      .then(data => { if (data?.shipping_cost) setPickupFee(data.shipping_cost); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  useEffect(() => {
    if (!drawerOpen) {
      setCheckoutError('');
    }
  }, [drawerOpen]);

  async function handleCheckout() {
    if (!formName || !formEmail) {
      setCheckoutError('Please enter your name and email.');
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
          customerPhone: formPhone || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setCheckoutError(data.error || 'Checkout failed');
        setSubmitting(false);
        return;
      }

      closeDrawer();
      router.push(`/merch/confirmation?orderId=${data.orderId}`);
    } catch {
      setCheckoutError('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  if (!drawerOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex justify-end"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={e => { if (e.target === e.currentTarget) closeDrawer(); }}
    >
      <div
        className="h-full overflow-y-auto"
        style={{ width: 400, maxWidth: '100vw', background: 'var(--bg)', animation: 'slideInRight 0.3s ease' }}
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
            Your Bag
          </h2>
          <button
            onClick={closeDrawer}
            className="text-[1.5rem] p-2"
            style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

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
                          src={item.imageUrl}
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

              {/* Contact form */}
              <div className="mt-6">
                <h3
                  className="text-[1.1rem] font-bold mb-4"
                  style={{ fontFamily: 'var(--font-playfair)', color: 'var(--blue)' }}
                >
                  Your Info
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
                    type="tel"
                    placeholder="Phone (optional)"
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    className="w-full px-4 py-3.5 text-[0.88rem] outline-none transition-all"
                    style={{ border: '1.5px solid var(--border)', borderRadius: 10, background: 'var(--bg-card)', color: 'var(--blue)' }}
                    onFocus={e => e.currentTarget.style.borderColor = 'var(--blue)'}
                    onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  />
                </div>
              </div>

              {/* Order total */}
              <div
                className="flex justify-between items-center py-5 mt-4 font-bold text-[1.05rem]"
                style={{ borderTop: '1px solid var(--border)', color: 'var(--blue)' }}
              >
                <span>Total</span>
                <span>${(cartTotal + pickupFee).toFixed(2)}</span>
              </div>
              <p className="text-[0.78rem] -mt-3 mb-4" style={{ color: '#6b7280' }}>
                Includes ${pickupFee.toFixed(2)} service fee
              </p>

              {checkoutError && (
                <p className="text-[0.85rem] font-medium mb-3" style={{ color: '#dc2626' }}>
                  {checkoutError}
                </p>
              )}

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
                {submitting ? 'Processing...' : 'Place Order'}
              </button>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
