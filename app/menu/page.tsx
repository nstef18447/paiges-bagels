'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BagelType } from '@/types';

export default function MenuPage() {
  const [bagelTypes, setBagelTypes] = useState<BagelType[]>([]);
  const [loading, setLoading] = useState(true);
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
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const heroData = bagelTypes.find((b) => b.calories != null);

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
        <nav className="flex overflow-x-auto gap-6 justify-center scrollbar-hide mb-8">
          <Link
            href="/about"
            className="whitespace-nowrap font-semibold tracking-widest transition-all hover:scale-105"
            style={{ color: '#004AAD' }}
          >
            ABOUT
          </Link>
          <Link
            href="/menu"
            className="whitespace-nowrap font-semibold tracking-widest transition-all"
            style={{ color: '#1A1A1A', borderBottom: '2px solid #004AAD' }}
          >
            MENU
          </Link>
          <Link
            href="/order"
            className="whitespace-nowrap font-semibold tracking-widest transition-all hover:scale-105"
            style={{ color: '#004AAD' }}
          >
            ORDER NOW
          </Link>
          <Link
            href="/merch"
            className="whitespace-nowrap font-semibold tracking-widest transition-all hover:scale-105"
            style={{ color: '#004AAD' }}
          >
            MERCH
          </Link>
          <Link
            href="/contact"
            className="whitespace-nowrap font-semibold tracking-widest transition-all hover:scale-105"
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
                style={{ objectPosition: '50% 60%' }}
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

              <div className="mb-5">
                <p className="text-base font-semibold mb-3" style={{ color: '#004AAD' }}>
                  Only 5 Ingredients
                </p>
                <ul className="text-lg text-gray-600 leading-loose list-disc list-inside">
                  <li>Sourdough Starter</li>
                  <li>Water</li>
                  <li>Sugar</li>
                  <li>Salt</li>
                  <li>Bread Flour</li>
                </ul>
              </div>

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

            </div>
          </div>
        </div>

        {/* Swipeable Bagel Menu */}
        {!loading && bagelTypes.length > 0 && (
          <div className="py-8 px-4 mt-4">
            <h2
              className="text-2xl font-extrabold text-center mb-6 underline underline-offset-4"
              style={{ color: '#004AAD' }}
            >
              Our Bagels
            </h2>
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide px-4"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {bagelTypes.map((bagel) => (
                <Link
                  key={bagel.id}
                  href="/order"
                  className="flex-shrink-0 snap-center w-[70vw] sm:w-[250px]"
                >
                  <p
                    className="text-center font-extrabold text-xl mb-2"
                    style={{ color: '#004AAD' }}
                  >
                    {bagel.name}
                  </p>
                  <div className="rounded-xl overflow-hidden">
                    {bagel.image_url ? (
                      <div className="relative h-[70vw] sm:h-[250px]">
                        <Image
                          src={`/${bagel.image_url}`}
                          alt={bagel.name}
                          fill
                          className="object-contain"
                          sizes="70vw"
                        />
                      </div>
                    ) : (
                      <div
                        className="flex items-center justify-center h-[70vw] sm:h-[250px]"
                        style={{ backgroundColor: '#E8F0FE' }}
                      >
                        <span className="text-6xl">🥯</span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
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
