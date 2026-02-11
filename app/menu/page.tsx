'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BagelType } from '@/types';

export default function MenuPage() {
  const [bagelTypes, setBagelTypes] = useState<BagelType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    fetch('/api/bagel-types')
      .then((res) => res.json())
      .then((data) => setBagelTypes(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const prev = useCallback(() => {
    setActiveIndex((i) => (i > 0 ? i - 1 : bagelTypes.length - 1));
  }, [bagelTypes.length]);

  const next = useCallback(() => {
    setActiveIndex((i) => (i < bagelTypes.length - 1 ? i + 1 : 0));
  }, [bagelTypes.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [prev, next]);

  const heroData = bagelTypes.find((b) => b.calories != null);
  const activeBagel = bagelTypes[activeIndex];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f6f4f0' }}>
      <div className="max-w-5xl mx-auto px-6 pb-16">
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
        <nav className="flex justify-center gap-8 mb-8">
          <Link
            href="/about"
            className="font-semibold tracking-widest transition-all hover:scale-105"
            style={{ color: '#004AAD' }}
          >
            ABOUT
          </Link>
          <Link
            href="/menu"
            className="font-semibold tracking-widest transition-all"
            style={{ color: '#1A1A1A', borderBottom: '2px solid #004AAD' }}
          >
            MENU
          </Link>
          <Link
            href="/order"
            className="font-semibold tracking-widest transition-all hover:scale-105"
            style={{ color: '#004AAD' }}
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
        {/* Hero: Inside photo + Ingredients & Macros */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Inside photo */}
            <div className="relative h-72 md:h-auto md:min-h-[360px]">
              <Image
                src="/inside.jpg"
                alt="Inside a Paige's Bagel"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </div>

            {/* Ingredients & Macros */}
            <div className="p-6 md:p-8 flex flex-col justify-center">
              <h2
                className="text-2xl font-bold mb-4"
                style={{ color: '#004AAD' }}
              >
                Sourdough Bagels
              </h2>

              {heroData?.description && (
                <div className="mb-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                    Ingredients
                  </p>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {heroData.description}
                  </p>
                </div>
              )}

              {heroData?.calories != null && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                    Nutrition per Bagel
                  </p>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-gray-50 rounded-lg py-3">
                      <p className="text-xl font-bold" style={{ color: '#004AAD' }}>
                        {heroData.calories}
                      </p>
                      <p className="text-xs text-gray-400">cal</p>
                    </div>
                    {heroData.protein_g != null && (
                      <div className="bg-gray-50 rounded-lg py-3">
                        <p className="text-xl font-bold" style={{ color: '#004AAD' }}>
                          {heroData.protein_g}g
                        </p>
                        <p className="text-xs text-gray-400">protein</p>
                      </div>
                    )}
                    {heroData.carbs_g != null && (
                      <div className="bg-gray-50 rounded-lg py-3">
                        <p className="text-xl font-bold" style={{ color: '#004AAD' }}>
                          {heroData.carbs_g}g
                        </p>
                        <p className="text-xs text-gray-400">carbs</p>
                      </div>
                    )}
                    {heroData.fat_g != null && (
                      <div className="bg-gray-50 rounded-lg py-3">
                        <p className="text-xl font-bold" style={{ color: '#004AAD' }}>
                          {heroData.fat_g}g
                        </p>
                        <p className="text-xs text-gray-400">fat</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!heroData?.description && !heroData?.calories && (
                <p className="text-gray-400 text-sm">
                  Ingredients and nutrition info coming soon!
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Bagel Carousel */}
        {!loading && bagelTypes.length > 0 && (
          <div className="mt-12">
            <h2
              className="text-2xl font-bold mb-8 text-center"
              style={{ color: '#004AAD' }}
            >
              Our Bagels
            </h2>

            <div className="relative flex items-center">
              {/* Left Arrow */}
              <button
                onClick={prev}
                className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-md hover:shadow-lg transition-all hover:scale-110 mr-3"
                style={{ color: '#004AAD' }}
                aria-label="Previous bagel"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>

              {/* All Bagels in a Row */}
              <div className="flex-1 overflow-hidden">
                <div
                  className="flex items-end gap-4 transition-transform duration-300 ease-in-out"
                  style={{
                    transform: `translateX(calc(50% - ${activeIndex * 220 + 110}px))`,
                  }}
                >
                  {bagelTypes.map((bagel, i) => {
                    const isActive = i === activeIndex;
                    return (
                      <button
                        key={bagel.id}
                        onClick={() => setActiveIndex(i)}
                        className="flex-shrink-0 transition-all duration-300 ease-in-out focus:outline-none"
                        style={{
                          width: isActive ? '220px' : '160px',
                          opacity: isActive ? 1 : 0.5,
                          transform: isActive ? 'scale(1)' : 'scale(0.9)',
                        }}
                      >
                        <div
                          className="bg-white rounded-xl overflow-hidden transition-all duration-300"
                          style={{
                            border: isActive ? '2px solid #004AAD' : '1px solid #E5E7EB',
                            boxShadow: isActive ? '0 8px 25px rgba(0, 74, 173, 0.15)' : 'none',
                          }}
                        >
                          {bagel.image_url ? (
                            <div className="relative" style={{ height: isActive ? '220px' : '160px' }}>
                              <Image
                                src={`/${bagel.image_url}`}
                                alt={bagel.name}
                                fill
                                className="object-cover transition-all duration-300"
                                sizes="220px"
                              />
                            </div>
                          ) : (
                            <div
                              className="flex items-center justify-center transition-all duration-300"
                              style={{
                                height: isActive ? '220px' : '160px',
                                backgroundColor: '#E8F0FE',
                              }}
                            >
                              <span className={isActive ? 'text-6xl' : 'text-4xl'}>🥯</span>
                            </div>
                          )}
                          <div className="py-3 text-center">
                            <h3
                              className="font-bold transition-all duration-300"
                              style={{
                                color: isActive ? '#004AAD' : '#9CA3AF',
                                fontSize: isActive ? '1.1rem' : '0.85rem',
                              }}
                            >
                              {bagel.name}
                            </h3>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Arrow */}
              <button
                onClick={next}
                className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-md hover:shadow-lg transition-all hover:scale-110 ml-3"
                style={{ color: '#004AAD' }}
                aria-label="Next bagel"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-16 text-gray-400">Loading menu...</div>
        )}

        {/* Order CTA */}
        <div className="text-center mt-12">
          <Link
            href="/order"
            className="inline-block px-8 py-3 text-white font-bold text-lg rounded-lg transition-all hover:scale-105"
            style={{ backgroundColor: '#004AAD' }}
          >
            Order Now
          </Link>
        </div>
      </div>
    </div>
  );
}
