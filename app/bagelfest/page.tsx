'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function BagelfestPage() {
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
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
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg)' }}>
      <style jsx>{`
        @keyframes wave {
          0%, 100% { transform: rotate(0deg); }
          15% { transform: rotate(14deg); }
          30% { transform: rotate(-8deg); }
          40% { transform: rotate(10deg); }
          50% { transform: rotate(-4deg); }
          60% { transform: rotate(0deg); }
        }
        @keyframes bobble1 {
          0%, 100% { transform: translateY(0) rotate(-12deg); }
          50% { transform: translateY(-8px) rotate(-12deg); }
        }
        @keyframes bobble2 {
          0%, 100% { transform: translateY(0) rotate(5deg); }
          50% { transform: translateY(-8px) rotate(5deg); }
        }
        @keyframes bobble3 {
          0%, 100% { transform: translateY(0) rotate(-8deg); }
          50% { transform: translateY(-8px) rotate(-8deg); }
        }
      `}</style>

      {/* 1. CENTERED LOGO */}
      <div className="flex justify-center pt-4 pb-0 px-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.svg"
          alt="Paige's Bagels"
          className="h-16 w-auto"
        />
      </div>

      {/* 2. WELCOME HEADER */}
      <div className="text-center px-6 pt-5 pb-9">
        <span
          className="inline-block text-[3rem] mb-3"
          style={{ animation: 'wave 2s ease-in-out infinite', transformOrigin: '70% 70%' }}
        >
          👋
        </span>
        <h1
          className="text-[2.2rem] font-black mb-3"
          style={{ fontFamily: 'var(--font-playfair)', color: 'var(--blue)', lineHeight: 1.15 }}
        >
          Hey, <em className="font-bold" style={{ color: 'var(--brown)' }}>Bagel Fest!</em>
        </h1>
        <p
          className="text-[1rem] leading-relaxed mx-auto"
          style={{ color: '#6b7280', maxWidth: 360 }}
        >
          You just tried Chicago&apos;s best sourdough bagels. Now order them fresh &mdash; every week.
        </p>
      </div>

      {/* 3. FLOATING BAGELS */}
      <div className="relative mx-auto" style={{ height: 100, maxWidth: 360, width: '100%', marginTop: -10 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/everythingtrans.png"
          alt=""
          className="absolute object-contain"
          style={{
            width: 90, height: 90, left: '10%', top: 0,
            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.12))',
            animation: 'bobble1 3s ease-in-out infinite',
          }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/plaintrans.png"
          alt=""
          className="absolute object-contain"
          style={{
            width: 90, height: 90, left: '38%', top: 10,
            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.12))',
            animation: 'bobble2 3s ease-in-out 0.5s infinite',
          }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/sesametrans.png"
          alt=""
          className="absolute object-contain"
          style={{
            width: 90, height: 90, left: '66%', top: 0,
            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.12))',
            animation: 'bobble3 3s ease-in-out 1s infinite',
          }}
        />
      </div>

      {/* 4. EMAIL SIGNUP CARD */}
      <div className="px-5 pb-10 pt-6" style={{ maxWidth: 440, margin: '0 auto', width: '100%' }}>
        <div
          className="rounded-2xl"
          style={{
            backgroundColor: '#fff',
            border: '1.5px solid var(--border)',
            padding: '32px 24px',
            boxShadow: '0 8px 32px rgba(0,74,173,0.06)',
          }}
        >
          {status === 'success' ? (
            <div className="text-center py-6">
              <div
                className="inline-flex items-center justify-center mb-3.5"
                style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: '#f0fdf4' }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="#15803d">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </div>
              <h3
                className="text-[1.3rem] font-black mb-1.5"
                style={{ fontFamily: 'var(--font-playfair)', color: 'var(--blue)' }}
              >
                You&apos;re in! 🎉
              </h3>
              <p className="text-[0.9rem]" style={{ color: '#6b7280' }}>
                Keep an eye on your inbox &mdash; fresh bagels are coming your way.
              </p>
            </div>
          ) : (
            <>
              <h2
                className="text-[1.35rem] font-black text-center mb-1"
                style={{ fontFamily: 'var(--font-playfair)', color: 'var(--blue)' }}
              >
                Get Fresh Bagels Weekly
              </h2>
              <p className="text-[0.88rem] text-center mb-5" style={{ color: '#6b7280' }}>
                Join the list for weekly ordering &amp; new flavor drops.
              </p>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <input
                    type="text"
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-3.5 text-[0.9rem] outline-none transition-all rounded-xl"
                    style={{
                      border: '1.5px solid var(--border)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--blue)',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--blue)')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                  />
                </div>
                <div className="mb-3">
                  <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3.5 text-[0.9rem] outline-none transition-all rounded-xl"
                    style={{
                      border: '1.5px solid var(--border)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--blue)',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--blue)')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                  />
                </div>
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full py-4 font-semibold text-[0.92rem] tracking-[0.04em] text-white rounded-xl transition-all hover:-translate-y-0.5"
                  style={{
                    backgroundColor: 'var(--blue)',
                    border: 'none',
                    cursor: 'pointer',
                    marginTop: 4,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#003a8c';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,74,173,0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--blue)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {status === 'loading' ? '...' : 'Join the List'}
                </button>
              </form>
              <p className="text-center text-[0.72rem] mt-3" style={{ color: '#aaa' }}>
                No spam. Just bagels. Unsubscribe anytime.
              </p>
              {status === 'error' && (
                <p className="text-center text-[0.78rem] mt-2" style={{ color: '#ef4444' }}>
                  {message}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* 5. HOW IT WORKS */}
      <div className="px-5 pb-11" style={{ maxWidth: 440, margin: '0 auto', width: '100%' }}>
        <h2
          className="text-[1.3rem] font-black text-center mb-6"
          style={{ fontFamily: 'var(--font-playfair)', color: 'var(--blue)' }}
        >
          How It Works
        </h2>
        <div className="flex flex-col gap-0">
          {[
            { num: 1, title: 'Order Online', desc: 'Pick your bagels and choose a pickup time — we sell Wednesdays & Sundays.' },
            { num: 2, title: 'Pick Up Fresh', desc: 'Every batch is hand-shaped, boiled, and baked fresh for your order.' },
            { num: 3, title: 'Eat & Enjoy', desc: 'Crispy crust, soft center, seriously good sourdough. You\'re welcome.' },
          ].map((step, i) => (
            <div key={step.num} className="flex gap-4">
              {/* Left: number + connector line */}
              <div className="flex flex-col items-center">
                <div
                  className="flex items-center justify-center font-bold text-[0.85rem] flex-shrink-0"
                  style={{
                    width: 36, height: 36, borderRadius: '50%',
                    backgroundColor: 'var(--blue-light)', color: 'var(--blue)',
                  }}
                >
                  {step.num}
                </div>
                {i < 2 && (
                  <div className="flex-1" style={{ width: 2, backgroundColor: 'var(--blue-light)', minHeight: 28 }} />
                )}
              </div>
              {/* Right: content */}
              <div className="pb-6">
                <h3
                  className="font-bold text-[0.95rem] mb-0.5"
                  style={{ color: 'var(--blue)' }}
                >
                  {step.title}
                </h3>
                <p className="text-[0.85rem] leading-relaxed" style={{ color: '#6b7280' }}>
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. ORDER CTA */}
      <div className="px-5 pb-8" style={{ maxWidth: 440, margin: '0 auto', width: '100%' }}>
        <p
          className="text-center text-[0.85rem] font-medium mb-3"
          style={{ color: '#6b7280' }}
        >
          Ready to try them at home?
        </p>
        <Link
          href="/order"
          className="flex items-center justify-center gap-2 w-full py-4 font-semibold text-[0.92rem] tracking-[0.04em] text-white rounded-xl transition-all hover:-translate-y-0.5"
          style={{ backgroundColor: 'var(--blue)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#003a8c';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,74,173,0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--blue)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          Place Your First Order
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
            <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
          </svg>
        </Link>
      </div>

      {/* 7. INSTAGRAM LINK */}
      <div className="flex justify-center pb-10">
        <a
          href="https://instagram.com/paigesbagels"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-[0.88rem] font-medium rounded-full transition-all hover:-translate-y-0.5"
          style={{
            border: '1.5px solid var(--border)',
            color: 'var(--blue)',
            backgroundColor: '#fff',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
          </svg>
          @paigesbagels
        </a>
      </div>

      {/* 8. BRAND CLOSER */}
      <div className="text-center pb-12">
        <p
          className="text-[1.4rem] italic font-bold"
          style={{ fontFamily: 'var(--font-playfair)', color: 'var(--blue)', opacity: 0.25 }}
        >
          Seriously Sourdough.
        </p>
      </div>
    </div>
  );
}
