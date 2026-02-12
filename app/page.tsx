'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BagelType } from '@/types';

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
      {/* Logo Banner — thin strip */}
      <div className="flex justify-center overflow-hidden">
        <Image
          src="/logo.svg"
          alt="Paige's Bagels"
          width={375}
          height={375}
          priority
          unoptimized
          className="w-auto h-auto max-w-[380px] sm:max-w-[550px] lg:max-w-[700px] -mt-20 sm:-mt-24 lg:-mt-28 -mb-24 sm:-mb-32 lg:-mb-40"
        />
      </div>

      {/* Hero Image Section — tagline + nav only, fixed height */}
      <div className="relative h-[50vh] sm:h-[60vh] flex flex-col items-center">
        <Image
          src="/hero-bg.jpg"
          alt=""
          fill
          className="object-cover object-[50%_65%]"
          priority
        />
        <div className="absolute inset-0 bg-black/25" />

        <div className="relative z-10 flex flex-col items-center justify-start pt-6 sm:justify-center sm:pt-0 flex-1">
          {/* Tagline */}
          <p className="text-white text-4xl sm:text-4xl lg:text-5xl italic tracking-wide drop-shadow-md mb-8 text-center px-6">
            Sourdough bagels worth waking up for
          </p>

        </div>
      </div>

      {/* Navigation Bar */}
      <nav className="flex overflow-x-auto gap-6 justify-center scrollbar-hide py-4 px-6" style={{ backgroundColor: '#f6f4f0' }}>
        <Link href="/about" className="whitespace-nowrap font-semibold tracking-widest transition-all hover:scale-105" style={{ color: '#004AAD' }}>
          ABOUT
        </Link>
        <Link href="/menu" className="whitespace-nowrap font-semibold tracking-widest transition-all hover:scale-105" style={{ color: '#004AAD' }}>
          MENU
        </Link>
        <Link href="/order" className="whitespace-nowrap font-semibold tracking-widest transition-all hover:scale-105" style={{ color: '#004AAD' }}>
          ORDER NOW
        </Link>
        <Link href="/contact" className="whitespace-nowrap font-semibold tracking-widest transition-all hover:scale-105" style={{ color: '#004AAD' }}>
          CONTACT
        </Link>
      </nav>

      {/* Swipeable Bagel Menu */}
      {bagelTypes.length > 0 && (
        <div className="py-8 px-4" style={{ backgroundColor: '#f6f4f0' }}>
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
                className="flex-shrink-0 snap-center w-[85vw] sm:w-[300px]"
              >
                <p
                  className="text-center font-extrabold text-xl mb-2"
                  style={{ color: '#004AAD' }}
                >
                  {bagel.name}
                </p>
                <div className="rounded-xl overflow-hidden">
                  {bagel.image_url ? (
                    <div className="relative h-[85vw] sm:h-[300px]">
                      <Image
                        src={`/${bagel.image_url}`}
                        alt={bagel.name}
                        fill
                        className="object-cover"
                        sizes="85vw"
                      />
                    </div>
                  ) : (
                    <div
                      className="flex items-center justify-center h-[85vw] sm:h-[300px]"
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

      {/* Order Button */}
      <div className="text-center py-6" style={{ backgroundColor: '#f6f4f0' }}>
        <Link
          href="/order"
          className="inline-block px-8 py-3 text-white font-bold text-lg rounded-lg transition-all hover:scale-105"
          style={{ backgroundColor: '#004AAD' }}
        >
          Order Bagels
        </Link>
      </div>

      {/* Stay In The Know */}
      <div className="py-8 px-6" style={{ backgroundColor: '#f6f4f0' }}>
        <div className="max-w-md mx-auto">
          <p
            className="text-center font-semibold tracking-wide mb-3"
            style={{ color: '#004AAD' }}
          >
            Stay In The Know
          </p>
          {status === 'success' ? (
            <p className="text-center text-sm" style={{ color: '#004AAD' }}>{message}</p>
          ) : (
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-blue-500"
                style={{ backgroundColor: '#FFFFFF' }}
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="px-5 py-2.5 rounded-lg text-white font-semibold text-sm transition-all hover:scale-105"
                style={{ backgroundColor: '#004AAD' }}
              >
                {status === 'loading' ? '...' : 'Join'}
              </button>
            </form>
          )}
          {status === 'error' && (
            <p className="text-center text-sm text-red-500 mt-2">{message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
