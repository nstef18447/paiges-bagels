'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

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

      {/* Hero Image Section — nav + subscribe overlaid */}
      <div className="relative flex-1 flex flex-col items-center justify-center">
        <Image
          src="/hero-bg.jpg"
          alt=""
          fill
          className="object-cover object-[50%_80%] sm:object-[50%_65%]"
          priority
        />
        <div className="absolute inset-0 bg-black/40" />

        <div className="relative z-10 flex flex-col items-center justify-center py-16">
          {/* Navigation Bar */}
          <nav className="flex flex-col sm:flex-row gap-4 sm:gap-16 lg:gap-20 items-center">
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

          {/* In The Know */}
          <div className="mt-10 sm:mt-14 w-full max-w-md px-6">
            <p className="text-center font-semibold tracking-wide mb-3 text-white drop-shadow-md">
              Stay In The Know
            </p>
            {status === 'success' ? (
              <p className="text-center text-sm text-white drop-shadow-md">{message}</p>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 px-4 py-2.5 rounded-lg border border-white/30 text-sm focus:outline-none focus:border-white text-white placeholder-white/60"
                  style={{ backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)' }}
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
              <p className="text-center text-sm text-red-300 mt-2">{message}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
