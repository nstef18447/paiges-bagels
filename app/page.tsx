'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BagelType } from '@/types';
import NavBar from '@/components/NavBar';

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

      {/* Hero — full-bleed photo with gradient overlay */}
      <div
        className="relative flex items-start pt-40 md:items-center md:pt-0 md:justify-center overflow-hidden"
        style={{ height: '100svh', minHeight: '600px' }}
      >
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/background-photo.jpeg"
            alt=""
            fill
            className="object-cover"
            style={{ objectPosition: 'center 30%' }}
            priority
          />
          {/* Gradient overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to bottom, rgba(0,12,35,0.78) 0%, rgba(0,15,40,0.45) 35%, rgba(0,15,40,0.1) 65%, rgba(0,15,40,0.05) 100%)',
            }}
          />
        </div>

        {/* Hero content */}
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

      {/* Swipeable Bagel Menu */}
      {bagelTypes.length > 0 && (
        <div className="py-6 sm:py-8 px-4" style={{ backgroundColor: '#f6f4f0' }}>
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
                  style={{ color: '#7a4900' }}
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
