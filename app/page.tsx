'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BagelType } from '@/types';

export default function Home() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [bagelTypes, setBagelTypes] = useState<BagelType[]>([]);

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
          className="object-cover object-[50%_95%] sm:object-[50%_65%]"
          priority
        />
        <div className="absolute inset-0 bg-black/40" />

        <div className="relative z-10 flex flex-col items-center justify-start pt-6 sm:justify-center sm:pt-0 flex-1">
          {/* Tagline */}
          <p className="text-white text-4xl sm:text-4xl lg:text-5xl italic tracking-wide drop-shadow-md mb-8 text-center px-6">
            Sourdough bagels worth waking up for
          </p>

          {/* Navigation Bar */}
          <nav className="flex flex-col sm:flex-row gap-4 sm:gap-16 lg:gap-20 items-center mt-8 sm:mt-0">
            <Link
              href="/about"
              className="text-3xl sm:text-3xl lg:text-4xl font-extrabold tracking-widest transition-all hover:scale-105 text-white drop-shadow-md"
            >
              ABOUT
            </Link>
            <Link
              href="/menu"
              className="text-3xl sm:text-3xl lg:text-4xl font-extrabold tracking-widest transition-all hover:scale-105 text-white drop-shadow-md"
            >
              MENU
            </Link>
            <Link
              href="/order"
              className="text-3xl sm:text-3xl lg:text-4xl font-extrabold tracking-widest transition-all hover:scale-105 text-white drop-shadow-md"
            >
              ORDER
            </Link>
            <Link
              href="/contact"
              className="text-3xl sm:text-3xl lg:text-4xl font-extrabold tracking-widest transition-all hover:scale-105 text-white drop-shadow-md"
            >
              CONTACT
            </Link>
          </nav>
        </div>
      </div>

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
            className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {bagelTypes.map((bagel) => (
              <Link
                key={bagel.id}
                href="/order"
                className="flex-shrink-0 snap-center w-[200px] sm:w-[240px]"
              >
                <div className="rounded-xl overflow-hidden">
                  {bagel.image_url ? (
                    <div className="relative h-[200px] sm:h-[240px]">
                      <Image
                        src={`/${bagel.image_url}`}
                        alt={bagel.name}
                        fill
                        className="object-cover"
                        sizes="240px"
                      />
                    </div>
                  ) : (
                    <div
                      className="flex items-center justify-center h-[200px] sm:h-[240px]"
                      style={{ backgroundColor: '#E8F0FE' }}
                    >
                      <span className="text-5xl">🥯</span>
                    </div>
                  )}
                </div>
                <p
                  className="text-center font-extrabold mt-2 text-lg"
                  style={{ color: '#004AAD' }}
                >
                  {bagel.name}
                </p>
              </Link>
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
