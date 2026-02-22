'use client';

import { useState } from 'react';
import Image from 'next/image';
import NavBar from '@/components/NavBar';

const INSTA_URL = 'https://instagram.com/paigesbagels';

const GRID_IMAGES = [
  { src: '/bagels.jpg', alt: 'Fresh bagels' },
  { src: '/inside.jpg', alt: 'Inside a bagel' },
  { src: '/plain.jpg', alt: 'Plain bagel' },
  { src: '/everything.jpg', alt: 'Everything bagel' },
  { src: '/sesame.jpg', alt: 'Sesame bagel' },
];

function InstagramIcon({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="white">
      <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/>
    </svg>
  );
}

export default function ContactPage() {
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
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      <NavBar />

      {/* Page Header */}
      <div className="text-center px-5 py-9 md:py-[52px]">
        <h1
          className="text-[2.2rem] md:text-[2.8rem] font-black mb-2"
          style={{ color: 'var(--blue)', fontFamily: 'var(--font-playfair)' }}
        >
          Get In Touch
        </h1>
        <p
          className="text-[0.95rem] max-w-[480px] mx-auto"
          style={{ color: 'var(--text-secondary)' }}
        >
          Questions, catering, or just want to say hi? We&apos;d love to hear from you.
        </p>
      </div>

      {/* Instagram Section */}
      <div className="max-w-[900px] mx-auto px-5 pb-12">
        {/* Social header */}
        <div className="text-center mb-6">
          <div
            className="w-12 h-12 rounded-xl inline-flex items-center justify-center mb-4"
            style={{ background: 'linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }}
          >
            <InstagramIcon />
          </div>
          <h2
            className="text-[1.6rem] font-black mb-1"
            style={{ color: 'var(--blue)', fontFamily: 'var(--font-playfair)' }}
          >
            Follow the Bake
          </h2>
          <div
            className="text-base font-semibold mb-2"
            style={{ color: 'var(--brown)' }}
          >
            @paigesbagels
          </div>
          <p
            className="text-[0.9rem] max-w-[360px] mx-auto"
            style={{ color: 'var(--text-secondary)' }}
          >
            Behind-the-scenes bakes, new flavors, and pickup day drops.
          </p>
        </div>

        {/* Instagram grid */}
        <div
          className="grid grid-cols-3 gap-1 md:gap-1.5 rounded-2xl overflow-hidden mb-5"
        >
          {GRID_IMAGES.map((img, i) => (
            <a
              key={img.src}
              href={INSTA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`relative block overflow-hidden group ${
                i === 0 ? 'col-span-2 row-span-2' : ''
              }`}
              style={{ aspectRatio: '1' }}
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover transition-all duration-400 group-hover:scale-[1.08] group-hover:brightness-[0.85]"
                sizes={i === 0 ? '66vw' : '33vw'}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-all duration-300" />
            </a>
          ))}
        </div>

        {/* Follow button */}
        <div className="flex justify-center">
          <a
            href={INSTA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-9 py-3.5 font-semibold text-[0.88rem] tracking-[0.04em] text-white transition-all hover:-translate-y-0.5"
            style={{ backgroundColor: 'var(--blue)' }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--blue-hover)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--blue)'}
          >
            <InstagramIcon size={18} />
            Follow @paigesbagels
          </a>
        </div>
      </div>

      {/* Contact Cards */}
      <div className="max-w-[900px] mx-auto px-5 pb-12 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Email card */}
        <div
          className="rounded-2xl p-7 text-center transition-all duration-300 hover:-translate-y-[3px]"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border)',
          }}
          onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,74,173,0.06)'}
          onMouseOut={(e) => e.currentTarget.style.boxShadow = 'none'}
        >
          <div
            className="w-11 h-11 rounded-xl inline-flex items-center justify-center mb-4"
            style={{ backgroundColor: 'var(--blue-light)' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="var(--blue)">
              <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>
          </div>
          <h3
            className="text-[1.1rem] font-bold mb-1.5"
            style={{ color: 'var(--blue)', fontFamily: 'var(--font-playfair)' }}
          >
            Email
          </h3>
          <p
            className="text-[0.88rem] mb-3"
            style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}
          >
            For orders, catering, or general questions
          </p>
          <a
            href="mailto:paige@paigesbagels.com"
            className="text-[0.95rem] font-semibold transition-colors hover:text-brown"
            style={{ color: 'var(--blue)' }}
          >
            paige@paigesbagels.com
          </a>
        </div>

        {/* DM card */}
        <div
          className="rounded-2xl p-7 text-center transition-all duration-300 hover:-translate-y-[3px]"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border)',
          }}
          onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,74,173,0.06)'}
          onMouseOut={(e) => e.currentTarget.style.boxShadow = 'none'}
        >
          <div
            className="w-11 h-11 rounded-xl inline-flex items-center justify-center mb-4"
            style={{ backgroundColor: 'var(--blue-light)' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="var(--blue)">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
            </svg>
          </div>
          <h3
            className="text-[1.1rem] font-bold mb-1.5"
            style={{ color: 'var(--blue)', fontFamily: 'var(--font-playfair)' }}
          >
            DM Us
          </h3>
          <p
            className="text-[0.88rem] mb-3"
            style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}
          >
            Quickest way to reach us — we&apos;re always checking DMs
          </p>
          <a
            href={INSTA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[0.95rem] font-semibold transition-colors hover:text-brown"
            style={{ color: 'var(--blue)' }}
          >
            @paigesbagels
          </a>
        </div>
      </div>

      {/* Newsletter */}
      <div className="max-w-[900px] mx-auto px-5 pb-12">
        <div
          className="rounded-2xl text-center px-7 py-10 md:px-10 md:py-[52px]"
          style={{ backgroundColor: 'var(--blue)' }}
        >
          <h2
            className="text-[1.6rem] font-black text-white mb-2"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Stay In The Know
          </h2>
          <p
            className="text-[0.9rem] mb-6 max-w-[360px] mx-auto"
            style={{ color: 'rgba(255,255,255,0.7)' }}
          >
            Get notified when new pickup slots drop and new flavors launch.
          </p>

          {status === 'success' ? (
            <p className="text-sm font-semibold text-white">{message}</p>
          ) : (
            <form onSubmit={handleSubscribe} className="flex gap-2.5 max-w-[420px] mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 px-4 py-3.5 text-[0.88rem] text-white outline-none transition-all newsletter-input"
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1.5px solid rgba(255,255,255,0.25)',
                  borderRadius: 0,
                }}
                onFocus={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.6)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.25)'}
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="px-6 py-3.5 font-semibold text-[0.85rem] uppercase tracking-[0.06em] whitespace-nowrap transition-all cursor-pointer"
                style={{
                  backgroundColor: '#fff',
                  color: 'var(--blue)',
                  border: 'none',
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#fff'}
              >
                {status === 'loading' ? '...' : 'Join'}
              </button>
            </form>
          )}
          {status === 'error' && (
            <p className="text-sm text-red-300 mt-3">{message}</p>
          )}
        </div>
      </div>

      {/* Bottom spacer */}
      <div className="h-10" />
    </div>
  );
}
