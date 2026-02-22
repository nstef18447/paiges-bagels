'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BagelType } from '@/types';
import NavBar from '@/components/NavBar';

/* ── Hardcoded transparent bagel images for the carousel ──
   These map to /public/<file>.png. If we can match by name from the API
   we will, otherwise we fall back to this list. */
const BAGEL_IMAGES: Record<string, string> = {
  plain: '/plaintrans.png',
  everything: '/everythingtrans.png',
  sesame: '/sesametrans.png',
  'poppy seed': '/poppytrans.png',
  poppy: '/poppytrans.png',
  salt: '/salttrans.png',
};

function getBagelImage(name: string): string | null {
  const key = name.toLowerCase();
  return BAGEL_IMAGES[key] ?? null;
}

export default function Home() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [bagelTypes, setBagelTypes] = useState<BagelType[]>([]);
  const [activeBagel, setActiveBagel] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || bagelTypes.length === 0) return;
    const scrollLeft = el.scrollLeft;
    const cardWidth = el.scrollWidth / bagelTypes.length;
    const index = Math.round(scrollLeft / cardWidth);
    setActiveBagel(Math.min(index, bagelTypes.length - 1));
  }, [bagelTypes.length]);

  useEffect(() => {
    fetch('/api/bagel-types')
      .then((res) => res.json())
      .then((data) => setBagelTypes(data))
      .catch(console.error);
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setMessage(data.message);
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong');
      }
    } catch {
      setStatus('error');
      setMessage('Something went wrong');
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f6f4f0' }}>
      <NavBar />

      {/* ═══════════════════════════════════════════════
          1. HERO — kept as-is
      ═══════════════════════════════════════════════ */}
      <div
        className="relative flex items-start pt-40 md:items-center md:pt-0 md:justify-center overflow-hidden"
        style={{ height: '100svh', minHeight: '600px' }}
      >
        <div className="absolute inset-0 z-0">
          <Image
            src="/background-photo.jpeg"
            alt=""
            fill
            className="object-cover"
            style={{ objectPosition: 'center 30%' }}
            priority
          />
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to bottom, rgba(0,12,35,0.78) 0%, rgba(0,15,40,0.45) 35%, rgba(0,15,40,0.1) 65%, rgba(0,15,40,0.05) 100%)',
            }}
          />
        </div>

        <div className="relative z-10 w-full text-center px-6 md:pb-0 md:max-w-[700px]">
          <p className="animate-fade-up animate-fade-up-1 text-xs sm:text-sm font-semibold uppercase tracking-[0.28em] mb-3 sm:mb-4 text-white/70">
            Paige&apos;s Bagels
          </p>
          <h1
            className="animate-fade-up animate-fade-up-2 text-[3.2rem] sm:text-[4.5rem] lg:text-[5.5rem] font-black text-white mb-8 sm:mb-10"
            style={{ lineHeight: 1.05, letterSpacing: '-0.02em' }}
          >
            Seriously<br />
            <em className="font-bold block" style={{ fontSize: '112%' }}>Sourdough.</em>
          </h1>
          <div className="animate-fade-up animate-fade-up-3 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              href="/order"
              className="w-full sm:w-auto px-11 py-4 font-semibold text-sm uppercase tracking-[0.08em] transition-all hover:-translate-y-0.5 hover:shadow-lg min-h-[44px] flex items-center justify-center"
              style={{
                backgroundColor: '#fff',
                color: 'var(--blue)',
                maxWidth: '320px',
              }}
            >
              Place Your Order
            </Link>
            <Link
              href="/menu"
              className="w-full sm:w-auto px-11 py-4 font-medium text-sm uppercase tracking-[0.08em] text-white transition-all hover:bg-white/10 border border-white/35 min-h-[44px] flex items-center justify-center"
              style={{ maxWidth: '320px' }}
            >
              View Menu
            </Link>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          2. VALUE PROPS — "Why Paige's?"
      ═══════════════════════════════════════════════ */}
      <section style={{ padding: '56px 20px', maxWidth: 960, margin: '0 auto', width: '100%' }}>
        <div className="text-center mb-8">
          <p
            className="text-xs font-semibold uppercase tracking-[0.22em] mb-2"
            style={{ color: 'var(--brown)' }}
          >
            Why Paige&apos;s?
          </p>
          <h2
            className="text-[1.8rem] font-black"
            style={{ fontFamily: 'var(--font-playfair)', color: 'var(--blue)' }}
          >
            Not Your Average Bagel
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { emoji: '🫗', title: '5 Simple Ingredients', desc: 'Flour, water, salt, starter, malt. That\'s it — nothing you can\'t pronounce.' },
            { emoji: '⏳', title: '48-Hour Ferment', desc: 'Good things take time. Our dough cold-ferments for two days for that deep, tangy flavor.' },
            { emoji: '🔥', title: 'Boiled & Baked Fresh', desc: 'Kettle-boiled, then baked on stone. Crispy outside, chewy inside — the way it should be.' },
          ].map((card) => (
            <div
              key={card.title}
              className="text-center rounded-2xl p-6 transition-transform hover:-translate-y-[3px]"
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border)',
              }}
            >
              <span className="block text-[2rem] mb-3">{card.emoji}</span>
              <h3
                className="text-[1.05rem] font-bold mb-1.5"
                style={{ fontFamily: 'var(--font-playfair)', color: 'var(--blue)' }}
              >
                {card.title}
              </h3>
              <p className="text-[0.85rem] leading-relaxed" style={{ color: '#6b7280' }}>
                {card.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          3. BAGEL SHOWCASE — "The Lineup"
      ═══════════════════════════════════════════════ */}
      <section style={{ paddingBottom: 56 }}>
        <div className="text-center px-5 mb-7">
          <p
            className="text-xs font-semibold uppercase tracking-[0.22em] mb-2"
            style={{ color: 'var(--brown)' }}
          >
            The Lineup
          </p>
          <h2
            className="text-[1.8rem] font-black mb-1.5"
            style={{ fontFamily: 'var(--font-playfair)', color: 'var(--blue)' }}
          >
            Our Bagels
          </h2>
          <p className="text-[0.9rem]" style={{ color: '#6b7280' }}>
            Swipe to explore the lineup
          </p>
        </div>

        {bagelTypes.length > 0 && (
          <>
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide px-5"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {bagelTypes.map((bagel) => {
                const imgSrc = getBagelImage(bagel.name) || (bagel.image_url ? `/${bagel.image_url}` : null);
                return (
                  <div
                    key={bagel.id}
                    className="flex-shrink-0 snap-center text-center cursor-pointer transition-transform hover:-translate-y-2"
                    style={{ flex: '0 0 160px' }}
                  >
                    <div
                      className="flex items-center justify-center mx-auto mb-3.5"
                      style={{ width: 150, height: 150 }}
                    >
                      {imgSrc ? (
                        <img
                          src={imgSrc}
                          alt={bagel.name}
                          className="max-w-full max-h-full object-contain transition-all"
                          style={{
                            filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.15))',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.filter = 'drop-shadow(0 12px 28px rgba(0,0,0,0.22))';
                            e.currentTarget.style.transform = 'scale(1.06)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.filter = 'drop-shadow(0 8px 20px rgba(0,0,0,0.15))';
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                        />
                      ) : (
                        <span className="text-6xl">🥯</span>
                      )}
                    </div>
                    <p
                      className="font-bold text-base"
                      style={{ fontFamily: 'var(--font-playfair)', color: 'var(--blue)' }}
                    >
                      {bagel.name}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Dot indicators */}
            <div className="flex justify-center gap-2 mt-4">
              {bagelTypes.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    const el = scrollRef.current;
                    if (!el) return;
                    const cardWidth = el.scrollWidth / bagelTypes.length;
                    el.scrollTo({ left: cardWidth * i, behavior: 'smooth' });
                  }}
                  className="rounded-full transition-all"
                  style={{
                    width: i === activeBagel ? '24px' : '8px',
                    height: '8px',
                    backgroundColor: i === activeBagel ? '#004AAD' : '#C8D6E5',
                  }}
                  aria-label={`Go to bagel ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}

        {/* See Full Menu link */}
        <div className="text-center mt-7">
          <Link
            href="/menu"
            className="inline-flex items-center gap-1.5 font-semibold text-[0.88rem] tracking-[0.04em] transition-colors hover:text-[var(--brown)]"
            style={{
              color: 'var(--blue)',
              borderBottom: '2px solid var(--blue)',
              paddingBottom: 2,
            }}
          >
            See Full Menu
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          4. THE SOURDOUGH DIFFERENCE — photo split
      ═══════════════════════════════════════════════ */}
      <section
        className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 md:items-center"
        style={{ maxWidth: 960, margin: '0 auto', padding: '0 20px 56px' }}
      >
        {/* Photo */}
        <div
          className="rounded-2xl overflow-hidden h-[280px] md:h-[380px]"
        >
          <Image
            src="/best-images/IMG_2184.JPG"
            alt="Sourdough bagel crumb structure on baking sheet"
            width={600}
            height={400}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Text */}
        <div className="flex flex-col justify-center">
          <p
            className="text-xs font-semibold uppercase tracking-[0.22em] mb-2"
            style={{ color: 'var(--brown)' }}
          >
            The Difference
          </p>
          <h2
            className="text-[1.8rem] font-black mb-4"
            style={{ fontFamily: 'var(--font-playfair)', color: 'var(--blue)', lineHeight: 1.15 }}
          >
            Real Sourdough, Real Ingredients
          </h2>
          <p className="text-[0.92rem] leading-[1.7] mb-6" style={{ color: '#6b7280' }}>
            Most &lsquo;sourdough&rsquo; bagels use commercial yeast with a splash of starter for
            flavor. Ours are naturally leavened &mdash; no yeast, no additives, no compromises. Just
            time, flour, water, and a starter that&apos;s been fed daily since day one.
          </p>
          <Link
            href="/about"
            className="inline-flex items-center gap-1.5 font-semibold text-[0.9rem] transition-colors hover:text-[var(--brown)] group"
            style={{ color: 'var(--blue)' }}
          >
            Read Our Story
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="transition-transform group-hover:translate-x-[3px]"
            >
              <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          5. MEET THE BAKER
      ═══════════════════════════════════════════════ */}
      <section style={{ backgroundColor: 'var(--blue)', padding: '56px 20px' }}>
        <div
          className="flex flex-col md:flex-row items-center md:items-center gap-8 md:gap-12 text-center md:text-left"
          style={{ maxWidth: 960, margin: '0 auto' }}
        >
          {/* Photo */}
          <div
            className="rounded-full overflow-hidden flex-shrink-0 w-[180px] h-[180px] md:w-[220px] md:h-[220px]"
            style={{
              border: '4px solid rgba(255,255,255,0.15)',
            }}
          >
            <Image
              src="/paige.JPG"
              alt="Paige"
              width={220}
              height={220}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Text */}
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-[0.22em] mb-2.5"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              Meet the Baker
            </p>
            <h2
              className="text-[1.8rem] font-black text-white mb-4"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              Hey, I&apos;m Paige.
            </h2>
            <blockquote
              className="text-[1.15rem] leading-[1.6] italic font-bold mb-6"
              style={{
                fontFamily: 'var(--font-playfair)',
                color: 'rgba(255,255,255,0.8)',
                maxWidth: 480,
              }}
            >
              &ldquo;I started baking sourdough because I wanted bagels I could actually eat. Now I
              can&apos;t stop making them &mdash; and I want you to try them.&rdquo;
            </blockquote>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 font-semibold text-[0.88rem] text-white transition-all"
              style={{
                borderBottom: '1px solid rgba(255,255,255,0.4)',
                paddingBottom: 4,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#fff')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)')}
            >
              Read My Story
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
                <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          6. NEWSLETTER — "Stay In The Know"
      ═══════════════════════════════════════════════ */}
      <section style={{ padding: '56px 20px', maxWidth: 960, margin: '0 auto', width: '100%' }}>
        <div
          className="rounded-2xl text-center"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border)',
            padding: '40px 24px',
          }}
        >
          <h2
            className="text-[1.6rem] font-black mb-2"
            style={{ fontFamily: 'var(--font-playfair)', color: 'var(--blue)' }}
          >
            Stay In The Know
          </h2>
          <p
            className="text-[0.9rem] mb-6 mx-auto"
            style={{ color: '#6b7280', maxWidth: 360 }}
          >
            New flavors, pickup drops, and the occasional bagel meme. No spam.
          </p>

          {status === 'success' ? (
            <p className="text-sm font-medium" style={{ color: 'var(--blue)' }}>{message}</p>
          ) : (
            <form onSubmit={handleSubscribe} className="flex gap-2.5 max-w-[400px] mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 px-[18px] py-3.5 text-[0.88rem] outline-none transition-all"
                style={{
                  border: '1.5px solid var(--border)',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--blue)',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--blue)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="px-6 py-3.5 font-semibold text-[0.85rem] uppercase tracking-[0.06em] text-white transition-colors whitespace-nowrap"
                style={{ backgroundColor: 'var(--blue)' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--blue-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--blue)')}
              >
                {status === 'loading' ? '...' : 'Join'}
              </button>
            </form>
          )}
          {status === 'error' && (
            <p className="text-sm text-red-500 mt-3">{message}</p>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          7. FINAL CTA — "Ready to try them?"
      ═══════════════════════════════════════════════ */}
      <section className="text-center" style={{ padding: '0 20px 64px', maxWidth: 960, margin: '0 auto' }}>
        <h2
          className="text-[2rem] font-black mb-2"
          style={{ fontFamily: 'var(--font-playfair)', color: 'var(--blue)' }}
        >
          Ready to try them?
        </h2>
        <p className="text-[0.92rem] mb-7" style={{ color: '#6b7280' }}>
          Pick your time, build your box, and taste the difference.
        </p>
        <Link
          href="/order"
          className="inline-flex items-center gap-2 px-12 py-4 font-semibold text-[0.88rem] uppercase tracking-[0.08em] text-white transition-all hover:-translate-y-0.5"
          style={{ backgroundColor: 'var(--blue)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--blue-hover)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,74,173,0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--blue)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          Place Your Order
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
            <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
          </svg>
        </Link>
      </section>
    </div>
  );
}
