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

            <div className="relative flex items-center justify-center">
              {/* Left Arrow */}
              <button
                onClick={prev}
                className="absolute left-0 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-md hover:shadow-lg transition-all hover:scale-110"
                style={{ color: '#004AAD' }}
                aria-label="Previous bagel"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>

              {/* Active Bagel */}
              <div className="w-full max-w-sm mx-16">
                <div className="bg-white rounded-xl overflow-hidden border border-gray-200 transition-all">
                  {activeBagel?.image_url ? (
                    <div className="relative w-full h-72 sm:h-80">
                      <Image
                        src={`/${activeBagel.image_url}`}
                        alt={activeBagel.name}
                        fill
                        className="object-cover"
                        sizes="400px"
                        key={activeBagel.id}
                      />
                    </div>
                  ) : (
                    <div
                      className="w-full h-72 sm:h-80 flex items-center justify-center"
                      style={{ backgroundColor: '#E8F0FE' }}
                    >
                      <span className="text-8xl">🥯</span>
                    </div>
                  )}
                  <div className="p-5 text-center">
                    <h3
                      className="text-2xl font-bold"
                      style={{ color: '#004AAD' }}
                    >
                      {activeBagel?.name}
                    </h3>
                  </div>
                </div>

                {/* Dots */}
                <div className="flex justify-center gap-2 mt-4">
                  {bagelTypes.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveIndex(i)}
                      className="w-2.5 h-2.5 rounded-full transition-all"
                      style={{
                        backgroundColor: i === activeIndex ? '#004AAD' : '#D1D5DB',
                        transform: i === activeIndex ? 'scale(1.3)' : 'scale(1)',
                      }}
                      aria-label={`Go to bagel ${i + 1}`}
                    />
                  ))}
                </div>
              </div>

              {/* Right Arrow */}
              <button
                onClick={next}
                className="absolute right-0 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-md hover:shadow-lg transition-all hover:scale-110"
                style={{ color: '#004AAD' }}
                aria-label="Next bagel"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
