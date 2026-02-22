'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

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
    <div className="min-h-screen" style={{ backgroundColor: '#f6f4f0' }}>
      <div className="max-w-xl mx-auto px-6 pb-10">
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
            className="whitespace-nowrap font-semibold tracking-widest transition-all hover:scale-105"
            style={{ color: '#004AAD' }}
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
            className="whitespace-nowrap font-semibold tracking-widest transition-all"
            style={{ color: '#1A1A1A', borderBottom: '2px solid #004AAD' }}
          >
            CONTACT
          </Link>
        </nav>

        {/* Contact Section */}
        <div
          className="rounded-lg p-6 mb-6"
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E0DB'
          }}
        >
          <h1
            className="text-3xl mb-6 pb-2 text-center"
            style={{
              color: '#1A1A1A',
              borderBottom: '2px solid #004AAD'
            }}
          >
            Get In Touch
          </h1>

          <div className="space-y-6" style={{ color: '#4A4A4A' }}>
            <div className="text-center">
              <p className="font-semibold text-xl md:text-2xl mb-2" style={{ color: '#1A1A1A' }}>
                Instagram
              </p>
              <a
                href="https://www.instagram.com/paigesbagels"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#004AAD' }}
                className="text-xl md:text-2xl hover:underline"
              >
                @paigesbagels
              </a>
            </div>

            <div className="text-center">
              <p className="font-semibold text-xl md:text-2xl mb-2" style={{ color: '#1A1A1A' }}>
                Email
              </p>
              <a
                href="mailto:paige@paigesbagels.com"
                style={{ color: '#004AAD' }}
                className="text-xl md:text-2xl hover:underline"
              >
                paige@paigesbagels.com
              </a>
            </div>

            <div className="text-center pt-4">
              <p className="text-lg md:text-xl" style={{ color: '#6B6B6B' }}>
                Questions about your order? DM us on Instagram or shoot us an email!
              </p>
            </div>
          </div>
        </div>

        {/* In The Know */}
        <div
          className="rounded-lg p-6 mb-6"
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E0DB'
          }}
        >
          <h2
            className="text-xl font-semibold mb-4 text-center"
            style={{ color: '#004AAD' }}
          >
            Stay In The Know
          </h2>
          <p className="text-center text-sm mb-4" style={{ color: '#6B6B6B' }}>
            Get notified when new pickup slots drop and new flavors launch.
          </p>
          {status === 'success' ? (
            <p className="text-center text-sm font-semibold" style={{ color: '#004AAD' }}>{message}</p>
          ) : (
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-blue-500"
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

        {/* Order Button */}
        <Link
          href="/order"
          className="block w-full py-4 px-6 font-semibold rounded-lg text-center transition-all"
          style={{
            backgroundColor: '#004AAD',
            color: '#FFFFFF'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#003A8C'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#004AAD'}
        >
          Order Bagels
        </Link>
      </div>
    </div>
  );
}
