'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const QUICK_LINKS = [
  { href: '/menu', label: 'Menu' },
  { href: '/order', label: 'Order Now' },
  { href: '/merch', label: 'Merch' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export default function Footer() {
  const pathname = usePathname();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  if (pathname.startsWith('/admin')) return null;

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
    <footer style={{ backgroundColor: '#004aad' }}>
      {/* Top section */}
      <div
        className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-8 text-center md:text-left px-5 py-12 md:px-12 md:py-16"
        style={{ maxWidth: 1100, margin: '0 auto' }}
      >
        {/* Brand */}
        <div className="md:col-span-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-white.svg"
            alt="Paige's Bagels"
            className="h-10 md:h-12 w-auto mx-auto md:mx-0 mb-3"
          />
          <p
            className="text-[0.78rem] font-semibold uppercase tracking-[0.15em] mb-3"
            style={{ color: '#c9a24e' }}
          >
            Seriously Sourdough
          </p>
          <p className="text-[0.82rem] leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Handcrafted sourdough bagels made with five simple ingredients. Naturally fermented,
            boiled &amp; baked fresh.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4
            className="text-[0.78rem] font-bold uppercase tracking-[0.12em] text-white mb-4"
          >
            Quick Links
          </h4>
          <ul className="space-y-2.5">
            {QUICK_LINKS.map(link => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-[0.85rem] transition-opacity hover:opacity-70"
                  style={{ color: 'rgba(255,255,255,0.8)' }}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Connect */}
        <div>
          <h4
            className="text-[0.78rem] font-bold uppercase tracking-[0.12em] text-white mb-4"
          >
            Follow the Bake
          </h4>
          <ul className="space-y-3">
            <li>
              <a
                href="https://instagram.com/paigesbagels"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 text-[0.85rem] transition-opacity hover:opacity-70"
                style={{ color: 'rgba(255,255,255,0.8)' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/>
                </svg>
                @paigesbagels
              </a>
            </li>
            <li>
              <a
                href="mailto:paige@paigesbagels.com"
                className="inline-flex items-center gap-2.5 text-[0.85rem] transition-opacity hover:opacity-70"
                style={{ color: 'rgba(255,255,255,0.8)' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
                paige@paigesbagels.com
              </a>
            </li>
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h4
            className="text-[0.78rem] font-bold uppercase tracking-[0.12em] text-white mb-1.5"
          >
            Stay In The Know
          </h4>
          <p className="text-[0.8rem] mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
            New drops &amp; flavors
          </p>
          {status === 'success' ? (
            <p className="text-[0.85rem] font-medium text-white">{message}</p>
          ) : (
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="flex-1 min-w-0 px-3.5 py-2.5 text-[0.85rem] text-white outline-none transition-all placeholder:text-white/40"
                style={{
                  background: 'transparent',
                  border: '1.5px solid rgba(255,255,255,0.25)',
                  borderRadius: 0,
                }}
                onFocus={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)'}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'}
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="px-4 py-2.5 font-semibold text-[0.8rem] uppercase tracking-[0.06em] whitespace-nowrap transition-all"
                style={{
                  backgroundColor: '#fff',
                  color: '#004aad',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {status === 'loading' ? '...' : 'Join'}
              </button>
            </form>
          )}
          {status === 'error' && (
            <p className="text-[0.78rem] mt-2" style={{ color: '#fca5a5' }}>{message}</p>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div
        className="px-5 md:px-12 py-5"
        style={{ borderTop: '1px solid rgba(255,255,255,0.1)', maxWidth: 1100, margin: '0 auto' }}
      >
        <div className="flex flex-col md:flex-row justify-between items-center gap-2 text-center">
          <p className="text-[0.72rem]" style={{ color: 'rgba(255,255,255,0.4)' }}>
            &copy; 2026 Paige&apos;s Bagels. All rights reserved.
          </p>
          <p className="text-[0.72rem]" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Made with sourdough starter &amp; love
          </p>
        </div>
      </div>
    </footer>
  );
}
