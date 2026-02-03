'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function ContactPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f6f4f0' }}>
      <div className="max-w-xl mx-auto px-6 py-10">
        {/* Logo Section */}
        <div className="mb-10 flex flex-col items-center">
          <Link href="/">
            <Image
              src="/logo.png"
              alt="Paige's Bagels"
              width={350}
              height={350}
              priority
              className="cursor-pointer"
            />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex justify-center gap-8 mb-10">
          <Link
            href="/about"
            className="font-semibold tracking-widest transition-all hover:scale-105"
            style={{ color: '#004AAD' }}
          >
            ABOUT
          </Link>
          <Link
            href="/order"
            className="font-semibold tracking-widest transition-all hover:scale-105"
            style={{ color: '#004AAD' }}
          >
            ORDER
          </Link>
          <Link
            href="/contact"
            className="font-semibold tracking-widest transition-all"
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
              <p className="font-semibold text-lg mb-2" style={{ color: '#1A1A1A' }}>
                Instagram
              </p>
              <a
                href="https://www.instagram.com/paigesbagels"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#004AAD' }}
                className="text-lg hover:underline"
              >
                @paigesbagels
              </a>
            </div>

            <div className="text-center">
              <p className="font-semibold text-lg mb-2" style={{ color: '#1A1A1A' }}>
                Email
              </p>
              <a
                href="mailto:hello@paigesbagels.com"
                style={{ color: '#004AAD' }}
                className="text-lg hover:underline"
              >
                hello@paigesbagels.com
              </a>
            </div>

            <div className="text-center pt-4">
              <p style={{ color: '#6B6B6B' }}>
                Questions about your order? DM us on Instagram or send us an email!
              </p>
            </div>
          </div>
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
