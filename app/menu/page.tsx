'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BagelType } from '@/types';

export default function MenuPage() {
  const [bagelTypes, setBagelTypes] = useState<BagelType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/bagel-types')
      .then((res) => res.json())
      .then((data) => setBagelTypes(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f6f4f0' }}>
      {/* Header */}
      <div className="text-center pt-8 pb-4">
        <Link href="/">
          <Image
            src="/logo.svg"
            alt="Paige's Bagels"
            width={200}
            height={200}
            unoptimized
            className="w-auto h-auto max-w-[200px] mx-auto cursor-pointer"
            priority
          />
        </Link>
        <h1
          className="text-4xl font-bold tracking-wide mt-2"
          style={{ color: '#004AAD' }}
        >
          MENU
        </h1>
        <p className="text-gray-500 mt-1">Fresh sourdough, made from scratch</p>
      </div>

      {/* Bagel Grid */}
      <div className="max-w-4xl mx-auto px-6 pb-16">
        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading menu...</div>
        ) : bagelTypes.length === 0 ? (
          <div className="text-center py-16 text-gray-400">Menu coming soon!</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
            {bagelTypes.map((bagel) => (
              <div
                key={bagel.id}
                className="bg-white rounded-xl overflow-hidden border border-gray-200"
              >
                {/* Photo */}
                {bagel.image_url ? (
                  <div className="relative w-full h-56">
                    <Image
                      src={`/${bagel.image_url}`}
                      alt={bagel.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 50vw"
                    />
                  </div>
                ) : (
                  <div
                    className="w-full h-56 flex items-center justify-center"
                    style={{ backgroundColor: '#E8F0FE' }}
                  >
                    <span className="text-6xl">🥯</span>
                  </div>
                )}

                {/* Info */}
                <div className="p-5">
                  <h2
                    className="text-xl font-bold mb-2"
                    style={{ color: '#004AAD' }}
                  >
                    {bagel.name}
                  </h2>

                  {/* Ingredients */}
                  {bagel.description && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
                        Ingredients
                      </p>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {bagel.description}
                      </p>
                    </div>
                  )}

                  {/* Macros */}
                  {bagel.calories != null && (
                    <div className="border-t border-gray-100 pt-3 mt-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                        Nutrition
                      </p>
                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div className="bg-gray-50 rounded-lg py-2">
                          <p className="text-lg font-bold" style={{ color: '#004AAD' }}>
                            {bagel.calories}
                          </p>
                          <p className="text-xs text-gray-400">cal</p>
                        </div>
                        {bagel.protein_g != null && (
                          <div className="bg-gray-50 rounded-lg py-2">
                            <p className="text-lg font-bold" style={{ color: '#004AAD' }}>
                              {bagel.protein_g}g
                            </p>
                            <p className="text-xs text-gray-400">protein</p>
                          </div>
                        )}
                        {bagel.carbs_g != null && (
                          <div className="bg-gray-50 rounded-lg py-2">
                            <p className="text-lg font-bold" style={{ color: '#004AAD' }}>
                              {bagel.carbs_g}g
                            </p>
                            <p className="text-xs text-gray-400">carbs</p>
                          </div>
                        )}
                        {bagel.fat_g != null && (
                          <div className="bg-gray-50 rounded-lg py-2">
                            <p className="text-lg font-bold" style={{ color: '#004AAD' }}>
                              {bagel.fat_g}g
                            </p>
                            <p className="text-xs text-gray-400">fat</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
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
