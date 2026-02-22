'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BagelType, Pricing } from '@/types';
import NavBar from '@/components/NavBar';

const INGREDIENTS = ['Sourdough Starter', 'Bread Flour', 'Water', 'Sugar', 'Salt'];

const GALLERY_IMAGES = [
  { src: '/bagels.jpg', alt: 'Fresh bagels' },
  { src: '/inside.jpg', alt: 'Inside a bagel' },
  { src: '/plain.jpg', alt: 'Plain bagel' },
  { src: '/everything.jpg', alt: 'Everything bagel' },
  { src: '/sesame.jpg', alt: 'Sesame bagel' },
];

export default function MenuPage() {
  const [bagelTypes, setBagelTypes] = useState<BagelType[]>([]);
  const [pricing, setPricing] = useState<Pricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeBagel, setActiveBagel] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/bagel-types').then(r => r.json()),
      fetch('/api/pricing?type=regular').then(r => r.json()),
    ])
      .then(([bagels, prices]) => {
        setBagelTypes(bagels);
        setPricing(Array.isArray(prices) ? prices : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el || bagelTypes.length === 0) return;
    const scrollLeft = el.scrollLeft;
    const cardWidth = el.scrollWidth / bagelTypes.length;
    const index = Math.round(scrollLeft / cardWidth);
    setActiveBagel(Math.min(index, bagelTypes.length - 1));
  }, [bagelTypes.length]);

  const scrollCarousel = (dir: number) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 200, behavior: 'smooth' });
  };

  // Build pricing display string from DB
  const priceLine = (() => {
    if (pricing.length === 0) return null;
    const single = pricing.find(p => p.bagel_quantity === 1);
    const halfDozen = pricing.find(p => p.bagel_quantity === 6);
    const dozen = pricing.find(p => p.bagel_quantity === 12 || p.bagel_quantity === 13);
    const parts: string[] = [];
    if (single) parts.push(`$${single.price.toFixed(2)} each`);
    if (halfDozen) parts.push(`Half dozen $${halfDozen.price.toFixed(0)}`);
    if (dozen) parts.push(`${dozen.label || 'Dozen'} $${dozen.price.toFixed(0)}`);
    return parts;
  })();

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      <NavBar />

      {/* Page Header */}
      <div className="text-center px-5 py-9 md:py-12">
        <h1
          className="text-[2.2rem] md:text-[2.5rem] font-black mb-2"
          style={{ color: 'var(--blue)', fontFamily: 'var(--font-playfair)' }}
        >
          Our Menu
        </h1>
        <p
          className="text-[0.95rem] max-w-[420px] mx-auto"
          style={{ color: 'var(--text-secondary)' }}
        >
          Handcrafted sourdough bagels made with only five simple ingredients.
        </p>
      </div>

      {/* Ingredients Banner */}
      <div className="relative mx-5 mb-12 rounded-2xl overflow-hidden max-w-[900px] md:mx-auto">
        <Image
          src="/inside.jpg"
          alt="Bagel dough"
          width={900}
          height={280}
          className="w-full h-[280px] object-cover"
          style={{ objectPosition: 'center 60%' }}
        />
        <div
          className="absolute inset-0 flex flex-col justify-center px-7 py-8"
          style={{ background: 'linear-gradient(135deg, rgba(0,30,70,0.85), rgba(0,40,100,0.6))' }}
        >
          <span
            className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] mb-1.5"
            style={{ color: 'rgba(255,255,255,0.6)' }}
          >
            What goes in
          </span>
          <h2
            className="text-2xl font-bold text-white mb-5"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Only 5 Ingredients
          </h2>
          <div className="flex flex-wrap gap-2">
            {INGREDIENTS.map((ing) => (
              <span
                key={ing}
                className="px-4 py-2 rounded-full text-[0.82rem] font-medium text-white"
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(4px)',
                  WebkitBackdropFilter: 'blur(4px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                }}
              >
                {ing}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Bagel Carousel */}
      {!loading && bagelTypes.length > 0 && (
        <div className="pb-4">
          {/* Carousel header with arrows */}
          <div className="flex justify-between items-center px-5 mb-6 max-w-[900px] mx-auto">
            <h2
              className="text-[1.6rem] font-black"
              style={{ color: 'var(--blue)', fontFamily: 'var(--font-playfair)' }}
            >
              Our Bagels
            </h2>
            <div className="hidden md:flex gap-2">
              <button
                onClick={() => scrollCarousel(-1)}
                className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all hover:border-blue hover:bg-blue-light"
                style={{ border: '1.5px solid var(--border)', backgroundColor: 'var(--bg-card)' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--blue)">
                  <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                </svg>
              </button>
              <button
                onClick={() => scrollCarousel(1)}
                className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all hover:border-blue hover:bg-blue-light"
                style={{ border: '1.5px solid var(--border)', backgroundColor: 'var(--bg-card)' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--blue)">
                  <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Carousel track */}
          <div
            ref={trackRef}
            onScroll={handleScroll}
            className="flex gap-2 px-5 pb-2 overflow-x-auto scrollbar-hide"
            style={{
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {bagelTypes.map((bagel, i) => {
              const isActive = i === activeBagel;
              return (
                <div
                  key={bagel.id}
                  className="flex-shrink-0 text-center cursor-pointer px-1 py-3"
                  style={{
                    width: '150px',
                    scrollSnapAlign: 'center',
                    transform: isActive ? 'translateY(-6px)' : 'none',
                    transition: 'transform 0.3s',
                  }}
                  onClick={() => {
                    setActiveBagel(i);
                    const el = trackRef.current;
                    if (el) {
                      const cardWidth = el.scrollWidth / bagelTypes.length;
                      el.scrollTo({ left: cardWidth * i, behavior: 'smooth' });
                    }
                  }}
                >
                  <div className="w-[140px] h-[140px] mx-auto mb-3 flex items-center justify-center md:w-[180px] md:h-[180px]">
                    {bagel.image_url ? (
                      <Image
                        src={`/${bagel.image_url}`}
                        alt={bagel.name}
                        width={180}
                        height={180}
                        className="max-w-full max-h-full object-contain transition-all duration-300"
                        style={{
                          filter: isActive
                            ? 'drop-shadow(0 10px 24px rgba(0,74,173,0.25))'
                            : 'drop-shadow(0 6px 16px rgba(0,0,0,0.15))',
                          transform: isActive ? 'scale(1.05)' : 'scale(1)',
                        }}
                      />
                    ) : (
                      <span className="text-6xl">🥯</span>
                    )}
                  </div>
                  <h3
                    className="text-[0.95rem] font-bold transition-colors duration-300"
                    style={{
                      fontFamily: 'var(--font-playfair)',
                      color: isActive ? 'var(--brown)' : 'var(--blue)',
                    }}
                  >
                    {bagel.name}
                  </h3>
                </div>
              );
            })}
          </div>

          {/* Pricing line */}
          {priceLine && priceLine.length > 0 && (
            <div className="text-center px-5 pt-4 pb-10 max-w-[900px] mx-auto">
              <p className="text-base font-semibold" style={{ color: 'var(--brown)' }}>
                {priceLine[0]}
                {priceLine.slice(1).map((part, i) => (
                  <span key={i} className="font-normal text-[0.88rem]" style={{ color: 'var(--text-secondary)' }}>
                    {' · '}{part}
                  </span>
                ))}
              </p>
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="text-center py-16" style={{ color: 'var(--text-secondary)' }}>Loading menu...</div>
      )}

      {/* Place Your Order CTA */}
      <div className="text-center px-5 pb-12">
        <Link
          href="/order"
          className="inline-flex items-center gap-2 px-12 py-4 font-semibold text-[0.88rem] uppercase tracking-[0.08em] text-white transition-all hover:-translate-y-0.5"
          style={{ backgroundColor: 'var(--blue)' }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--blue-hover)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,74,173,0.2)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--blue)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          Place Your Order
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
            <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z"/>
          </svg>
        </Link>
      </div>

      {/* From Our Kitchen Gallery */}
      <div
        className="px-5 py-12 max-w-[900px] mx-auto"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <h2
          className="text-[1.6rem] font-black text-center mb-2"
          style={{ color: 'var(--blue)', fontFamily: 'var(--font-playfair)' }}
        >
          From Our Kitchen
        </h2>
        <p
          className="text-center text-[0.92rem] mb-7"
          style={{ color: 'var(--text-secondary)' }}
        >
          Boiled and baked fresh, every single batch.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {GALLERY_IMAGES.map((img, i) => (
            <div
              key={img.src}
              className={`relative overflow-hidden rounded-xl transition-transform duration-300 hover:scale-[1.02] ${
                i === 0 ? 'col-span-2 md:col-span-2 h-[240px] md:h-[280px]' : 'h-[200px] md:h-[220px]'
              }`}
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover"
                sizes={i === 0 ? '(max-width: 768px) 100vw, 66vw' : '(max-width: 768px) 50vw, 33vw'}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Blue CTA Banner */}
      <div
        className="text-center mx-5 mb-10 py-12 px-5 rounded-2xl max-w-[900px] md:mx-auto"
        style={{ backgroundColor: 'var(--blue)' }}
      >
        <h2
          className="text-[1.8rem] font-black text-white mb-2"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          Ready to order?
        </h2>
        <p
          className="text-[0.92rem] mb-6"
          style={{ color: 'rgba(255,255,255,0.7)' }}
        >
          Pick your time slot and build your box.
        </p>
        <Link
          href="/order"
          className="inline-block px-10 py-3.5 font-semibold text-[0.88rem] uppercase tracking-[0.06em] transition-all hover:-translate-y-0.5"
          style={{ backgroundColor: '#fff', color: 'var(--blue)' }}
          onMouseOver={(e) => {
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          Place Your Order
        </Link>
      </div>

      {/* Bottom spacer */}
      <div className="h-10" />
    </div>
  );
}
