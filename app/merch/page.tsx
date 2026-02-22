'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import NavBar from '@/components/NavBar';
import { MerchItem } from '@/types';

/* ─── Cart types ─── */
interface CartItem {
  productId: string;
  name: string;
  size: string | null;
  quantity: number;
  price: number;
  imageUrl: string | null;
}

/* ─── Body scroll lock helper ─── */
function lockScroll() { document.body.style.overflow = 'hidden'; }
function unlockScroll() { document.body.style.overflow = ''; }

export default function MerchPage() {
  const router = useRouter();

  /* ── Data ── */
  const [items, setItems] = useState<MerchItem[]>([]);
  const [shippingCost, setShippingCost] = useState(5);
  const [loading, setLoading] = useState(true);

  /* ── UI state ── */
  const [activeCategory, setActiveCategory] = useState('All');
  const [modalItem, setModalItem] = useState<MerchItem | null>(null);
  const [modalSize, setModalSize] = useState<string | null>(null);
  const [modalQty, setModalQty] = useState(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  /* ── Shipping form ── */
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formApt, setFormApt] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formState, setFormState] = useState('');
  const [formZip, setFormZip] = useState('');
  const [formPhone, setFormPhone] = useState('');

  const modalRef = useRef<HTMLDivElement>(null);
  const checkoutRef = useRef<HTMLDivElement>(null);

  /* ── Fetch data ── */
  useEffect(() => {
    Promise.all([
      fetch('/api/merch/items').then(r => r.json()),
      fetch('/api/merch/settings').then(r => r.json()),
    ]).then(([itemsData, settingsData]) => {
      setItems(itemsData);
      setShippingCost(settingsData?.shipping_cost ?? 5);
      setLoading(false);
    });
  }, []);

  /* ── Derived ── */
  const categories = ['All', ...Array.from(new Set(
    items.map(i => {
      const n = i.name.toLowerCase();
      if (n.includes('hat') || n.includes('cap') || n.includes('beanie')) return 'Hats';
      if (n.includes('hoodie') || n.includes('crew') || n.includes('sweat') || n.includes('tee') || n.includes('shirt') || n.includes('tank')) return 'Tops';
      return 'Other';
    })
  ))];

  function getCategory(item: MerchItem): string {
    const n = item.name.toLowerCase();
    if (n.includes('hat') || n.includes('cap') || n.includes('beanie')) return 'Hats';
    if (n.includes('hoodie') || n.includes('crew') || n.includes('sweat') || n.includes('tee') || n.includes('shirt') || n.includes('tank')) return 'Tops';
    return 'Other';
  }

  const filteredItems = activeCategory === 'All'
    ? items
    : items.filter(i => getCategory(i) === activeCategory);

  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);
  const cartTotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);

  /* ── Modal ── */
  function openModal(item: MerchItem) {
    setModalItem(item);
    setModalQty(1);
    setModalSize(item.needs_size && item.sizes.length > 0 ? item.sizes[0] : null);
    lockScroll();
  }

  function closeModal() {
    setModalItem(null);
    unlockScroll();
  }

  function addToBag() {
    if (!modalItem) return;
    if (modalItem.needs_size && !modalSize) return;

    const existing = cart.findIndex(
      c => c.productId === modalItem.id && c.size === modalSize
    );

    if (existing >= 0) {
      setCart(prev => prev.map((c, i) =>
        i === existing ? { ...c, quantity: c.quantity + modalQty } : c
      ));
    } else {
      setCart(prev => [...prev, {
        productId: modalItem.id,
        name: modalItem.name,
        size: modalSize,
        quantity: modalQty,
        price: modalItem.price,
        imageUrl: modalItem.image_url,
      }]);
    }

    closeModal();
  }

  function removeCartItem(index: number) {
    setCart(prev => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length === 0) {
        setCheckoutOpen(false);
        unlockScroll();
      }
      return next;
    });
  }

  /* ── Checkout ── */
  function openCheckout() {
    setCheckoutOpen(true);
    setCheckoutError('');
    lockScroll();
  }

  function closeCheckout() {
    setCheckoutOpen(false);
    unlockScroll();
  }

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

      // Redirect to Stripe
      window.location.href = data.url;
    } catch {
      setCheckoutError('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  const isOutOfStock = (item: MerchItem) => item.stock !== null && item.stock <= 0;

  /* ═══════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════ */
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      <NavBar />

      {/* ── Page Header ── */}
      <div className="text-center" style={{ padding: '36px 20px 16px' }}>
        <p
          className="text-xs font-semibold uppercase tracking-[0.22em] mb-2"
          style={{ color: 'var(--brown)' }}
        >
          Seriously Sourdough
        </p>
        <h1
          className="text-[2.2rem] md:text-[2.8rem] font-black mb-2"
          style={{ fontFamily: 'var(--font-playfair)', color: 'var(--blue)' }}
        >
          Merch
        </h1>
        <p className="text-[0.95rem] max-w-[400px] mx-auto" style={{ color: '#6b7280' }}>
          Rep the brand. Look good doing it.
        </p>
      </div>

      {/* ── Category Tabs ── */}
      {categories.length > 1 && (
        <div className="flex justify-center gap-1 px-5 pb-8 max-w-[500px] mx-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="flex-1 py-2.5 text-center font-semibold text-[0.82rem] uppercase tracking-[0.06em] rounded-full transition-all"
              style={{
                background: activeCategory === cat ? 'var(--blue)' : 'none',
                color: activeCategory === cat ? '#fff' : '#6b7280',
                border: activeCategory === cat ? '1.5px solid var(--blue)' : '1.5px solid var(--border)',
                cursor: 'pointer',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* ── Product Grid ── */}
      <div className="max-w-[960px] mx-auto px-5 pb-12" style={{ paddingBottom: cartCount > 0 ? 80 : 48 }}>
        {loading ? (
          <div className="flex justify-center py-16">
            <div
              className="w-8 h-8 border-4 rounded-full animate-spin"
              style={{ borderColor: 'var(--blue)', borderTopColor: 'transparent' }}
            />
          </div>
        ) : filteredItems.length === 0 ? (
          <p className="text-center py-16" style={{ color: '#6b7280' }}>
            No items available yet. Check back soon!
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
            {filteredItems.map(item => {
              const soldOut = isOutOfStock(item);
              return (
                <div
                  key={item.id}
                  onClick={() => !soldOut && openModal(item)}
                  className="rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    cursor: soldOut ? 'default' : 'pointer',
                    opacity: soldOut ? 0.5 : 1,
                  }}
                  onMouseEnter={e => { if (!soldOut) e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,74,173,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
                >
                  {/* Image */}
                  <div className="w-full overflow-hidden" style={{ aspectRatio: '5/6', background: '#eae7e1' }}>
                    {item.image_url ? (
                      <Image
                        src={item.image_url.startsWith('/') ? item.image_url : `/${item.image_url}`}
                        alt={item.name}
                        width={400}
                        height={480}
                        className="w-full h-full object-cover transition-transform duration-400 hover:scale-[1.04]"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-4xl">🛍️</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3.5 md:p-4">
                    <h3
                      className="text-[0.95rem] font-bold mb-1"
                      style={{ fontFamily: 'var(--font-playfair)', color: 'var(--blue)' }}
                    >
                      {item.name}
                    </h3>
                    <p className="font-semibold text-[0.88rem]" style={{ color: 'var(--brown)' }}>
                      {soldOut ? 'Sold Out' : `$${item.price.toFixed(2)}`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════
          PRODUCT DETAIL MODAL
      ═══════════════════════════════════════════ */}
      {modalItem && (
        <div
          className="fixed inset-0 z-[200] flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div
            ref={modalRef}
            className="w-full max-w-[600px] overflow-y-auto rounded-t-[20px] md:rounded-[20px] md:mb-5"
            style={{
              background: 'var(--bg)',
              maxHeight: '92vh',
              animation: 'slideUp 0.35s ease',
            }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 md:hidden">
              <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(0,0,0,0.15)' }} />
            </div>

            {/* Image */}
            <div className="w-full overflow-hidden" style={{ aspectRatio: '1', background: '#eae7e1' }}>
              {modalItem.image_url ? (
                <Image
                  src={modalItem.image_url.startsWith('/') ? modalItem.image_url : `/${modalItem.image_url}`}
                  alt={modalItem.name}
                  width={600}
                  height={600}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-6xl">🛍️</span>
                </div>
              )}
            </div>

            {/* Body */}
            <div className="px-5 pt-6 pb-8">
              <h2
                className="text-[1.5rem] font-black mb-1"
                style={{ fontFamily: 'var(--font-playfair)', color: 'var(--blue)' }}
              >
                {modalItem.name}
              </h2>
              <p className="font-semibold text-[1.1rem] mb-2" style={{ color: 'var(--brown)' }}>
                ${modalItem.price.toFixed(2)}
              </p>
              {modalItem.description && (
                <p className="text-[0.9rem] leading-relaxed mb-6" style={{ color: '#6b7280' }}>
                  {modalItem.description}
                </p>
              )}

              {/* Size picker */}
              {modalItem.needs_size && modalItem.sizes.length > 0 && (
                <div className="mb-5">
                  <span
                    className="block font-semibold text-[0.82rem] uppercase tracking-[0.05em] mb-2.5"
                    style={{ color: 'var(--blue)' }}
                  >
                    Size
                  </span>
                  <div className="flex gap-2 flex-wrap">
                    {modalItem.sizes.map(size => (
                      <button
                        key={size}
                        onClick={() => setModalSize(size)}
                        className="min-w-[52px] px-4 py-2.5 font-semibold text-[0.85rem] transition-all"
                        style={{
                          borderRadius: 10,
                          background: modalSize === size ? 'var(--blue)' : 'var(--bg-card)',
                          color: modalSize === size ? '#fff' : 'var(--blue)',
                          border: modalSize === size ? '1.5px solid var(--blue)' : '1.5px solid var(--border)',
                          cursor: 'pointer',
                        }}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="flex items-center gap-0 mb-6">
                <button
                  onClick={() => setModalQty(q => Math.max(1, q - 1))}
                  className="w-11 h-11 rounded-full flex items-center justify-center text-xl font-semibold transition-all"
                  style={{
                    border: '1.5px solid var(--border)',
                    background: 'var(--bg-card)',
                    color: 'var(--blue)',
                    cursor: 'pointer',
                  }}
                >
                  −
                </button>
                <span className="w-14 text-center font-bold text-[1.1rem]" style={{ color: 'var(--blue)' }}>
                  {modalQty}
                </span>
                <button
                  onClick={() => setModalQty(q => q + 1)}
                  className="w-11 h-11 rounded-full flex items-center justify-center text-xl font-semibold transition-all"
                  style={{
                    border: '1.5px solid var(--border)',
                    background: 'var(--bg-card)',
                    color: 'var(--blue)',
                    cursor: 'pointer',
                  }}
                >
                  +
                </button>
              </div>

              {/* Add to Bag */}
              <button
                onClick={addToBag}
                disabled={modalItem.needs_size && !modalSize}
                className="w-full py-4 font-semibold text-[0.9rem] uppercase tracking-[0.06em] text-white flex items-center justify-center gap-2 transition-colors"
                style={{
                  background: (modalItem.needs_size && !modalSize) ? 'var(--border)' : 'var(--blue)',
                  cursor: (modalItem.needs_size && !modalSize) ? 'not-allowed' : 'pointer',
                  opacity: (modalItem.needs_size && !modalSize) ? 0.4 : 1,
                  border: 'none',
                  borderRadius: 0,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                  <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1.003 1.003 0 0 0 20 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
                </svg>
                Add to Bag — ${(modalItem.price * modalQty).toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          PERSISTENT CART BAR
      ═══════════════════════════════════════════ */}
      {cartCount > 0 && !modalItem && !checkoutOpen && (
        <div
          className="fixed bottom-0 left-0 right-0 z-[150] flex items-center justify-between px-5 py-3.5 text-white"
          style={{
            background: 'var(--blue)',
            paddingBottom: 'max(14px, env(safe-area-inset-bottom))',
          }}
        >
          <div className="flex items-center gap-3">
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-[0.82rem]"
              style={{ background: 'rgba(255,255,255,0.2)' }}
            >
              {cartCount}
            </span>
            <span className="font-medium text-[0.88rem]">
              {cartCount === 1 ? 'item in bag' : 'items in bag'}
            </span>
          </div>
          <button
            onClick={openCheckout}
            className="px-6 py-2.5 font-semibold text-[0.82rem] uppercase tracking-[0.06em] transition-all"
            style={{
              background: '#fff',
              color: 'var(--blue)',
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Checkout
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          CHECKOUT PANEL
      ═══════════════════════════════════════════ */}
      {checkoutOpen && (
        <div
          className="fixed inset-0 z-[300] flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={e => { if (e.target === e.currentTarget) closeCheckout(); }}
        >
          <div
            ref={checkoutRef}
            className="w-full max-w-[600px] overflow-y-auto rounded-t-[20px] md:rounded-[20px] md:mb-5 px-5 pb-8"
            style={{
              background: 'var(--bg)',
              maxHeight: '92vh',
              animation: 'slideUp 0.35s ease',
            }}
          >
            {/* Header */}
            <div
              className="flex justify-between items-center py-5"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <h2
                className="text-[1.4rem] font-black"
                style={{ fontFamily: 'var(--font-playfair)', color: 'var(--blue)' }}
              >
                Your Bag
              </h2>
              <button
                onClick={closeCheckout}
                className="text-[1.5rem] p-2"
                style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Cart items */}
            <div className="mt-4">
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
              className="w-full py-4 font-semibold text-[0.9rem] uppercase tracking-[0.06em] text-white transition-colors"
              style={{
                background: submitting ? 'var(--border)' : 'var(--blue)',
                cursor: submitting ? 'not-allowed' : 'pointer',
                border: 'none',
                borderRadius: 0,
              }}
            >
              {submitting ? 'Processing...' : 'Proceed to Payment'}
            </button>
          </div>
        </div>
      )}

      {/* ── Slide-up animation ── */}
      <style jsx>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
